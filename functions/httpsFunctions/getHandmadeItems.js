import * as functions from "firebase-functions";
import { db } from "../helpers/firebaseAdmin.js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(functions.config().genai.apikey);

export const getHandmadeItems = functions.https.onCall(async (data) => {
  const { pageParam, language = "en", country } = data;
  console.log(`Fetching handmade items. Language: ${language}, Country: ${country}, PageParam: ${pageParam}`);

  try {
    let itemsQuery = db.collection("products")
      .orderBy("createdAt")
      .limit(10);

    if (pageParam) {
      console.log(`Using pageParam: ${pageParam}`);
      const lastVisibleDoc = await db.collection("products").doc(pageParam).get();
      if (lastVisibleDoc.exists) {
        itemsQuery = itemsQuery.startAfter(lastVisibleDoc);
      } else {
        console.warn(`Last visible document with ID ${pageParam} not found`);
      }
    }

    const querySnapshot = await itemsQuery.get();
    console.log(`Retrieved ${querySnapshot.size} documents`);
    
    const items = [];
    let lastVisible = null;
    const itemsToTranslate = [];

    for (const doc of querySnapshot.docs) {
      if (doc.exists && doc.data().createdAt) {
        const item = { id: doc.id, ...doc.data() };

        if (language !== "en" && !item.translations?.[language]) {
          itemsToTranslate.push(item);
        }

        items.push({
          ...item,
          name: {
            original: item.name,
            translated: item.translations?.[language]?.name,
          },
          price: {
            original: item.price,
            translated: item.translations?.[language]?.price,
          },
          carbonFootprint: {
            original: item.carbonFootprint,
            translated: item.translations?.[language]?.carbonFootprint,
          },
        });
      } else {
        console.error(`Document missing createdAt: ${doc.id}`);
      }
    }

    console.log(`Filtering ${items.length} items by country: ${country}`);
    const filteredItems = await filterItemsByCountry(items, country);
    console.log(`${filteredItems.length} items remaining after country filtering`);

    if (!querySnapshot.empty) {
      lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1].id;
    }

    if (itemsToTranslate.length > 0) {
      console.log(`Triggering background translation for ${itemsToTranslate.length} items to ${language}`);
      translateItemsBatch(itemsToTranslate, language);
    }

    return {
      items: filteredItems,
      lastVisible,
    };
  } catch (error) {
    console.error("Error fetching handmade items:", error);
    throw new functions.https.HttpsError(
      "internal",
      "Error fetching handmade items"
    );
  }
});

async function translateItemsBatch(items, targetLanguage) {
  console.log(`Starting batch translation for ${items.length} items to ${targetLanguage}`);
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  for (const item of items) {
    const translationPrompts = ["name", "price", "carbonFootprint"].map(
      (field) => `Translate to ${targetLanguage}: ${item[field]}`
    );

    try {
      const result = await model.generateContent(translationPrompts.join("\n"));
      const translations = result.response.text().split("\n");

      const translatedFields = {
        name: translations[0],
        price: translations[1],
        carbonFootprint: translations[2],
      };

      await db
        .collection("products")
        .doc(item.id)
        .update({
          [`translations.${targetLanguage}`]: translatedFields,
        });
      console.log(`Successfully translated and updated item ${item.id} to ${targetLanguage}`);
    } catch (error) {
      console.error(`Error translating item ${item.id} to ${targetLanguage}:`, error);
    }
  }
  console.log(`Finished batch translation for ${items.length} items`);
}

async function filterItemsByCountry(items, baseCountry) {
  console.log(`Filtering ${items.length} items for country: ${baseCountry}`);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  const filteredItems = [];

  for (const item of items) {
    const prompt = `Is the following item from ${baseCountry}?\nItem country (even if in foreign language or in country code): ${item?.country}\nAnswer with yes or no.`;

    try {
      const result = await model.generateContent(prompt);
      const answer = result.response.text().trim().toLowerCase();

      if (answer === "yes") {
        filteredItems.push(item);
        console.log(`Item ${item.id} matched country ${baseCountry}`);
      } else {
        console.log(`Item ${item.id} did not match country ${baseCountry}`);
      }
    } catch (error) {
      console.error(`Error filtering item ${item.id} by country:`, error);
    }
  }

  console.log(`Filtered ${filteredItems.length} items for country ${baseCountry}`);
  return filteredItems;
}