import { useState } from "react"
import IngredientPicker from "./components/IngredientPicker"
import BudgetInput from "./components/BudgetInput"
import RecipeCard from "./components/RecipeCard"
import { getRecipes } from "./utils/gemini"

export default function App() {
  const [selected, setSelected] = useState([])
  const [budget, setBudget] = useState("")
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(false)

  async function handleCook() {
    if (selected.length === 0) return alert("Pick at least 1 ingredient!")
    if (!budget && budget !== "0") return alert("Enter your budget!")

    setLoading(true)
    try {
      const results = await getRecipes(selected, budget)
      setRecipes(results)
    } catch (err) {
      alert("Something went wrong. Try again!")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="app">
      <header>
        <h1>🍳 Jiko AI</h1>
        <p>What can you cook with what you have?</p>
      </header>

      <IngredientPicker selected={selected} setSelected={setSelected} />
      <BudgetInput budget={budget} setBudget={setBudget} />

      <button className="cook-btn" onClick={handleCook} disabled={loading}>
        {loading ? "⏳ Cooking..." : "🔥 Show Me Recipes!"}
      </button>

      <div className="results">
        {recipes.map((r, i) => <RecipeCard key={i} recipe={r} />)}
      </div>
    </div>
  )
}
