import functions from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPrompts } from "../helpers/getPrompts";

const API_KEY = functions.config().genai.apikey;

export const generateStreamContent = functions.https.onCall(
  async (data, context) => {
    // Ensure the user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        "unauthenticated",
        "User must be authenticated to use this function"
      );
    }

    const { promptType, inputData, message } = data;

    try {
      // Initialize the Google Generative AI client
      const genAI = new GoogleGenerativeAI(API_KEY);

      // Get the Gemini model
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

      // Get all prompts using the getPrompts function
      const allPrompts = getPrompts(inputData);

      // Define the prompt
      const promptObject = allPrompts[promptType];
      if (!promptObject) {
        throw new functions.https.HttpsError(
          "invalid-argument",
          `Invalid prompt type: ${promptType}`
        );
      }
      const { prompt } = promptObject;

      // Start the chat with the initial message for the conversation type
      const chat = model.startChat({
        history: [
          {
            role: "user",
            parts: [{ text: prompt }],
          },
        ],
      });

      let result = "";

      // Send the user's message and get the response
      const response = await chat.sendMessage(message);

      // Accumulate the response
      for await (const chunk of response.stream()) {
        result += chunk.text();
      }

      return { result };
    } catch (error) {
      console.error("Error generating content:", error);
      throw new functions.https.HttpsError(
        "internal",
        "Error generating content"
      );
    }
  }
);
