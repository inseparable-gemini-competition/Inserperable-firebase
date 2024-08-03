import * as functions from 'firebase-functions';
import { db } from '../helpers/firebaseAdmin.js';

const calculateWeightedAverage = (scores, weights) => {
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  return scores.reduce((sum, score, index) => sum + score * weights[index], 0) / totalWeight;
};

export const updateUserScore = functions.https.onCall(async (data, context) => {
  // Check if the user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to update scores.');
  }

  const { userId, cultural, social, environmental } = data;

  // Validate input
  if (!userId || (cultural === undefined && social === undefined && environmental === undefined)) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid input. Please provide a valid userId and at least one score.');
  }

  const scoreTypes = ['cultural', 'social', 'environmental'];
  const scores = { cultural, social, environmental };

  for (const type of scoreTypes) {
    if (scores[type] !== undefined && (typeof scores[type] !== 'number' || scores[type] < 0 || scores[type] > 10)) {
      throw new functions.https.HttpsError('invalid-argument', `Invalid ${type} score. Please provide a number between 0 and 10.`);
    }
  }

  try {
    const userRef = db.collection('users').doc(userId);

    await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);

      if (!userDoc.exists) {
        throw new functions.https.HttpsError('not-found', 'User does not exist');
      }

      const userData = userDoc.data();
      const currentScores = userData.scores || {};
      const submissions = userData.submissions || {};

      // Update scores and submissions
      for (const type of scoreTypes) {
        if (scores[type] !== undefined) {
          const currentScore = currentScores[type] || 0;
          const currentSubmissions = submissions[type] || 0;
          const newTotalScore = (currentScore * currentSubmissions) + scores[type];
          const newSubmissions = currentSubmissions + 1;
          currentScores[type] = newTotalScore / newSubmissions;
          submissions[type] = newSubmissions;
        }
      }

      // Calculate weighted average
      const weights = { cultural: 1, social: 1, environmental: 2 }; // Environmental has more weight
      const overallScore = calculateWeightedAverage(
        [currentScores.cultural || 0, currentScores.social || 0, currentScores.environmental || 0],
        [weights.cultural, weights.social, weights.environmental]
      );

      // Update the user document
      transaction.update(userRef, {
        scores: currentScores,
        submissions: submissions,
        overallScore: overallScore,
        lastUpdated: new Date()
      });
    });

    return { message: 'User scores updated successfully' };
  } catch (error) {
    console.error('Error updating user scores:', error);
    throw new functions.https.HttpsError('internal', 'An error occurred while updating the scores');
  }
});