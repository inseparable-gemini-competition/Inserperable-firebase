
import { createPromptObject } from "../utils/promptUtils.js";


export const getIdentifyPrompt = () => {
  const prompt = "Identify the image, give a concise and professional description within four lines. If it's a historical landmark, provide brief information about it and context";
  return createPromptObject(prompt);
};

export const getPricePrompt = (inputData) => {
  const prompt = `Analyze the image to identify the item. If uncertain, provide a reasonable assumption based on visual cues. Determine the fair market price range for the item (or assumed equivalent) in ${inputData?.country} as of 24th july, considering its condition if possible. Respond with the item name (or assumption) followed by the estimated price range in ${inputData?.country} curency, omitting any introductory phrases`;
  return createPromptObject(prompt);
};

export const getReadPrompt = (inputData) => {
  const prompt =  `Determine the language of the text in this image, then translate the text to ${inputData?.language} language`;
  return createPromptObject(prompt);
};