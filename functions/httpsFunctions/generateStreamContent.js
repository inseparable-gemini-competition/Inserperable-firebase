import functions from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getPrompts } from "../helpers/getPrompts.js";

const API_KEY = functions.config().genai.apikey;

export const generateStreamContent = functions.https.onCall(async (data) => {
  const { promptType, inputData, message } = data;

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const allPrompts = getPrompts(inputData);
    const promptObject = allPrompts[promptType];

    if (!promptObject) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid prompt type: ${promptType}`
      );
    }

    const { prompt } = promptObject;

    const chat = model.startChat({
      history: [
        { role: "user", parts: [{ text: prompt }] },
      ],
    });

    let result = "";
    const response = await chat.sendMessageStream(message);
    
    for await (const chunk of response.stream) {
      result += chunk.text();
    }

    return { result };

  } catch (error) {
    console.error("Error generating content:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error generating content: " + JSON.stringify(error)
    );
  }
});