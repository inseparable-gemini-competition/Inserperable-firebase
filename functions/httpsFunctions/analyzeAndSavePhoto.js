import * as functions from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage, db, FieldValue } from "../helpers/firebaseAdmin.js";
import { generateSchema } from "../helpers/generateSchema.js";

// Ensure storage is correctly initialized
const storageInstance = storage();

export const analyzeAndSavePhoto = functions.storage
  .object()
  .onFinalize(async (object) => {
    const filePath = object.name;
    const bucket = storageInstance.bucket(object.bucket);
    const file = bucket.file(filePath);

    try {
      // Get a download URL for the file
      const [url] = await file.getSignedUrl({
        action: "read",
        expires: "03-01-2500",
      });

      // Download the file to get its base64 representation
      const [buffer] = await file.download();
      const base64Image = buffer.toString("base64");

      // Determine the MIME type from the object's contentType
      const mimeType = object.contentType || "image/png"; // Default to image/png if not available

      // Initialize Google Generative AI with the new model
      const genAI = new GoogleGenerativeAI(functions.config().genai.apikey);
      const schema = generateSchema(
        "Describe this travel photo and suggest description and social media captions.",
        {
          description: ["string", "description of the photo"],
          captions: ["array", "array of social media captions captions"],
        }
      );
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig: {
          responseMimeType: "application/json",
          responseSchema: schema,
        },
      });

      const image = {
        inlineData: {
          data: base64Image,
          mimeType: mimeType, // Use the determined MIME type
        },
      };

      const userDoc = await db
        .collection("users")
        .doc(object.metadata.userId)
        .get();

      if (!userDoc.exists) {
        throw new functions.https.HttpsError("not-found", "User not found");
      }
      const baseLanguage = userDoc.data()?.baseLanguage;

      let result;
      const prompt = `Analyze this travel photo and suggest a description and 3-4 social media captions.
         The description should be talking to the user seeing the description..eg: "you are smiling in this picture with your friend", also if there is any remarkable thing about the place tell it and give a brief about it or its history if any.
        The description should be in ${baseLanguage} and the captions strings array should be in both English and ${baseLanguage}.
        `;
      try {
        const tempResult = await model.generateContent([prompt, image]);
        result = JSON.parse(tempResult?.response?.text());
      } catch (error) {
        console.error(
          "Error generating content with Google Generative AI:",
          error
        );
        throw new functions.https.HttpsError(
          "internal",
          "Error generating content with Google Generative AI"
        );
      }

      const photoData = {
        url,
        description: result?.description,
        captions: result?.captions,
        timestamp: FieldValue.serverTimestamp(),
        userId: object.metadata.userId,
        mimeType: mimeType, // Store the MIME type in Firestore
      };

      try {
        await db.collection("photos").add(photoData);
      } catch (error) {
        console.error("Error saving photo data to Firestore:", error);
        throw new functions.https.HttpsError(
          "internal",
          "Error saving photo data to Firestore"
        );
      }

      return { success: true };
    } catch (error) {
      console.error("Error processing photo:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Error processing photo"
      );
    }
  });