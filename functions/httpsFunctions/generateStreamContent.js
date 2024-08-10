import functions from "firebase-functions";
import {
  GoogleGenerativeAI,
  HarmBlockThreshold,
  HarmCategory,
} from "@google/generative-ai";
import { getPrompts } from "../helpers/getPrompts.js";
import { getFriendlyErrorMessage } from "../helpers/utils/errorHandler.js";

const API_KEY = functions.config().genai.apikey;

export const generateStreamContent = functions.https.onCall(async (data) => {
  const { promptType, inputData, message, audioBase64, audioMimeType } = data;

  console.log("Function triggered with data:", data);

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",

      safetySettings: [
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
    });
    console.log("GoogleGenerativeAI model initialized");

    const allPrompts = getPrompts(inputData);
    console.log("Prompts retrieved:", allPrompts);

    const promptObject = allPrompts[promptType];
    console.log("Selected prompt object:", promptObject);

    if (!promptObject) {
      console.error("Invalid prompt type:", promptType);
      throw new functions.https.HttpsError(
        "invalid-argument",
        `Invalid prompt type: ${promptType}`
      );
    }

    const { prompt } = promptObject;
    console.log("Generated prompt:", prompt);

    const chat = model.startChat({
      history: [{ role: "user", parts: [{ text: prompt }] }],
    });
    console.log("Chat session started");

    let result = "";
    let response;

    if (audioBase64 && audioMimeType) {
      console.log("Audio data provided. Mime type:", audioMimeType);
      const audio = {
        inlineData: {
          data: audioBase64,
          mimeType: audioMimeType,
        },
      };
      response = await chat.sendMessageStream([message, audio]);
      console.log("Sent message with audio data");
    } else {
      console.log("No audio data provided. Sending message only");
      response = await chat.sendMessageStream(message);
    }

    console.log("Streaming response received. Processing...");

    for await (const chunk of response.stream) {
      result += chunk.text();
      console.log("Received chunk:", chunk.text());
    }

    console.log("Final result generated:", result);
    return { result };
  } catch (error) {
    console.error("Error encountered:", error);
    const friendlyMessage = getFriendlyErrorMessage(error);
    console.log("Friendly error message:", friendlyMessage);
    throw new functions.https.HttpsError("internal", friendlyMessage);
  }
});
