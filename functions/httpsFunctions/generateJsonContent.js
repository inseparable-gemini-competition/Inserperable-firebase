import { getPrompts } from "../helpers/getPrompts.js";
import functions from "firebase-functions";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { getFriendlyErrorMessage } from "../helpers/utils/errorHandler.js";

export const generateJsonContent = functions.https.onCall(async (data) => {
  const { promptType, inputData } = data;

  // Get all prompts using the getPrompts function
  const allPrompts = getPrompts(inputData);

  // Define the prompt and schema
  const promptObject = allPrompts[promptType];
  if (!promptObject) {
    throw new functions.https.HttpsError(
      "invalid-argument",
      `Invalid prompt type: ${promptType}`
    );
  }
  const { prompt, schema } = promptObject;

  // Initialize the Google Generative AI client
  const genAI = new GoogleGenerativeAI(functions.config().genai.apikey);

  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
      safetySettings: [
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
          threshold: HarmBlockThreshold.BLOCK_NONE,
        },
        {
          category: HarmCategory.HARM_CATEGORY_HARASSMENT,
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
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = await model.generateContent(prompt);
    const jsonResult = JSON.parse(result?.response?.text());

    return { result: jsonResult };
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(error);

    throw new functions.https.HttpsError("internal", friendlyMessage);
  }
});
