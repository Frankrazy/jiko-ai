const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function getRecipes(selectedIngredients, budget) {
  if (!API_KEY) {
    console.error("❌ Missing VITE_OPENROUTER_API_KEY!");
    throw new Error("Missing OpenRouter API Key in environment variables.");
  }

  // 1. Fetch market prices
  const priceRes = await fetch("/prices.json");
  const priceData = await priceRes.json();

  // 2. Build prompt
  const prompt = `You are Jiko AI, a Kenyan home cooking expert.

INGREDIENTS USER HAS IN THEIR FRIDGE:
${selectedIngredients.join(", ")}

USER'S ADDITIONAL BUDGET: KES ${budget}

CURRENT KENYAN MARKET PRICES (per unit):
${JSON.stringify(priceData.prices)}

TASK: Suggest 5 Kenyan recipes based on user ingredients and budget.
Status rules:
- "MAKE_NOW" if user has all ingredients (extraCost: 0)
- "ALMOST" if they need to buy missing ingredients within budget
- "OVER" if buying missing ingredients exceeds budget

Return ONLY a raw JSON array of 5 recipe objects with these keys:
"name", "status", "extraCost", "toBuy" (array of {item, qty, cost}), "servings", "time", "ingredients" (array), "steps" (array).

Do NOT include markdown block syntax like \`\`\`json. Return pure JSON text only.`;

  // 3. Call OpenRouter API (using meta-llama/llama-3.2-3b-instruct:free)
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jiko-ai.netlify.app",
      "X-Title": "Jiko AI"
    },
    body: JSON.stringify({
      model: "meta-llama/llama-3.2-3b-instruct:free",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7
    })
  });

  const data = await response.json();

  if (data.error) {
    console.error("❌ OpenRouter Error:", data.error);
    throw new Error(data.error.message || "API Error");
  }

  let text = data.choices[0].message.content.trim();

  // Clean Markdown wrappers if present
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();

  const parsedData = JSON.parse(text);

  // If the model wrapped the array in an object key like { recipes: [...] }, extract it
  return Array.isArray(parsedData) ? parsedData : (parsedData.recipes || Object.values(parsedData)[0]);
}