import functions from "firebase-functions";
import { db } from "./firebaseAdmin.js"; // Import initialized Firebase Admin
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEN_AI_KEY = functions.config().genai.apikey;

export const translateMessage = functions.firestore
  .document("chatRooms/{roomId}/messages/{messageId}")
  .onCreate(async (snap, context) => {
    const message = snap.data();
    const userId = message.userId; 
    const roomId = context.params.roomId;

    try {
      // Extract user IDs from roomId
      const [userA, userB] = roomId.split('_');
      const otherUserId = userId === userA ? userB : userA;

      // Fetch the base languages for both users
      const otherUserDoc = await db.collection("users").doc(otherUserId).get();
      const otherUser = otherUserDoc.data();
      const otherBaseLanguage = otherUser?.baseLanguage || 'en'; // Default to 'en' if baseLanguage is not found

      // Initialize Google Generative AI model
      const genAI = new GoogleGenerativeAI(GEN_AI_KEY);
      const model = genAI.getGenerativeModel({
        model: "gemini-1.5-flash",
      });

      // Prepare translation request using the receiver's base language
      const result = await model.generateContent([
        `please translate this into ${otherBaseLanguage} and only respond with the translated text, here's the text: ${message.text}`,
      ]);

      const translatedText =
        result?.response.candidates[0].content.parts[0].text || "";

      // Update the message with the translated text
      await db
        .collection("chatRooms")
        .doc(roomId)
        .collection("messages")
        .doc(context.params.messageId)
        .update({ translatedText });
    } catch (error) {
      console.error("Error translating message:", error);
    }
  });
