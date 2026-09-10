export default function BudgetInput({ budget, setBudget }) {
  return (
    <div className="budget">
      <h2>Extra budget? 💰</h2>
      <div className="budget-input">
        <span className="kes">KES</span>
        <input
          type="number"
          placeholder="e.g. 200"
          value={budget}
          onChange={e => setBudget(e.target.value)}
          min="0"
        />
      </div>
      <p className="hint">Put 0 if you don't want to buy anything extra</p>
    </div>
  )
}
