// functions/services/geminiService.js

import { GoogleGenerativeAI } from '@google/generative-ai';
import * as functions from 'firebase-functions';
import { generateSchema } from '../helpers/generateSchema.js';


const GEN_AI_KEY = functions.config().genai.apikey;
const geminiAI = new GoogleGenerativeAI(GEN_AI_KEY);

const constructSearchPhraseSchema = generateSchema(
  "Output for constructed search phrase",
  {
    mood: ["string", "Extracted mood"],
    desires: ["string", "Extracted desires"],
    searchPhrase: ["string", "Constructed search phrase"]
  }
);

export const constructSearchPhrase = async (userMoodAndDesires, country) => {
  console.log('Constructing search phrase:', userMoodAndDesires, country);
  const model = geminiAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: constructSearchPhraseSchema,
    },
  });
  const prompt = `
    Analyze the following user input:
    "${userMoodAndDesires}"

    Extract the user's mood, desires, and any other relevant information. Then, construct a search phrase for finding a place to visit that would suit these factors.
    The phrase should be concise and suitable for a place search API. The place should be in the user's country: ${country}.

    Return your response in the following JSON format:
    {
      "mood": "Extracted mood",
      "desires": "Extracted desires",
      "searchPhrase": "Constructed search phrase"
    }

    Return only the JSON object, without any additional text or explanation.
  `;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Error constructing search phrase:', error);
    throw new Error('Failed to construct search phrase');
  }
};

const recommendBestPlaceSchema = generateSchema(
  "Output for recommended best place",
  {
    name: ["string", "Name of the recommended place"],
    description: ["string", "Description of why this place is recommended"]
  }
);

export const recommendBestPlace = async (searchResults, originalUserInput, country, currentLanguage) => {
  const model = geminiAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 1024,
      responseMimeType: "application/json",
      responseSchema: recommendBestPlaceSchema,
    },
  });
  const prompt = `
    Given the following list of places:
    ${JSON.stringify(searchResults, null, 2)}

    And considering the original user input:
    "${originalUserInput}" and the country is ${country}.

    you must respond in ${currentLanguage} language. if failed for any reason detect user language in the text: "${originalUserInput}"  and respond according to it

    Recommend the best place to visit that aligns with the user's mood and desires. Provide your recommendation in the following JSON format:
    {
      "name": "Name of the recommended place",
      "description": A 6-7 lines description of why this place is recommended, relating it to the user's mood and desires, it must be in ${currentLanguage} or detect ${originalUserInput} language and respond in the same language"
    }

    Return only the JSON object, without any additional text or explanation.
  `;

  try {
    const result = await model.generateContent(prompt);
    return JSON.parse(result.response.text());
  } catch (error) {
    console.error('Error recommending best place:', error);
    throw new Error('Failed to recommend best place');
  }
};