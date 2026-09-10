export default function RecipeCard({ recipe }) {
  const colors = { MAKE_NOW: "#22c55e", ALMOST: "#eab308", OVER: "#ef4444" }
  const labels = {
    MAKE_NOW: "✅ Make Now — KES 0 extra",
    ALMOST: `🟡 Buy extras — KES ${recipe.extraCost}`,
    OVER: `🔴 Over budget — KES ${recipe.extraCost}`
  }

  return (
    <div className="recipe-card">
      <div className="status" style={{ backgroundColor: colors[recipe.status] }}>
        {labels[recipe.status]}
      </div>
      <h3>{recipe.name}</h3>
      <p>👨‍👩‍👧‍👦 {recipe.servings} servings · ⏱️ {recipe.time}</p>

      {recipe.toBuy?.length > 0 && (
        <div className="tobuy">
          <strong>🛒 Buy:</strong>
          <ul>
            {recipe.toBuy.map((item, i) => (
              <li key={i}>{item.item} ({item.qty}) — KES {item.cost}</li>
            ))}
          </ul>
        </div>
      )}

      <details>
        <summary>📖 Full Recipe</summary>
        <h4>Ingredients:</h4>
        <ul>{recipe.ingredients?.map((x, i) => <li key={i}>{x}</li>)}</ul>
        <h4>Steps:</h4>
        <ol>{recipe.steps?.map((x, i) => <li key={i}>{x}</li>)}</ol>
      </details>
    </div>
  )
}
