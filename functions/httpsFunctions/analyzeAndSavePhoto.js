import * as functions from 'firebase-functions';
import { GoogleGenerativeAI } from "@google/generative-ai";
import { storage, db, FieldValue } from '../helpers/firebaseAdmin.js';

// Ensure storage is correctly initialized
const storageInstance = storage();

export const analyzeAndSavePhoto = functions.storage.object().onFinalize(async (object) => {
  const filePath = object.name;
  const bucket = storageInstance.bucket(object.bucket);
  const file = bucket.file(filePath);

  try {
    // Get a download URL for the file
    const [url] = await file.getSignedUrl({
      action: 'read',
      expires: '03-01-2500',
    });

    // Download the file to get its base64 representation
    const [buffer] = await file.download();
    const base64Image = buffer.toString('base64');

    // Initialize Google Generative AI with the new model
    const genAI = new GoogleGenerativeAI(functions.config().genai.apikey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const prompt = "Describe this travel photo and suggest a caption.";
    const image = {
      inlineData: {
        data: base64Image,
        mimeType: "image/png",
      },
    };

    let result;
    try {
      result = await model.generateContent([prompt, image]);
    } catch (error) {
      console.error('Error generating content with Google Generative AI:', error);
      throw new functions.https.HttpsError('internal', 'Error generating content with Google Generative AI');
    }

    const caption = result.response.text();

    const photoData = {
      url,  // Store the download URL instead of base64 image
      caption,
      timestamp: FieldValue.serverTimestamp(),
      userId: object.metadata.userId,
    };

    try {
      await db.collection('photos').add(photoData);
    } catch (error) {
      console.error('Error saving photo data to Firestore:', error);
      throw new functions.https.HttpsError('internal', 'Error saving photo data to Firestore');
    }

    return { success: true, caption };
  } catch (error) {
    console.error('Error processing photo:', error);
    throw new functions.https.HttpsError('internal', 'Error processing photo');
  }
});
