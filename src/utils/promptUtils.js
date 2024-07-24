// src/utils/promptUtils.js

export const generateDynamicPrompt = (template, data) => {
    return template.replace(/\${(.*?)}/g, (_, key) => {
      return data[key] || '';
    });
  };
  
  export const createPromptObject = (prompt, schema = null) => ({
    prompt,
    schema,
  });
  
  export const getRandomSeed = () => Date.now();