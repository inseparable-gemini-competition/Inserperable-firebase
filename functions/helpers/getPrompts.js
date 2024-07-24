// src/getPrompts.js

import { PROMPT_TYPES } from './constants/promptTypes';
import promptConfig from './config/promptConfig';

export const getPrompts = (inputData) => {
  const prompts = {};

  for (const type of Object.values(PROMPT_TYPES)) {
    const config = promptConfig[type];
    if (config) {
      const promptFunction = config.category[config.functionName];
      if (typeof promptFunction === 'function') {
        prompts[type] = promptFunction(inputData);
      } else {
        console.warn(`No prompt function found for type: ${type}`);
      }
    } else {
      console.warn(`No configuration found for prompt type: ${type}`);
    }
  }

  return prompts;
};