import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import * as functions from 'firebase-functions';

const GEN_AI_KEY = functions.config().genai.apikey;
const geminiAI = new GoogleGenerativeAI(GEN_AI_KEY);

// Manually written schema for constructing the search phrase
const constructSearchPhraseSchema = {
  type: "object",
  properties: {
    mood: {
      type: "string",
      description: "Extracted mood"
    },
    desires: {
      type: "string",
      description: "Extracted desires"
    },
    searchPhrase: {
      type: "string",
      description: "Constructed search phrase"
    }
  },
  required: ["mood", "desires", "searchPhrase"]
};

// Manually written schema for recommending the best places
const recommendBestPlacesSchema = {
  type: "object",
  properties: {
    recommendations: {
      type: "array",
      items: {
        type: "object",
        properties: {
          name: {
            type: "string",
            description: "Name of the recommended place"
          },
          description: {
            type: "string",
            description: "Description of why this place is recommended"
          }
        },
        required: ["name", "description"]
      }
    }
  },
  required: ["recommendations"]
};

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
    If the user wants info about a specific place, provide it to them and make the search phrase for that place.

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

export const recommendBestPlaces = async (searchResults, originalUserInput, country, currentLanguage) => {
  const model = geminiAI.getGenerativeModel({ 
    model: "gemini-1.5-flash",
    generationConfig: {
      temperature: 0.7,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048,
      responseMimeType: "application/json",
      responseSchema: recommendBestPlacesSchema,
    },
    safetySettings: [
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
    ],
  });

  const prompt = `
    Given the following list of places:
    ${JSON.stringify(searchResults, null, 2)}

    And considering the original user input:
    "${originalUserInput}" and the country is ${country}.

    You must respond in ${currentLanguage} language. If failed for any reason, detect user language in the text: "${originalUserInput}" and respond according to it.
    Recommend the 3 best places to visit that align with the user's mood and desires. IMPORTANT: Only recommend real, existing places in Dubai that can be found on Google Maps. Use the exact names from the provided list of places. Don't replicate places. Provide your recommendations in the following JSON format:
    {
      "recommendations": [
        {
          "name": "Exact name of the recommended place from the list",
          "description": "A 4-5 lines description of why this place is recommended, relating it to the user's mood and desires"
        },
        {
          "name": "Exact name of the second recommended place from the list",
          "description": "A 4-5 lines description of why this place is recommended, relating it to the user's mood and desires"
        },
        {
          "name": "Exact name of the third recommended place from the list",
          "description": "A 4-5 lines description of why this place is recommended, relating it to the user's mood and desires"
        }
      ]
    }
    If the user wants info about a specific place, provide it to them. If they are asking about one place specifically, just give them one item in the recommendations array with the name and description answering the user's question and giving a briefing about the place.

    Return only the JSON object, without any additional text or explanation. The answer should be in proper JSON.
     You must respond in ${currentLanguage} language.
  `;

  try {
    const result = await model.generateContent(prompt);
    const jsonResponse = JSON.parse(result.response.text());
    return jsonResponse.recommendations;
  } catch (error) {
    console.error('Error recommending best places:', error);
    throw new Error('Failed to recommend best places');
  }
};
