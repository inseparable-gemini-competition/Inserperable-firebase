
import { createPromptObject } from "../utils/promptUtils.js";

export const getNextQuestionCountryPrompt = (inputData) => {
  const prompt = ` according to the previous answers which is: ${inputData.answers} and questions which is ${inputData.questions}, ask the next question to recommend a country to visit 
As an AI travel survey assistant, generate the next question in a series to help recommend a country for the user to visit, excluding their base country. Each question should be tailored based on previous answers and presented as a JSON object.

Guidelines:
1. Never ask about the user's base country again.
2. Use simple, clear language accessible to a wide audience.
3. Avoid cliché or overly common travel-related questions.
4. Focus on preferences, interests, travel style, budget, and climate preferences.
5. Prefer multiple-choice questions over open-ended ones.
6. Ensure to ask about budget at some point in the survey.
7. Provide only the JSON response, nothing more or less.
8. use wide variation of questions.
9. Ensure no questions are repeated.
10. options should be short and clear.


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


Try to tailor each new question based on previous responses to build a comprehensive traveler profile. Aim for a mix of specific and broad questions to gather diverse information for making an informed country recommendation.

Your response should be in the ${inputData?.currentLanguage || "English"} language. even if another language was used before

If you encounter any issues or if the input data is insufficient, respond with a JSON object containing an "error" field explaining the issue.

always check the context and check what you asked and aske the rest of questions, and make sure to ask about the budget, climate, activity, cultural, and travel preferences.
`;

  return createPromptObject(prompt);
};




export const getNextQuestionEnvironmentPrompt = (inputData) => {
  const country = inputData?.country || "the country you are visiting";

  const prompt = `
  these questions are already asked ${JSON.stringify(inputData?.questions)}, generate the next engaging and innovative question in a series to assess the user's daily environmental impact while traveling in ${country}.

  As an AI environment impact survey assistant while traveling, your task is to create the next question in a series of 7 questions, ensuring no repetition and maintaining high engagement.

  Guidelines:
  1. Use simple, clear language accessible to a wide audience.
  2. Focus on today's activities and choices that significantly affect the user's environmental impact.
  3. Prefer multiple-choice questions over open-ended ones.
  4. Provide only the JSON response, nothing more or less.
  5. Ensure no questions are repeated.
  6. Your response should be in the ${inputData?.currentLanguage || "English"} language.
  7. Always include "Nothing" as an option in the multiple-choice questions.
  8. options should be short and clear.


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

  If you encounter any issues or if the input data is insufficient, respond with a JSON object containing an "error" field explaining the issue.
  `;

  return createPromptObject(prompt);
};
