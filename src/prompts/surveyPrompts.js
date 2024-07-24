// src/prompts/surveyPrompts.js

import { generateDynamicPrompt, createPromptObject } from '../utils/promptUtils';

export const getNextQuestionCountryPrompt = () => {
  const prompt = `Generate a series of diverse, creative questions to help recommend a country for the user to visit, excluding their base country. Each question should be based on previous answers and presented as a JSON object. Continue asking questions until explicitly told to stop.
  Rules:
  1. Never ask about the user's base country again.
  2. Use simple English.
  3. Avoid cliché or overly common travel-related questions.
  4. ask questions about  preferences, interests, travel style, budget, climate preferences.
  5. ask multiple-choice more than open-ended questions.
  6- you must ask about budget
  7. just reply with the JSON, no more no less. It's of critical important to only repeat with JSON
  
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
  
  Example questions:
  1. "What's your ideal vacation pace: relaxed, balanced, or action-packed?"
  2. "Which cuisine excites you the most: Mediterranean, Asian, Latin American, or something else?"
  3. "Describe your perfect travel day in a few words."
  
  Tailor subsequent questions based on previous responses to build a comprehensive traveler profile. Aim for a mix of specific and broad questions to gather diverse information for making an informed country recommendation.
  And again it's curcial to respond only with JSON
  `;
  return createPromptObject(prompt);
};