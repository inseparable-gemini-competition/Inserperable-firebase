import { createPromptObject } from "../utils/promptUtils.js";

export const getIdentifyPrompt = (inputData) => {
  const prompt = `
Examine the image and provide an insightful identification and description. If it's a historical landmark, include a brief interesting fact about it.

Please provide the following in ${inputData?.currentLanguage}:
1. Main subject identification (with confidence level: low/medium/high)
2. A concise, engaging description (within 300 characters)
3. For landmarks: location and one intriguing historical detail
4. Max Response is 8 lines.

Guidelines:
- Be informal like you are a real tourist guide sharing local insights.
- you must response in ${inputData?.currentLanguage}.


Aim to capture the essence of the image in a way that sparks curiosity.
`;

  return createPromptObject(prompt);
};

export const getPricePrompt = (inputData) => {
  const prompt = `
Analyze the image to identify the main item(s) and estimate their fair market value in ${inputData?.country} as of today. If uncertain, provide a reasonable assumption based on visual cues.

In ${inputData?.currentLanguage}, please provide:
1. Item identification (with confidence level: low/medium/high)
2. Estimated price range in ${inputData?.country}'s currency
3. A brief, interesting insight about the item's value or market trends, be interesting and engaging
4. Max Response is 8 lines.


Guidelines:
- Format price range as: [lower bound] - [upper bound] [currency code]
- Consider factors like brand, condition, and current market trends
- Be informal like you are a real tourist guide sharing local insights.
- you must response in ${inputData?.currentLanguage}.


Strive to make your valuation both informative and intriguing to the user.
`;

  return createPromptObject(prompt);
};

export const getReadPrompt = (inputData) => {
  const prompt = `
Analyze the text in the image and provide a translation to ${inputData?.currentLanguage}. This task combines language detection, transcription, and translation skills.

Please provide the following:
1. Identified language(s) in the image
2. Transcription of the original text
3. Translation to ${inputData?.currentLanguage}
4. Confidence levels for language detection and translation (low/medium/high)
5. A brief note on any interesting linguistic or cultural aspect of the text
6. Max Response is 8 lines.

Format your response as:
Text Block 1:
Original Language: [language name] (Confidence: [level])
Original Text: [transcribed text]
Translation (Confidence: [level]): [translated text]
Cultural/Linguistic Note: [brief interesting observation]

[Repeat for additional text blocks if present]

- Be informal like you are a real tourist guide sharing local insights.
- you must response in ${inputData?.currentLanguage}.



Aim to make the translation process engaging by highlighting any unique or intriguing aspects of the text or language.
`;

  return createPromptObject(prompt);
};
