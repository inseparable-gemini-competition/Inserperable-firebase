// src/prompts/imagePrompts.js

import { generateDynamicPrompt, createPromptObject } from '../utils/promptUtils';

export const getIdentifyPrompt = () => {
  const template = "Identify the image, give a concise and professional description within four lines. If it's a historical landmark, provide brief information about it and context";
  return createPromptObject(generateDynamicPrompt(template, {}));
};

export const getPricePrompt = (data) => {
  const template = "Analyze the image to identify the item. If uncertain, provide a reasonable assumption based on visual cues. Determine the fair market price range for the item (or assumed equivalent) in ${country} as of ${date}, considering its condition if possible. Respond with the item name (or assumption) followed by the estimated price range in ${currency}, omitting any introductory phrases";
  return createPromptObject(generateDynamicPrompt(template, data));
};

export const getReadPrompt = (data) => {
  const template = `Determine the language of the text in this image, then translate the text to ${data.language} language`;
  return createPromptObject(generateDynamicPrompt(template, data));
};