import functions from "firebase-functions";
import { db } from "./firebaseAdmin.js"; // Import initialized Firebase Admin
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEN_AI_KEY = "AIzaSyCrRE67ES56RfBPeTZ4X2ZB7u1_r4Aolsk";

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

        const result = await model.generateContent([
          `What is the primary language spoken in ${user.baseCountry}? Just say the language name with no more introduction.`,
        ]);

        const baseLanguage = result?.response?.candidates[0]?.content?.parts[0]?.text || "en";
        console.log(`Detected language: ${baseLanguage}`);

        await db.collection("users").doc(userId).update({
          baseLanguage: baseLanguage.trim(),
        });

        console.log(`User document updated for user: ${userId}`);
      } catch (error) {
        console.error("Error detecting base language:", error);
      }
    } else {
      console.log('No baseCountry provided in the user document');
    }
  });
