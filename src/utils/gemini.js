const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function getRecipes(selectedIngredients, budget) {
  const priceRes = await fetch("/prices.json")
  const priceData = await priceRes.json()

  const prompt = `You are Jiko AI, a Kenyan home cooking expert.

INGREDIENTS THE USER ALREADY HAS:
${selectedIngredients.join(", ")}

USER'S ADDITIONAL BUDGET: KES ${budget}

CURRENT KENYAN MARKET PRICES (per unit):
${JSON.stringify(priceData.prices)}

TASK: Suggest 5 Kenyan recipes.
- "MAKE_NOW" if user has everything (extraCost: 0)
- "ALMOST" if they need to buy extras within budget
- "OVER" if it exceeds budget

Return ONLY valid JSON array:
[
  {
    "name": "Recipe Name",
    "status": "MAKE_NOW",
    "extraCost": 0,
    "toBuy": [],
    "servings": 4,
    "time": "25 min",
    "ingredients": ["2 tomatoes", "1 onion"],
    "steps": ["Heat oil in sufuria", "Fry onions until golden"]
  }
]

Use Kenyan cooking terms. Be realistic about portions.`

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          responseMimeType: "application/json"
        }
      })
    }
  )

  const data = await response.json()
  const text = data.candidates[0].content.parts[0].text
  return JSON.parse(text)
}
