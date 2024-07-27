// src/prompts/languagePrompts.js

import { generateSchema } from "../generateSchema.js";
import { createPromptObject } from "../utils/promptUtils.js";

export const getTranslatePrompt = (inputData) => {
  const prompt = `Translate the following text to ${inputData?.targetLanguage || ""} language: ${inputData?.text} || ""`;
  return createPromptObject(prompt);
};


export const getTranslateAppPrompt = (inputData) => {
  console.log("inputData", inputData);

  
// Define the prompt
const prompt = `
Translate the values for keys in the 'translations' field of the schema to the language of ${inputData?.country || "England"}.
Also, set 'baseLanguage' as the language code for ${inputData?.country || "England"}.
`;

// Define the schema structure
const schema = generateSchema(prompt,{
  baseLanguage: ["string", "Base language code (e.g., 'en' for English)"],
  translations: ["object", "Object containing all translation keys", false, {
    identify: ["string", "Translate: 'Identify'"],
    fairPrice: ["string", "Translate: 'Fair Price'"],
    read: ["string", "Translate: 'Read'"],
    donate: ["string", "Translate: 'Donate'"],
    plan: ["string", "Translate: 'Plan'"],
    shop: ["string", "Translate: 'Shop'"],
    permissionText: ["string", "Translate: Camera permission request text"],
    grantPermission: ["string", "Translate: 'Grant Permission'"],
    seeMore: ["string", "Translate: 'See More'"],
    seeLess: ["string", "Translate: 'See Less'"],
    analyzing: ["string", "Translate: 'Analyzing...'"],
    survey: ["string", "Translate: 'Survey'"],
    donationInfo: ["string", "Translate: 'Donation Info'"],
    viewInGoogleTranslate: ["string", "Translate: 'View in Google Translate'"],
    close: ["string", "Translate: 'Close'"],
    recognizing: ["string", "Translate: 'Recognizing your command...'"],
    cancel: ["string", "Translate: 'Cancel'"],
    cancelAutoCapture: ["string", "Translate: 'Cancel auto capture'"],
    youHave10Seconds: ["string", "Translate: '10 seconds' countdown"],
    validCommand: ["string", "Translate: 'Valid command:'"],
    invalidCommand: ["string", "Translate: 'Invalid or repeated command ignored:'"],
    country: ["string", "Translate: 'Country'"],
    adventure: ["string", "Translate: 'Adventure'"],
    romance: ["string", "Translate: 'Romance'"],
    culturalExploration: ["string", "Translate: 'Cultural Exploration'"],
    relaxation: ["string", "Translate: 'Relaxation'"],
    familyFun: ["string", "Translate: 'Family Fun'"],
    foodDining: ["string", "Translate: 'Food & Dining'"],
    shopping: ["string", "Translate: 'Shopping'"],
    loading: ["string", "Translate: 'Loading...'"],
    openInGoogleMaps: ["string", "Translate: 'Open In Google Maps'"],
    handmadeItems: ["string", "Translate: 'Handmade Items'"],
    carbonFootprint: ["string", "Translate: 'Carbon Footprint'"],
    contactSeller: ["string", "Translate: 'Contact Seller'"],
    fetchError: ["string", "Translate: Fetch error message"],
    loadingMore: ["string", "Translate: 'Loading more...'"],
    noHandmadeItems: ["string", "Translate: 'No handmade items available'"],
    environmentalImpact: ["string", "Translate: 'Env Impact'"],
    whatToSay: ["string", "Translate: 'What to say?'"],
    tabooInfo: ["string", "Translate: 'Taboo'"],
    enterSituation: ["string", "Translate: 'Enter Situation'"],
    noDataAvailable: ["string", "Translate: 'No data available' message"],
    selectTipType: ["string", "Translate: 'Select Tip Type'"],
    fetchingTips: ["string", "Translate: 'Fetching Tips'"],
    fetchingResponse: ["string", "Translate: 'Fetching Response'"],
    fetchingDonationInfo: ["string", "Translate: 'Fetching Donation Info'"],
    fetchingTaboos: ["string", "Translate: 'Fetching Taboos'"],
    finish: ["string", "Translate: 'Finish'"],
    previous: ["string", "Translate: 'Previous'"],
    next: ["string", "Translate: 'Next'"],
    fetchingNextQuestion: ["string", "Translate: 'Fetching Next Question'"],
    calculatingImpact: ["string", "Translate: 'Calculating Impact'"],
    yourEnvironmentalImactScore: ["string", "Translate: 'Your Environmental Impact Score'"],
    recommedning: ["string", "Translate: 'Recommending'"],

  }]
});

// Task: Translate all the values in the 'translations' field to the language of the specified country
// Also, update the 'detectedLanguage' field with the appropriate language code for that country
  return createPromptObject(prompt, schema);
};
