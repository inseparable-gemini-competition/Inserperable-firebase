import { PROMPT_TYPES } from "../constants/promptTypes.js";
import * as travelPrompts from "../prompts/travelPrompts.js";
import * as languagePrompts from "../prompts/languagePrompts.js";
import * as imagePrompts from "../prompts/imagePrompts.js";
import * as surveyPrompts from "../prompts/surveyPrompts.js";

export default {
  [PROMPT_TYPES.TABOO]: {
    category: travelPrompts,
    functionName: "getTabooPrompt",
  },
  [PROMPT_TYPES.DONATE]: {
    category: travelPrompts,
    functionName: "getDonatePrompt",
  },
  [PROMPT_TYPES.READ]: {
    category: imagePrompts,
    functionName: "getReadPrompt",
  },
  [PROMPT_TYPES.IDENTIFY]: {
    category: imagePrompts,
    functionName: "getIdentifyPrompt",
  },
  [PROMPT_TYPES.PRICE]: {
    category: imagePrompts,
    functionName: "getPricePrompt",
  },
  [PROMPT_TYPES.SITUATION]: {
    category: travelPrompts,
    functionName: "getSituationPrompt",
  },
  [PROMPT_TYPES.TIBS]: {
    category: travelPrompts,
    functionName: "getTibsPrompt",
  },
  [PROMPT_TYPES.TRANSLATE]: {
    category: languagePrompts,
    functionName: "getTranslatePrompt",
  },
  [PROMPT_TYPES.TRANSLATE_APP]: {
    category: languagePrompts,
    functionName: "getTranslateAppPrompt",
  },
  [PROMPT_TYPES.TRANSLATE_PRIORITY]: {
    category: languagePrompts,
    functionName: "getTranslatePriorityWordsPrompt",
  },
  [PROMPT_TYPES.SURVEY_QUESTION_COUNTRY]: {
    category: surveyPrompts,
    functionName: "getNextQuestionCountryPrompt",
  },
  [PROMPT_TYPES.COUNTRY_RECOMMENDATION]: {
    category: travelPrompts,
    functionName: "getCountryRecommendationPrompt",
  },
  [PROMPT_TYPES.ENVIRONMENTAL_IMPACT]: {
    category: travelPrompts,
    functionName: "getEnvironmentalImpactPrompt",
  },
  [PROMPT_TYPES.NEXT_QUESTION_COUNTRY]: {
    category: surveyPrompts,
    functionName: "getNextQuestionCountryPrompt",
  },
  [PROMPT_TYPES.NEXT_QUESTION_ENVIRONMENT]: {
    category: surveyPrompts,
    functionName: "getNextQuestionEnvironmentPrompt",
  },
  [PROMPT_TYPES.AUDIO_COMMAND]: {
    category: languagePrompts,
    functionName: "getAudioCommandPrompt",
  },
  [PROMPT_TYPES.COUNTRY_DATA]: {
    category: travelPrompts,
    functionName: "getCountryDataPrompt",
  },
};
