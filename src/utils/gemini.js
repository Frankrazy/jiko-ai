const API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

export async function getRecipes(selectedIngredients, budget) {
  if (!API_KEY) throw new Error("Missing OpenRouter API Key!");

  const priceRes = await fetch("/prices.json");
  const priceData = await priceRes.json();

  const prompt = `You are Jiko AI, a Kenyan cooking expert.
User ingredients: ${selectedIngredients.join(", ")}
Extra budget: KES ${budget}
Prices: ${JSON.stringify(priceData.prices)}

TASK: Suggest 5 Kenyan recipes. 
Return ONLY a valid JSON array of objects. 
Keys: "name", "status", "extraCost", "toBuy", "servings", "time", "ingredients", "steps".`;

  // List of models currently confirmed FREE on OpenRouter
  const freeModels = [
    "google/gemini-2.0-flash-exp:free",
    "google/gemma-2-9b-it:free",
    "mistralai/mistral-7b-instruct:free",
    "huggingfaceh4/zephyr-7b-beta:free"
  ];

  let lastError = null;

  for (const model of freeModels) {
    try {
      console.log(`Trying free model: ${model}...`);
      return await callOpenRouter(model, prompt);
    } catch (err) {
      console.warn(`${model} failed or is now paid. Trying next...`);
      lastError = err;
      continue; // Try the next model in the list
    }
  }

  throw new Error(`All free models are currently busy or unavailable. Error: ${lastError.message}`);
}

async function callOpenRouter(modelName, prompt) {
  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://jiko-ai.netlify.app",
      "X-Title": "Jiko AI"
    },
    body: JSON.stringify({
      model: modelName,
      messages: [
        {
          role: "system",
          content: "You are a JSON generator. Respond ONLY with a valid raw JSON array. No markdown, no intro text."
        },
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
    throw new Error(data.error.message);
  }

  let text = data.choices[0].message.content.trim();
  
  // Clean JSON string
  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start !== -1 && end !== -1) {
    text = text.substring(start, end + 1);
  }

  return JSON.parse(text);
}