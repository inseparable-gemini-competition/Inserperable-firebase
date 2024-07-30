import functions from "firebase-functions";
import { db } from "../helpers/firebaseAdmin.js"; // Import initialized Firebase Admin
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFriendlyErrorMessage } from "../helpers/utils/errorHandler.js";

const GEN_AI_KEY = functions.config().genai.apikey;

export const detectBaseLanguage = functions.firestore
  .document("users/{userId}")
  .onCreate(async (snap, context) => {
    const user = snap.data();
    const userId = context.params.userId;

    if (user.baseCountry) {
      try {
        console.log(`Detecting language for country: ${user.baseCountry}`);

        const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
        const model = genAI.getGenerativeModel({
          model: "gemini-1.5-flash",
        });

        const languageQuery = `
        Identify the primary official language of ${user.baseCountry}.
        
        Requirements:
        1. Provide only the name of the language.
        2. If multiple official languages exist, list only the most widely spoken one.
        3. Use the English name for the language.
        4. Do not include any introductory text, explanations, or punctuation.
        
        Example responses:
        English
        Spanish
        Mandarin Chinese
        `;

        const result = await model.generateContent([languageQuery]);

        const baseLanguage =
          result?.response?.candidates[0]?.content?.parts[0]?.text || "en";
        console.log(`Detected language: ${baseLanguage}`);

        await db.collection("users").doc(userId).update({
          baseLanguage: baseLanguage.trim(),
        });

        console.log(`User document updated for user: ${userId}`);
      } catch (error) {
        const friendlyMessage = getFriendlyErrorMessage(
          "Error generating content:",
          error
        );
        throw new functions.https.HttpsError("internal", friendlyMessage);
      }
    } else {
      console.log("No baseCountry provided in the user document");
    }
  });
