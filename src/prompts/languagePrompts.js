// src/prompts/languagePrompts.js

import { createPromptObject } from "../utils/promptUtils";

export const getTranslatePrompt = (inputData) => {
  const prompt = `Translate the following text to ${inputData?.targetLanguage} language: ${inputData?.text}`;
  return createPromptObject(prompt);
};
