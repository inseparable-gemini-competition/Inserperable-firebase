 // functions/services/geminiService.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as functions from 'firebase-functions';

const GEN_AI_KEY = functions.config().genai.apikey;

const geminiAI = new GoogleGenerativeAI(GEN_AI_KEY);

const cleanupJSON = (jsonString) => {
  const start = jsonString.indexOf('{');
  const end = jsonString.lastIndexOf('}');
  
  if (start === -1 || end === -1) {
    throw new Error("No valid JSON object found in the response");
  }
  
  return jsonString.slice(start, end + 1);
};

export const processUserInput = async (input) => {
  const model = geminiAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  console.log('Processing user input:', input);
  const prompt = `
    Analyze the following free-form text and extract location information where the user is likely referring to place names for destination:
  
    ${input}
  
    The text may contain noise or irrelevant information. The model should attempt to extract the most likely place names for the destination. If the exact place names are not found, try to identify the nearest known locations based on the available information.
  
    Please provide:
    1. The most likely place name for the destination (string). If the exact place name is not found, provide the nearest known location.
    3. Any additional context about the locations, such as landmarks or cross streets (string or null)
  
    If absolutely no location information can be extracted, return null for the destination fields.
  
    Format the response as a JSON object with the following keys:
    {
      "destination": string | null,
      "additionalContext": string | null
    }
  `;

  try {
    const result = await model.generateContent([prompt]);
    console.log('result ', result, result.response.text());

    const cleanedResponse = cleanupJSON(result.response.text());
    return JSON.parse(cleanedResponse);
  } catch (error) {
    console.error('Error processing user input with Gemini:', error);
    throw new Error('Failed to process user input');
  }
};

export const processTripWithGemini = async ( destination, priceEstimate) => {
  const model = geminiAI.getGenerativeModel({ model: "gemini-1.5-pro" });
  const prompt = `
    Analyze the following trip details and provide insights:
    Destination: ${destination.formattedAddress}
    Estimated Price: ${priceEstimate.estimate}
    Estimated Duration: ${priceEstimate.duration} seconds

    Please provide:
    1. A brief description of the trip
    2. Any potential traffic or weather concerns
    3. Suggestions for the best time to travel
    4. Any points of interest along the route
  `;

  try {
    const result = await model.generateContent([prompt]);
    return result.response.text();
  } catch (error) {
    console.error('Error processing trip details with Gemini:', error);
    throw new Error('Failed to process trip details');
  }
};