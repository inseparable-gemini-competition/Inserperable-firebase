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
        travelAgain: ["string", "Translate: 'Travel Again?'"],
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
        environmentalImpact: ["string", "Translate: 'Daily Environment Test'"],

        // Error and Status Messages
        fetchError: ["string", "Translate: Fetch error message"],
        noHandmadeItems: ["string", "Translate: 'No handmade items available'"],
        noDataAvailable: ["string", "Translate: 'We are cooking up something for you, wait for a while and try again'"],

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
        ecofriendly: ["string", "Translate: 'Eco Friendly"],
        cultural: ["string", "Translate: 'Cultural'"],
        cuisine: ["string", "Translate: 'Cuisine'"],
        safety: ["string", "Translate: 'Safety'"],
        submit: ["string", "Translate: 'Submit'"],
        findingPerfectPlace: ["string", "Translate: 'Finding Perfect Place'"],
        viewOnMap: ["string", "Translate: 'View on Map'"],
        openInUber: ["string", "Translate: 'Open in Uber'"],
        weRecommend: ["string", "Translate: 'We Recommend'"],
        Whattransportationdidyouusetoday: ["string", "Translate: 'What transportation did you use today?'"],
        airplane: ["string", "Translate: 'Airplane'"],
        car: ["string", "Translate: 'Car'"],
        bicycle: ["string", "Translate: 'Bicycle'"],
        walking: ["string", "Translate: 'Walking'"],
        nothing: ["string", "Translate: 'Nothing'"],
        pleaseStartSpeakingAndLongPresToStop: ["string", "Translate: 'Please start speaking and long press to stop'"],
        processing: ["string", "Translate: 'Processing'"],
        identifiedCategory: ["string", "Translate: 'Identified Category'"],
        unidentifiedCategory: ["string", "Translate: 'Unidentified Category'"],
        visiting: ["string", "Translate: 'Visiting'"],
        notVisiting: ["string", "Translate: 'Not Visiting'"],
        impactScore: ["string", "Translate: 'Impact Score'"],
        whereAreYouBased: ["string", "Translate: 'Where are you based?'"],
        areYouCurrentlyTraveling: ["string", "Translate: 'Are you currently traveling?'"],
        whereAreYouNow: ["string", "Translate: 'Where are you now?'"],
        yes:  ["string", "Translate: 'Yes'"],
        no:  ["string", "Translate: 'No'"],
        enterYourAnswerHere: ["string", "Translate: 'Enter your answer here...'"],
        userScoreUpdated: ["string", "Translate: 'User scores updated successfully'"],
        failedToUpdateUserScore: ["string", "Translate: 'Failed to update user score'"],
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
        whereAreYouBased: ["string", "Translate: 'Where are you based?'"],
        areYouCurrentlyTraveling: ["string", "Translate: 'Are you currently traveling?'"],
        whereAreYouNow: ["string", "Translate: 'Where are you now?'"],
        yes:  ["string", "Translate: 'Yes'"],
        no:  ["string", "Translate: 'No'"],
        enterYourAnswerHere: ["string", "Translate: 'Enter your answer here...'"],
      },
    ],
  });

  return createPromptObject(prompt, schema);

};
