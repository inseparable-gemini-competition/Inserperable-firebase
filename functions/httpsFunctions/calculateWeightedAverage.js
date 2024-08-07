import * as functions from 'firebase-functions';
import { db } from '../helpers/firebaseAdmin.js';

const SCORE_PRECISION = 4;
const SCORE_TYPES = ['cultural', 'social', 'environmental'];
const SCORE_WEIGHTS = { cultural: 1, social: 1, environmental: 2 };
const MIN_SCORE = 0;
const MAX_SCORE = 10;
const DECAY_FACTOR = 0.98;
const MAX_HISTORY_LENGTH = 20;

const calculateWeightedMovingAverage = (scores) => {
  let totalWeightedScore = 0;
  let totalWeight = 0;
  
  scores.forEach((score, index) => {
    const weight = Math.pow(DECAY_FACTOR, scores.length - index - 1);
    totalWeightedScore += score * weight;
    totalWeight += weight;
  });

  return totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(SCORE_PRECISION)) : 0;
};

const applyDiminishingReturns = (score) => {
  return Math.atan(score / 2) / (Math.PI / 2) * MAX_SCORE;
};

const calculateOverallScore = (scores) => {
  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const [type, weight] of Object.entries(SCORE_WEIGHTS)) {
    if (scores[type] !== undefined) {
      totalWeightedScore += applyDiminishingReturns(scores[type]) * weight;
      totalWeight += weight;
    }
  }

  return totalWeight > 0 ? Number((totalWeightedScore / totalWeight).toFixed(SCORE_PRECISION)) : 0;
};

const validateScore = (score, type) => {
  if (typeof score !== 'number' || isNaN(score) || score < MIN_SCORE || score > MAX_SCORE) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      `Invalid ${type} score. Please provide a number between ${MIN_SCORE} and ${MAX_SCORE}.`
    );
  }
  return Number(score.toFixed(SCORE_PRECISION));
};

const updateUserScores = async (userId, newScores, transaction) => {
  const userRef = db.collection('users').doc(userId);
  const userDoc = await transaction.get(userRef);

  if (!userDoc.exists) {
    throw new functions.https.HttpsError('not-found', 'User does not exist');
  }

  const userData = userDoc.data();
  const currentScores = userData.scores || {};
  const scoreHistory = userData.scoreHistory || {};

  let updated = false;
  for (const type of SCORE_TYPES) {
    if (newScores[type] !== undefined) {
      const validatedScore = validateScore(newScores[type], type);
      scoreHistory[type] = [validatedScore, ...(scoreHistory[type] || [])].slice(0, MAX_HISTORY_LENGTH);
      
      currentScores[type] = calculateWeightedMovingAverage(scoreHistory[type]);
      updated = true;
    }
  }

  if (!updated) {
    return { message: 'No scores were updated' };
  }

  const newOverallScore = calculateOverallScore(currentScores);
  const currentOverallScore = userData.overallScore || 0;

  const overallScoreDiff = newOverallScore - currentOverallScore;
  const gradualOverallScore = currentOverallScore + (overallScoreDiff * 0.1);

  const updateData = {
    scores: currentScores,
    scoreHistory: scoreHistory,
    overallScore: Number(gradualOverallScore.toFixed(SCORE_PRECISION)),
  };

  transaction.update(userRef, updateData);

  return { 
    message: 'User scores updated successfully',
    newScores: currentScores,
    newOverallScore: updateData.overallScore
  };
};

export const updateUserScore = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated to update scores.');
  }
  const { userId, ...newScores } = data;

  if (!userId || Object.keys(newScores).length === 0) {
    throw new functions.https.HttpsError('invalid-argument', 'Invalid input. Please provide a valid userId and at least one score.');
  }

  try {
    return await db.runTransaction(async (transaction) => {
      return await updateUserScores(userId, newScores, transaction);
    });
  } catch (error) {
    throw new functions.https.HttpsError('internal', 'An error occurred while updating the scores');
  }
});