import { getPrompts } from "../helpers/getPrompts.js";
import functions from "firebase-functions";
import { GoogleGenerativeAI } from "@google/generative-ai";
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
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: schema,
      },
    });

    const result = await model.generateContent(prompt);
    const jsonResult = JSON.parse(result?.response?.text());

    return { result: jsonResult };
  } catch (error) {
    const friendlyMessage = getFriendlyErrorMessage(
      "Error generating content:",
      error
    );
    throw new functions.https.HttpsError("internal", friendlyMessage);
  }
});

