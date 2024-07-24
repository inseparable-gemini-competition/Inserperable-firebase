// src/utils/promptUtils.js

  export const createPromptObject = (prompt, schema = null) => ({
    prompt,
    schema,
  });
  
  export const getRandomSeed = () => Date.now();