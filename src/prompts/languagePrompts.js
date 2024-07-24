// src/prompts/languagePrompts.js

import { generateDynamicPrompt, createPromptObject } from '../utils/promptUtils';

export const getReadPrompt = (data) => {
  const template = `Determine the language of the text in this image, then translate the text to \${language} language`;
  return createPromptObject(generateDynamicPrompt(template, data));
};

export const getTranslatePrompt = (data) => {
  const template = `Translate the following text to \${targetLanguage} language: \${text}`;
  return createPromptObject(generateDynamicPrompt(template, data));
};