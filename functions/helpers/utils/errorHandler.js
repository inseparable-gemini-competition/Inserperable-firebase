// functions/helpers/utils/errorHandler.js

export const getFriendlyErrorMessage = (error) => {
  console.error('Original error:', error);  // Log the original error for debugging

  const errorMessages = {
    'geocoding': "Oops! We couldn't find that location. Could you please provide a more specific address?",
    'uber_estimate': "We're having trouble getting a price estimate right now. How about we try again in a moment?",
    'gemini_processing': "Our AI assistant is feeling a bit confused. Could you rephrase your request?",
    'trip_scheduling': "There was a hiccup while scheduling your trip. Let's give it another shot!",
    'calendar': "We couldn't add this to your calendar. Make sure we have permission to access it.",
    'default': "Something unexpected happened. Let's try that again, shall we?"
  };

  if (error.message.includes('geocod')) return errorMessages.geocoding;
  if (error.message.includes('Uber') || error.message.includes('estimate')) return errorMessages.uber_estimate;
  if (error.message.includes('Gemini') || error.message.includes('AI')) return errorMessages.gemini_processing;
  if (error.message.includes('schedul')) return errorMessages.trip_scheduling;
  if (error.message.includes('calendar')) return errorMessages.calendar;

  return errorMessages.default;
};