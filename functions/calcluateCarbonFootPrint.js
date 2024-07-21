import functions from "firebase-functions";
import { db } from "./firebaseAdmin.js"; // Import initialized Firebase Admin
import { GoogleGenerativeAI } from "@google/generative-ai";

const GEN_AI_KEY = "AIzaSyCrRE67ES56RfBPeTZ4X2ZB7u1_r4Aolsk";

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
        Calculate the carbon footprint for the following product details, don't say i can't try your best. be professional in response and brief. try to estimate a range if you can't. give me a number and be brief, don't add any introductory or clarification text
        Name: ${product.name}
        Description: ${product.description}
        Price: ${product.price}
        Material Type: ${product.materialType}
        Production Method: ${product.productionMethod}
        Transportation Method: ${product.transportationMethod}
        Product Weight: ${product.productWeight} kg
        Local or Imported: ${product.localOrImported}
      `;

      const result = await model.generateContent([query]);

      const carbonFootprint =
        result?.response.candidates[0].content.parts[0].text || "";

      const adviceQuery = `
        Provide advice on how to reduce the carbon footprint for the following product details, don't say i can't try your best. be professional in response and brief. try to estimate an approximate response if you can, be brief
        Name: ${product.name}
        Description: ${product.description}
        Price: ${product.price}
        Material Type: ${product.materialType}
        Production Method: ${product.productionMethod}
        Transportation Method: ${product.transportationMethod}
        Product Weight: ${product.productWeight} kg
        Local or Imported: ${product.localOrImported}
      `;

      const adviceResult = await model.generateContent([adviceQuery]);

      const reductionAdvice =
        adviceResult?.response.candidates[0].content.parts[0].text || "";

      await db.collection("products").doc(context.params.productId).update({
        carbonFootprint,
        reductionAdvice,
      });
    } catch (error) {
      console.error("Error calculating carbon footprint:", error);
    }
  });
