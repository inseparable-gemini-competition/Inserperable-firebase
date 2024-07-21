import functions from "firebase-functions";
import { db } from "./firebaseAdmin.js"; // Import initialized Firebase Admin
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEN_AI_KEY = "AIzaSyCrRE67ES56RfBPeTZ4X2ZB7u1_r4Aolsk";

export const translateMessage = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const userId = message.userId; // Extract userId from message

    try {
      // Fetch user's base language from 'users' collection
      const userDoc = await db.collection("users").doc(userId).get();
      const user = userDoc.data();
      const baseLanguage = user?.baseLanguage || 'en'; // Default to 'en' if baseLanguage is not found

      const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      // Prepare translation request using the user's base language
      const result = await model.generateContent([
        `please translate this into ${baseLanguage} and only respond with the translated text, here's the text: ${message.text}`,
      ]);

      const translatedText =
        result?.response.candidates[0].content.parts[0].text || "";

      await db
        .collection("chatRooms")
        .doc(context.params.roomId)
        .collection("messages")
        .doc(context.params.messageId)
        .update({ translatedText });
    } catch (error) {
      console.error("Error translating message:", error);
    }
  });
