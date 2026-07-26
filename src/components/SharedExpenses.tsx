import React, { useState } from "react";
import { Expense, Child, ParentProfile } from "../types";
import { StorageEngine } from "../data";
import { DollarSign, Plus, CheckCircle2, DollarSign as DollarIcon, Receipt, ArrowRightLeft, Trash2 } from "lucide-react";

interface SharedExpensesProps {
  expenses: Expense[];
  childrenList: Child[];
  parents: ParentProfile[];
  activeParentId: string;
  selectedChildId: string | "all";
}

export const SharedExpenses: React.FC<SharedExpensesProps> = ({
  expenses,
  childrenList,
  parents,
  activeParentId,
  selectedChildId,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // Form state
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState<string>("");
  const [category, setCategory] = useState<string>("activities");
  const [childId, setChildId] = useState(childrenList[0]?.id || "child1");
  const [paidByParentId, setPaidByParentId] = useState(activeParentId);

  const filteredExpenses = expenses.filter((e) => {
    const matchChild = selectedChildId === "all" || !e.childId || e.childId === selectedChildId;
    const matchCat = filterCategory === "all" || e.category === filterCategory;
    return matchChild && matchCat;
  });

  // Calculate Net Balances
  // Mom (parent1) paid vs Dad (parent2) paid on unsettled expenses
  let momTotalPaid = 0;
  let dadTotalPaid = 0;

  expenses
    .filter((e) => !e.settled)
    .forEach((e) => {
      const splitRatio = e.splitRatio ?? 0.5;
      if (e.paidByParentId === "parent1") {
        momTotalPaid += e.amount * (1 - splitRatio); // Dad owes Mom this portion
      } else {
        dadTotalPaid += e.amount * splitRatio; // Mom owes Dad this portion
      }
    });

  const netBalance = momTotalPaid - dadTotalPaid; // Positive: Dad owes Mom; Negative: Mom owes Dad

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);
    if (!title || isNaN(numAmount) || numAmount <= 0) return;

    StorageEngine.addExpense({
      title,
      amount: numAmount,
      paidByParentId,
      date: new Date().toISOString().split("T")[0],
      category,
      childId,
      splitRatio: 0.5,
      settled: false,
    });

    setTitle("");
    setAmount("");
    setShowAddModal(false);
  };

  const categories = [
    { id: "all", label: "All Expenses" },
    { id: "activities", label: "⚽ Activities" },
    { id: "school", label: "📚 School" },
    { id: "medical", label: "🩺 Medical" },
    { id: "clothing", label: "👕 Clothing" },
    { id: "other", label: "🧾 Other" },
  ];

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Balance Summary Banner */}
      <section className="bg-gradient-to-r from-blue-700 to-indigo-800 rounded-3xl p-5 text-white shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl">
              💳
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Shared Expenses</h2>
              <p className="text-xs text-blue-100">50/50 Split & Reimbursements</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-900 rounded-2xl text-xs font-bold shadow-xs hover:bg-blue-50 transition-all active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>Log Cost</span>
          </button>
        </div>

        {/* Balance Card */}
        <div className="bg-black/15 backdrop-blur-xs p-3.5 rounded-2xl flex items-center justify-between border border-white/10">
          <div>
            <p className="text-[11px] text-blue-200 font-medium">NET UNSETTLED BALANCE</p>
            {Math.abs(netBalance) < 0.01 ? (
              <p className="text-sm font-bold text-emerald-300 mt-0.5">All Balances Settled ✨</p>
            ) : netBalance > 0 ? (
              <p className="text-sm font-bold text-white mt-0.5">
                Dad (David) owes Mom (Sarah) <span className="text-emerald-300">${netBalance.toFixed(2)}</span>
              </p>
            ) : (
              <p className="text-sm font-bold text-white mt-0.5">
                Mom (Sarah) owes Dad (David) <span className="text-emerald-300">${Math.abs(netBalance).toFixed(2)}</span>
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Category Filter Pills */}
      <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setFilterCategory(cat.id)}
            className={`px-3 py-1.5 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              filterCategory === cat.id
                ? "bg-blue-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Expenses List */}
      <section className="flex flex-col gap-2.5">
        {filteredExpenses.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <Receipt className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-medium">No expenses logged for this filter.</p>
          </div>
        ) : (
          filteredExpenses.map((exp) => {
            const payer = parents.find((p) => p.id === exp.paidByParentId);
            const child = childrenList.find((c) => c.id === exp.childId);
            const halfAmount = (exp.amount / 2).toFixed(2);

            return (
              <div
                key={exp.id}
                className={`bg-white border rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all ${
                  exp.settled ? "border-slate-200 opacity-60 bg-slate-50/50" : "border-slate-200 shadow-2xs hover:border-slate-300"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    {child && <span className="text-xs">{child.avatar}</span>}
                    <h3 className={`text-xs font-bold ${exp.settled ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {exp.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="font-semibold text-slate-700">${exp.amount.toFixed(2)} total</span>
                    <span>•</span>
                    <span>Paid by {payer?.name ? payer.name.split(" ")[0] : "Co-parent"}</span>
                    <span>•</span>
                    <span className="text-blue-600 font-medium">${halfAmount} share</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => StorageEngine.toggleExpenseSettled(exp.id)}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                      exp.settled
                        ? "bg-emerald-100 text-emerald-800"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {exp.settled ? "Settled" : "Settle"}
                  </button>

                  <button
                    onClick={() => StorageEngine.deleteExpense(exp.id)}
                    className="text-slate-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Add Expense Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800">Log Shared Expense</h3>

            <form onSubmit={handleAddExpense} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Expense Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Emma's Soccer Registration"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Amount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="140.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Paid By</label>
                  <select
                    value={paidByParentId}
                    onChange={(e) => setPaidByParentId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {parents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Child</label>
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-blue-500 outline-none bg-white"
                  >
                    <option value="activities">Activities</option>
                    <option value="school">School</option>
                    <option value="medical">Medical</option>
                    <option value="clothing">Clothing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700"
                >
                  Save Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
