import { google } from 'googleapis';
import * as functions from 'firebase-functions';

const oauth2Client = new google.auth.OAuth2(
  functions.config().google.client_id,
  functions.config().google.client_secret,
);

export const addToCalendar = async (origin, destination, scheduledTime, geminiInsights, additionalContext) => {
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
  const event = {
    summary: 'Uber Trip',
    location: `From ${origin.formattedAddress} to ${destination.formattedAddress}`,
    description: `Trip Details:\n${geminiInsights}\n\nAdditional Context:\n${additionalContext}`,
    start: {
      dateTime: scheduledTime,
      timeZone: 'America/Los_Angeles',
    },
    end: {
      dateTime: new Date(new Date(scheduledTime).getTime() + 60*60000).toISOString(),
      timeZone: 'America/Los_Angeles',
    },
  };

  await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
  });
};