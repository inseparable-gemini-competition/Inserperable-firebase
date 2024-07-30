// src/prompts/languagePrompts.js

import { generateSchema } from "../generateSchema.js";
import { createPromptObject } from "../utils/promptUtils.js";

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

export const getAudioTranscriptionPrompt = (inputData) => {
  const prompt = `I will send you audio and you translate it from ${inputData?.fromLanguage} language to ${inputData?.toLanguage} language`;
  return createPromptObject(prompt);
};

const KEYWORDS = [
  "identify",
  "price",
  "read",
  "donate",
  "taboo",
  "mood",
  "say",
  "plan",
  "shop",
  "impact",
  "tips",
];
export const getAudioCommandPrompt = () => {
  const prompt = `
  Analyze the provided audio file and do the following:
  1. Transcribe and understand the content.
  2. Check if it contains any of these keywords or their meanings:
     ${KEYWORDS.join(", ")}
  
  Return only the matched keyword from the list above.
  If no keyword matches, return "none".
`;
  return createPromptObject(prompt);
};

export const getTranslateAppPrompt = (inputData) => {
  const country = inputData?.country;

  const prompt = `
Translate the values for keys in the 'translations' field of the schema to the language of ${country}.
Also, set 'baseLanguage' as the language code for ${country}, and isRTl which is the language write direction

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
    isRTl: ["boolean", "Is the language RTL?"],
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
        tips: ["string", "Translate: 'Tips'"],
        taboo: ["string", "Translate: 'Taboo'"],
        mood: ["string", "Translate: 'Mood'"],
        tellUsYourMood: ["string", "Translate: 'Tell us your mood'"],
        enterMoodAndDesires: ["string", "Translate: 'Enter mood and desires'"],
        findPlace: ["string", "Translate: 'Find Place'"],
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
        recommending: ["string", "Translate: 'Recommending'"],
      },
    ],
  });

  return createPromptObject(prompt, schema);
};

// Return the prompt object with the schema
export const getTranslatePriorityWordsPrompt = (inputData) => {
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
        close: ["string", "Translate: 'Close'"],
        cancel: ["string", "Translate: 'Cancel'"],
        finish: ["string", "Translate: 'Finish'"],
        previous: ["string", "Translate: 'Previous'"],
        next: ["string", "Translate: 'Next'"],
        recommending: ["string", "Translate: 'Recommending'"],
        fetchingNextQuestion: ["string", "Translate: 'Fetching Next Question'"],
      },
    ],
  });

  return createPromptObject(prompt, schema);

};
