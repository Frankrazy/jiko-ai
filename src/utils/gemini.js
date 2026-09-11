const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function getRecipes(selectedIngredients, budget) {
  if (!API_KEY) throw new Error("Missing OpenRouter API Key");

  const priceRes = await fetch("/prices.json");
  const priceData = await priceRes.json();

  const prompt = `You are Jiko AI, a Kenyan home cooking expert.
User ingredients: ${selectedIngredients.join(", ")}
Extra budget: KES ${budget}
Current market prices: ${JSON.stringify(priceData.prices)}

TASK: Suggest 5 Kenyan recipes. 
Return ONLY a valid JSON array of objects. 
Keys: "name", "status", "extraCost", "toBuy", "servings", "time", "ingredients", "steps".`;

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jiko-ai.netlify.app",
      "X-Title": "Jiko AI"
    },
    body: JSON.stringify({
      // 🟢 SWITCH TO THIS FREE MODEL (Stable and Very Fast)
      model: "qwen/qwen-2.5-7b-instruct:free", 
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that only outputs valid JSON arrays. Do not include markdown formatting or extra text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.6
    })
  });

  const data = await response.json();

  if (data.error) {
    console.error("❌ OpenRouter Error:", data.error);
    // FALLBACK: If Qwen is busy, try Gemma 2 9B Free
    if (data.error.code === 403 || data.error.code === 429) {
        return getRecipesFallback(selectedIngredients, budget, priceData);
    }
    throw new Error(data.error.message);
  }

  let text = data.choices[0].message.content.trim();
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  return JSON.parse(text);
}

// Fallback function in case the first free model is busy
async function getRecipesFallback(ingredients, budget, priceData) {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${API_KEY}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: "google/gemma-2-9b-it:free", 
          messages: [{ role: "user", content: `Suggest 5 Kenyan recipes for ${ingredients} budget ${budget} as JSON.` }]
        })
    });
    const data = await response.json();
    let text = data.choices[0].message.content.trim();
    return JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
}