import { GoogleGenAI } from "@google/genai";
import { InventoryItem } from '../types';

let ai: GoogleGenAI | null = null;

try {
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }
} catch (error) {
  console.error("Failed to initialize GoogleGenAI", error);
}

export const getInventoryInsights = async (inventory: InventoryItem[]): Promise<string> => {
  if (!ai) return "AI service not configured. Please check API Key.";

  try {
    const prompt = `
      You are an expert Inventory Analyst. Analyze the following inventory data and provide:
      1. A summary of critical stock issues (Low Stock, Out of Stock).
      2. One specific actionable recommendation for reordering.
      3. A brief demand forecast insight based on general industrial trends (assume a hypothetical industrial context).

      Format the response as a clean, HTML-friendly string (using <p>, <ul>, <li>, <strong> tags only, no markdown backticks). Keep it concise.

      Inventory Data:
      ${JSON.stringify(inventory)}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text || "No insights generated.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Unable to generate AI insights at this time.";
  }
};

export const getAiReorderSuggestions = async (inventory: InventoryItem[]): Promise<string> => {
    if (!ai) return "AI service not configured.";

    try {
        const prompt = `
          Based on the following inventory, identify items that need reordering.
          Calculate a suggested reorder quantity assuming a lead time of 7 days and average daily usage of 10% of current stock for fast movers.
          
          Return the result as a JSON array of objects with keys: "sku", "reason", "suggestedQuantity".
          ONLY return the JSON string, no markdown formatting.
    
          Inventory: ${JSON.stringify(inventory.filter(i => i.stock <= i.reorderLevel))}
        `;
    
        const response = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: prompt,
        });
    
        return response.text || "[]";
      } catch (error) {
        console.error("Gemini API Error:", error);
        return "[]";
      }
}
