// Import required modules
import {
  detectBaseLanguage,
  generateTravelPlan,
  calculateCarbonFootprint,
  translateMessage,
} from "./firestoreFunctions/index.js";
import {
  generateJsonContent,
  generateStreamContent,
  generateText,
  scheduleTrip,
} from "./httpsFunctions/index.js";

// Export functions
export {
  generateTravelPlan,
  calculateCarbonFootprint,
  translateMessage,
  detectBaseLanguage,
  generateJsonContent,
  generateStreamContent,
  generateText,
  scheduleTrip,
};
