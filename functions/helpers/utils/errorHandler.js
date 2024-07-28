// functions/helpers/utils/errorHandler.js

export const getFriendlyErrorMessage = (error) => {
  console.error('Original error:', error);  // Log the original error for debugging

  const errorMessages = {
    'geocoding': "Oops! We couldn't pinpoint that location. Could you try a more specific place name?",
    'places_search': "We're having trouble finding places right now. How about we give it another try?",
    'gemini_processing': "Our AI assistant is a bit stumped. Could you rephrase your mood or desires?",
    'recommendation': "We're struggling to pick the perfect place for you. Can you give us more details about what you're looking for?",
    'default': "Something unexpected happened. Let's try that request again, shall we?"
  };

  if (error.message.includes('geocod')) return errorMessages.geocoding;
  if (error.message.includes('search places')) return errorMessages.places_search;
  if (error.message.includes('construct search phrase') || error.message.includes('Gemini')) return errorMessages.gemini_processing;
  if (error.message.includes('recommend best place')) return errorMessages.recommendation;

  return errorMessages.default;
};