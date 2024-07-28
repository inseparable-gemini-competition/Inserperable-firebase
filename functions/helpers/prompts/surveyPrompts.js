// src/prompts/surveyPrompts.js

import { createPromptObject } from "../utils/promptUtils.js";

export const getNextQuestionCountryPrompt = (inputData) => {
  const prompt = `
As an AI travel survey assistant, generate the next question in a series to help recommend a country for the user to visit, excluding their base country. Each question should be tailored based on previous answers and presented as a JSON object.

Guidelines:
1. Never ask about the user's base country again.
2. Use simple, clear language accessible to a wide audience.
3. Avoid cliché or overly common travel-related questions.
4. Focus on preferences, interests, travel style, budget, and climate preferences.
5. Prefer multiple-choice questions over open-ended ones.
6. Ensure to ask about budget at some point in the survey.
7. Provide only the JSON response, nothing more or less.

JSON Structure:
{
  "id": number,
  "question": string,
  "options": [
    {
      "id": number,
      "option": string
    }
  ],
  "isOpenEnded": boolean
}

For multiple-choice questions, provide 3-5 options. For open-ended questions, set "options" to an empty array and "isOpenEnded" to true.

Example question types:
1. Travel preferences: "What's your ideal vacation pace: relaxed, balanced, or action-packed?"
2. Cultural interests: "Which aspect of foreign cultures interests you most: history, art, cuisine, or local customs?"
3. Activity preferences: "Do you prefer urban exploration, nature adventures, or a mix of both?"
4. Climate preferences: "What's your ideal travel climate: tropical, Mediterranean, alpine, or variable?"
5. Budget considerations: "What's your daily budget range for this trip: $50-100, $100-200, $200-300, or $300+?"

Tailor each new question based on previous responses to build a comprehensive traveler profile. Aim for a mix of specific and broad questions to gather diverse information for making an informed country recommendation.

Your response should be in the ${inputData?.currentLanguage || "English"} language.

If you encounter any issues or if the input data is insufficient, respond with a JSON object containing an "error" field explaining the issue.
`;

  return createPromptObject(prompt);
};




export const getNextQuestionEnvironmentPrompt = (inputData) => {
  const prompt = `
As an AI environmental impact assessor, generate the next question in a series to help calculate the user's environmental impact for today's travel activities. Each question should be tailored based on previous answers and presented as a JSON object.

Guidelines:
1. Use simple, clear language accessible to a wide audience.
2. Focus on today's activities and choices that significantly affect environmental impact.
3. Prefer multiple-choice questions over open-ended ones.
4. Include questions about today's transportation, food choices, activities, energy use, and waste generation.
5. Provide only the JSON response, nothing more or less.

JSON Structure:
{
  "id": number,
  "question": string,
  "options": [
    {
      "id": number,
      "option": string
    }
  ],
  "isOpenEnded": boolean
}

For multiple-choice questions, provide 3-5 options. For open-ended questions, set "options" to an empty array and "isOpenEnded" to true.

Example question types:
1. Today's transportation: "How have you primarily moved around today: walking/cycling, public transport, private car, or tour bus?"
2. Today's meals: "Where have you had most of your meals today: local restaurants, hotel buffet, fast food chains, or self-prepared?"
3. Today's main activity: "What has been your main activity today: city sightseeing, beach visit, nature excursion, or indoor attraction?"
4. Today's energy use: "How much have you used air conditioning or heating in your accommodation today: not at all, a few hours, most of the day, or continuously?"
5. Today's waste generation: "How many disposable items (e.g., plastic bottles, packaging) have you used today: none, 1-3 items, 4-6 items, or more than 6?"

Tailor each new question based on previous responses to build a comprehensive profile of the user's activities and choices for today. Aim for questions that will provide the most relevant information for calculating today's environmental impact.

Your response should be in the ${inputData?.currentLanguage || "English"} language.

If you encounter any issues or if the input data is insufficient, respond with a JSON object containing an "error" field explaining the issue.
`;

  return createPromptObject(prompt);
};