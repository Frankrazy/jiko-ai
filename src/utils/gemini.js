import { GoogleGenAI } from '@google/genai';

const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: apiKey });

export async function getRecipes(selectedIngredients, budget) {
  // 1. Fetch live prices
  const priceRes = await fetch("/prices.json");
  const priceData = await priceRes.json();

  // 2. Build prompt
  const prompt = `You are Jiko AI, a Kenyan home cooking expert.

Ingredients user has: ${selectedIngredients.join(", ")}
Extra budget: KES ${budget}
Current market prices: ${JSON.stringify(priceData.prices)}

TASK: Suggest 5 Kenyan recipes.
- "MAKE_NOW" if user has everything (extraCost: 0)
- "ALMOST" if they need to buy extras within budget
- "OVER" if it exceeds budget

Return ONLY a valid JSON array of objects with keys: name, status, extraCost, toBuy (array of {item, qty, cost}), servings, time, ingredients, steps.`;

  // 3. Call SDK using gemini-1.5-flash or gemini-2.0-flash
  const response = await ai.models.generateContent({
    model: 'gemini-1.5-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json', // Forces Gemini to return pure JSON!
    }
  });

  // 4. Return parsed recipes
  return JSON.parse(response.text);
}