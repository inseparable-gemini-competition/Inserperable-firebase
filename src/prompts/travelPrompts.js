// src/prompts/travelPrompts.js

import { generateDynamicPrompt, createPromptObject, getRandomSeed } from '../utils/promptUtils';
import { generateSchema } from '../utils/schemaUtils';

export const getTabooPrompt = (data) => {
  const template = `Using ${getRandomSeed()} as a seed, think of about max diverse cultural taboos you can for \${country}, select one random taboo, and describe it concisely in 3 lines or less, focusing on its significance and how travelers can respectfully avoid it. try to be diversified`;
  return createPromptObject(generateDynamicPrompt(template, data));
};

export const getTibsPrompt = (data) => {
  const template = `Using ${getRandomSeed()} as a random seed, think of 100 unique travel tips for \${selectedType} in \${country}. Then, select 3 truly random tips from this list. Ensure the tips are diverse and not commonly known. Provide only these 3 tips, keeping the total response under 150 words. Do not repeat tips from previous interactions.`;
  return createPromptObject(generateDynamicPrompt(template, data));
};

export const getDonatePrompt = (data) => {
  const template = `Tell me about donation entities or organizations you have to give url, name and description (6 exact lines) for the organization that could benefit from my donation in \${country}`;
  const schema = generateSchema("recommendation donation entity name", {
    name: ["string", "donation entity name"],
    websiteLink: ["string", "donation entity website link"],
    description: ["string", "donation entity 6 lines description"],
  });
  return createPromptObject(generateDynamicPrompt(template, data), schema);
};

export const getSituationPrompt = (data) => {
  const template = `I am in the following situation: \${userSituation}. What should I say in \${country} language?`;
  return createPromptObject(generateDynamicPrompt(template, data));
};

export const getCountryRecommendationPrompt = (data) => {
  const template = `
  Based on the user's preferences and answers provided below, recommend a suitable country for their next travel destination. Exclude their base country (indicated in the answer to question 1) from your recommendation.
  
  User's answers: \${answers}
  Corresponding questions: \${questions}
  
  Please provide the following information in your response:
  
  1. country: Name of the country
  2. flag: Provide the country's flag as a text emoji
  3. description: A concise overview of the country (50-75 words)
  4. mostFamousLandmark: Name of the most iconic landmark
  6. baseLanguage: Based on the user's base country (from question 1), provide his base language.
  `;
  
  const schema = generateSchema("recommendation for country or plan", {
    country: ["string", "recommended country"],
    flag: ["string", "flag"],
    description: ["string", "recommended country description", false, "string"],
    baseLanguage: ["string", "base country language code"],
    mostFamousLandmark: ["string", "most famous landmark for the recommended country"],
  });

  return createPromptObject(generateDynamicPrompt(template, data), schema);
};