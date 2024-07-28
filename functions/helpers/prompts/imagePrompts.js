import { createPromptObject } from "../utils/promptUtils.js";
import { generateSchema } from "../generateSchema.js";

export const getTranslatePrompt = (inputData) => {
  const text = inputData?.text || "";
  const targetLanguage = inputData?.targetLanguage || "English";
  const formalityLevel = inputData?.formalityLevel || "neutral";

  const prompt = `
Translate the following text to ${targetLanguage}:
Text: ${text}

Please consider the following:
1. Use a ${formalityLevel} tone.
2. If the translation exceeds 1000 characters, provide a summary instead.
3. Maintain the original meaning and context as much as possible.

Translated text:
`;

  return createPromptObject(prompt);
};

export const getTranslateAppPrompt = (inputData) => {
  const country = inputData?.country;

  const prompt = `
Translate the values for keys in the 'translations' field of the schema to the language of ${country}.
Also, set 'baseLanguage' as the language code for ${country}.

Please adhere to the following guidelines:
1. Maintain a consistent tone and style across all translations.
2. Consider cultural context and local idioms when translating.
3. For words that may have different forms (singular/plural or gender-specific), provide the most commonly used form.
4. If a direct translation is not suitable, provide a culturally appropriate alternative and add a comment explaining the change.

Translation instructions:
`;

  // Define the schema structure with optimized readability
  const schema = generateSchema(prompt, {
    baseLanguage: ["string", "Base language code (e.g., 'en' for English)"],
    translations: [
      "object",
      "Object containing all translation keys",
      false,
      {
        // User Interface Elements
        identify: ["string", "Translate: 'Identify'"],
        fairPrice: ["string", "Translate: 'Fair Price'"],
        read: ["string", "Translate: 'Read'"],
        donate: ["string", "Translate: 'Donate'"],
        plan: ["string", "Translate: 'Plan'"],
        shop: ["string", "Translate: 'Shop'"],
        close: ["string", "Translate: 'Close'"],
        cancel: ["string", "Translate: 'Cancel'"],
        finish: ["string", "Translate: 'Finish'"],
        previous: ["string", "Translate: 'Previous'"],
        next: ["string", "Translate: 'Next'"],
        seeMore: ["string", "Translate: 'See More'"],
        seeLess: ["string", "Translate: 'See Less'"],

        // Action States
        analyzing: ["string", "Translate: 'Analyzing...'"],
        loading: ["string", "Translate: 'Loading...'"],
        loadingMore: ["string", "Translate: 'Loading more...'"],
        recognizing: ["string", "Translate: 'Recognizing your command...'"],

        // Permissions and Instructions
        permissionText: ["string", "Translate: Camera permission request text"],
        grantPermission: ["string", "Translate: 'Grant Permission'"],
        cancelAutoCapture: ["string", "Translate: 'Cancel auto capture'"],
        youHave10Seconds: ["string", "Translate: '10 seconds' countdown"],

        // Command Feedback
        validCommand: ["string", "Translate: 'Valid command:'"],
        invalidCommand: [
          "string",
          "Translate: 'Invalid or repeated command ignored:'",
        ],

        // Categories and Features
        survey: ["string", "Translate: 'Survey'"],
        donationInfo: ["string", "Translate: 'Donation Info'"],
        country: ["string", "Translate: 'Country'"],
        adventure: ["string", "Translate: 'Adventure'"],
        romance: ["string", "Translate: 'Romance'"],
        culturalExploration: ["string", "Translate: 'Cultural Exploration'"],
        relaxation: ["string", "Translate: 'Relaxation'"],
        familyFun: ["string", "Translate: 'Family Fun'"],
        foodDining: ["string", "Translate: 'Food & Dining'"],
        shopping: ["string", "Translate: 'Shopping'"],

        // External Actions
        viewInGoogleTranslate: [
          "string",
          "Translate: 'View in Google Translate'",
        ],
        openInGoogleMaps: ["string", "Translate: 'Open In Google Maps'"],

        // Product Information
        handmadeItems: ["string", "Translate: 'Handmade Items'"],
        carbonFootprint: ["string", "Translate: 'Carbon Footprint'"],
        contactSeller: ["string", "Translate: 'Contact Seller'"],
        environmentalImpact: ["string", "Translate: 'Env Impact'"],

        // Error and Status Messages
        fetchError: ["string", "Translate: Fetch error message"],
        noHandmadeItems: ["string", "Translate: 'No handmade items available'"],
        noDataAvailable: ["string", "Translate: 'No data available' message"],

        // User Interaction Prompts
        whatToSay: ["string", "Translate: 'What to say?'"],
        tabooInfo: ["string", "Translate: 'Taboo'"],
        enterSituation: ["string", "Translate: 'Enter Situation'"],
        selectTipType: ["string", "Translate: 'Select Tip Type'"],

        // Processing States
        fetchingTips: ["string", "Translate: 'Fetching Tips'"],
        fetchingResponse: ["string", "Translate: 'Fetching Response'"],
        fetchingDonationInfo: ["string", "Translate: 'Fetching Donation Info'"],
        fetchingTaboos: ["string", "Translate: 'Fetching Taboos'"],
        fetchingNextQuestion: ["string", "Translate: 'Fetching Next Question'"],
        calculatingImpact: ["string", "Translate: 'Calculating Impact'"],

        // Results and Recommendations
        yourEnvironmentalImactScore: [
          "string",
          "Translate: 'Your Environmental Impact Score'",
        ],
        recommedning: ["string", "Translate: 'Recommending'"],
      },
    ],
  });

  return createPromptObject(prompt, schema);
};

export const getIdentifyPrompt = (inputData) => {
  const prompt = `
Examine the image and provide an insightful identification and description. If it's a historical landmark, include a brief interesting fact about it.

Please provide the following in ${inputData?.currentLanguage}:
1. Main subject identification (with confidence level: low/medium/high)
2. A concise, engaging description (within 300 characters)
3. For landmarks: location and one intriguing historical detail

Guidelines:
- Be informal like you are a real tourist guide sharing local insights.


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

Guidelines:
- Format price range as: [lower bound] - [upper bound] [currency code]
- Consider factors like brand, condition, and current market trends
- Be informal like you are a real tourist guide sharing local insights.

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

Format your response as:
Text Block 1:
Original Language: [language name] (Confidence: [level])
Original Text: [transcribed text]
Translation (Confidence: [level]): [translated text]
Cultural/Linguistic Note: [brief interesting observation]

[Repeat for additional text blocks if present]

- Be informal like you are a real tourist guide sharing local insights.


Aim to make the translation process engaging by highlighting any unique or intriguing aspects of the text or language.
`;

  return createPromptObject(prompt);
};
