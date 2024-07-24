import { getPrompts } from "../helpers/getPrompts";
import { functions } from "firebase-functions";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

export const generateText = functions.https.onCall(async (data, context) => {
  // Ensure the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      "unauthenticated",
      "User must be authenticated to use this function"
    );
  }

  const { base64Image, modelType, promptType, inputData } = data;

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

  const genAI = new GoogleGenerativeAI(functions.config().genai.apikey);

  const model = genAI.getGenerativeModel({
    model: modelType ?? "gemini-1.5-pro",
    safetySettings: [
      {
        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
      {
        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
        threshold: HarmBlockThreshold.BLOCK_NONE,
      },
    ],
    generationConfig: {
      temperature: 1,
    },
  });

  try {
    let result;
    if (base64Image) {
      const image = {
        inlineData: {
          data: base64Image,
          mimeType: "image/png",
        },
      };
      result = await model.generateContent([prompt, image]);
    } else {
      result = await model.generateContent([prompt]);
    }

    return { result: result?.response?.text() };
  } catch (error) {
    console.error("Error generating content:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error generating content"
    );
  }
});