const API_KEY = import.meta.env.VITE_GEMINI_API_KEY

export async function getRecipes(selectedIngredients, budget) {
  if (!API_KEY || API_KEY === "your_key_here") {
    console.error("❌ ERROR: VITE_GEMINI_API_KEY is not set correctly in Netlify!")
    throw new Error("Missing API Key")
  }

  // 1. Fetch prices
  const priceRes = await fetch("/prices.json")
  const priceData = await priceRes.json()

  // 2. Build prompt
  const prompt = `You are Jiko AI, a Kenyan home cooking expert.

User ingredients: ${selectedIngredients.join(", ")}
Extra budget: KES ${budget}
Current market prices: ${JSON.stringify(priceData.prices)}

Task: Suggest 5 Kenyan recipes.
Return ONLY a valid JSON array of objects with keys: name, status ("MAKE_NOW" | "ALMOST" | "OVER"), extraCost, toBuy (array of {item, qty, cost}), servings, time, ingredients, steps.`

  // 3. API Call
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }]
      })
    }
  )

  const data = await response.json()
  
  // 🔍 LOG RAW RESPONSE FOR DEBUGGING
  console.log("🔍 Full Gemini Response:", data)

  // Check if Google returned an error
  if (data.error) {
    console.error("❌ Google API Error:", data.error.message)
    throw new Error(data.error.message)
  }

  // Check if candidates exist
  if (!data.candidates || data.candidates.length === 0) {
    console.error("❌ No candidates returned. Prompt feedback:", data.promptFeedback)
    throw new Error("No recipes returned from AI.")
  }

  let text = data.candidates[0].content.parts[0].text

  // Clean Markdown formatting if present
  text = text.replace(/```json/g, "").replace(/```/g, "").trim()

  return JSON.parse(text)
}