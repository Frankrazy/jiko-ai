import { ingredients } from "../data/ingredients"

export default function IngredientPicker({ selected, setSelected }) {
  function toggle(name) {
    setSelected(prev =>
      prev.includes(name)
        ? prev.filter(i => i !== name)
        : [...prev, name]
    )
  }

  const categories = [...new Set(ingredients.map(i => i.category))]

  return (
    <div className="picker">
      <h2>What's in your fridge? 🧊</h2>
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="category-title">{cat.toUpperCase()}</h3>
          <div className="ingredient-grid">
            {ingredients
              .filter(i => i.category === cat)
              .map(item => (
                <button
                  key={item.id}
                  className={`ing-btn ${selected.includes(item.name) ? "active" : ""}`}
                  onClick={() => toggle(item.name)}
                >
                  <span className="emoji">{item.emoji}</span>
                  <span>{item.name}</span>
                </button>
              ))}
          </div>
        </div>
      ))}
      <p className="count">{selected.length} selected</p>
    </div>
  )
}
