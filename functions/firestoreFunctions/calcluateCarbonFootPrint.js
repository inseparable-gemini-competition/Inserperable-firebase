import * as functions from "firebase-functions";
import { db } from "../helpers/firebaseAdmin.js"; // Import initialized Firebase Admin
import { GoogleGenerativeAI } from "@google/generative-ai";
import { getFriendlyErrorMessage } from "../helpers/utils/errorHandler.js";

const GEN_AI_KEY = functions.config().genai.apikey;

export const calculateCarbonFootprint = functions.firestore
  .document("products/{productId}")
  .onCreate(async (snap, context) => {
    const product = snap.data();
    const genAI = new GoogleGenerativeAI(GEN_AI_KEY);

    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash",
    });

    try {
      const query = `
      Calculate the estimated carbon footprint range (in kg CO2e) for the following product:
      
      Product Details:
      - Name: ${product.name}
      - Description: ${product.description}
      - Price: ${product.price}
      - Material: ${product.materialType}
      - Production: ${product.productionMethod}
      - Transportation: ${product.transportationMethod}
      - Weight: ${product.productWeight} kg
      - Origin: ${product.localOrImported}
      
      Requirements:
      1. Provide a numeric estimate or range in kg CO2e.
      2. Consider full lifecycle: raw materials, manufacturing, transportation, use, and disposal.
      3. Use industry averages and best practices for estimation.
      4. If exact calculation is impossible, provide a reasonable range based on similar products.
      5. Respond with only the numeric estimate or range, no additional text.
      
      Format: [number] kg CO2e or [lower bound]-[upper bound] kg CO2e
      `;

      const result = await model.generateContent([query]);

      const carbonFootprint =
        result?.response.candidates[0].content.parts[0].text || "";

      const adviceQuery = `
        Provide concise, actionable advice to reduce the carbon footprint of the following product:
        
        Product Details:
        - Name: ${product.name}
        - Description: ${product.description}
        - Price: ${product.price}
        - Material: ${product.materialType}
        - Production: ${product.productionMethod}
        - Transportation: ${product.transportationMethod}
        - Weight: ${product.productWeight} kg
        - Origin: ${product.localOrImported}
        
        Requirements:
        1. Offer 3-5 specific, practical recommendations.
        2. Focus on the most impactful areas based on the product details.
        3. Consider all stages: materials, production, transportation, use, and end-of-life.
        4. Prioritize suggestions that maintain or enhance product quality and functionality.
        5. If applicable, suggest alternative materials or methods with lower environmental impact.
        6. Provide brief rationale for each recommendation (1-2 sentences max).
        
        Format your response as a numbered list of concise bullet points. Aim for clarity and actionability in your advice.
        `;

      const adviceResult = await model.generateContent([adviceQuery]);

      const reductionAdvice =
        adviceResult?.response.candidates[0].content.parts[0].text || "";

      await db.collection("products").doc(context.params.productId).update({
        carbonFootprint,
        reductionAdvice,
      });
    } catch (error) {
      const friendlyMessage = getFriendlyErrorMessage(error);
      throw new functions.https.HttpsError("internal", friendlyMessage);
    }
  });
