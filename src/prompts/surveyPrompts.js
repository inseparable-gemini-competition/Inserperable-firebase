// src/prompts/surveyPrompts.js

import { createPromptObject } from "../utils/promptUtils";

export const getNextQuestionCountryPrompt = () => {
  const prompt = `Generate a series of questions to help calculate the user's environmental impact for their travel plans. Each question should be based on previous answers and presented as a JSON object. Continue asking questions until explicitly told to stop.
  Rules:
  1. Use simple English.
  2. Focus on aspects of the trip that affect the environment.
  3. Ask multiple-choice questions more than open-ended questions.
  4. Include questions about transportation, accommodation, activities, waste, and energy use.
  5. just reply with the JSON, no more no less. It's of critical important to only repeat with JSON
  
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
  1. "What mode of transport do you plan to use?"
  2. "How long is your planned stay?"
  3. "What type of accommodation will you be staying in?"
  
  Tailor subsequent questions based on previous responses to build a comprehensive profile of the user's travel plans. Aim for a mix of specific and broad questions to gather diverse information for making an informed impact calculation.
  And again it's curcial to respond only with JSON
  `;

  return createPromptObject(prompt);
};

export const getNextQuestionEnvironmentPrompt = () => {
  const prompt = `Generate a series of questions to help calculate the user's environmental impact for their travel plans. Each question should be based on previous answers and presented as a JSON object. Continue asking questions until explicitly told to stop.
  Rules:
  1. Use simple English.
  2. Focus on aspects of the trip that affect the environment.
  3. Ask multiple-choice questions more than open-ended questions.
  4. Include questions about transportation, accommodation, activities, waste, and energy use.
  5. just reply with the JSON, no more no less. It's of critical important to only repeat with JSON
  
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
  1. "What mode of transport do you plan to use?"
  2. "How long is your planned stay?"
  3. "What type of accommodation will you be staying in?"
  
  Tailor subsequent questions based on previous responses to build a comprehensive profile of the user's travel plans. Aim for a mix of specific and broad questions to gather diverse information for making an informed impact calculation.
  And again it's curcial to respond only with JSON
  `;

  return createPromptObject(prompt);
};
