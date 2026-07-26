import React, { useState } from "react";
import { PackingItem, Child, ParentProfile } from "../types";
import { StorageEngine } from "../data";
import { Package, Plus, CheckCircle2, Circle, Trash2, Tag, Calendar, Home } from "lucide-react";

interface PackingChecklistProps {
  items: PackingItem[];
  childrenList: Child[];
  parents: ParentProfile[];
  selectedChildId: string | "all";
}

export const PackingChecklist: React.FC<PackingChecklistProps> = ({
  items,
  childrenList,
  parents,
  selectedChildId,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  // New item form state
  const [title, setTitle] = useState("");
  const [childId, setChildId] = useState(childrenList[0]?.id || "child1");
  const [neededForDate, setNeededForDate] = useState(new Date().toISOString().split("T")[0]);
  const [targetHomeId, setTargetHomeId] = useState("parent2");
  const [category, setCategory] = useState<"sports" | "school" | "clothing" | "instrument" | "other">("sports");

  // Filter items
  const filteredItems = items.filter((item) => {
    const matchChild = selectedChildId === "all" || item.childId === selectedChildId;
    const matchCategory = filterCategory === "all" || item.category === filterCategory;
    return matchChild && matchCategory;
  });

  const packedCount = filteredItems.filter((i) => i.isPacked).length;
  const progressPct = filteredItems.length > 0 ? Math.round((packedCount / filteredItems.length) * 100) : 100;

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;
    StorageEngine.addPackingItem({
      title,
      childId,
      neededForDate,
      isPacked: false,
      targetHomeId,
      category,
    });
    setTitle("");
    setShowAddModal(false);
  };

  const categories = [
    { id: "all", label: "All Items" },
    { id: "sports", label: "⚽ Sports Gear" },
    { id: "school", label: "📚 School & Homework" },
    { id: "instrument", label: "🎻 Instruments" },
    { id: "clothing", label: "👕 Clothing" },
    { id: "other", label: "🎒 Other" },
  ];

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Header Banner & Packing Progress */}
      <section className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-3xl p-5 text-white shadow-md flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl">
              🎒
            </div>
            <div>
              <h2 className="text-base font-bold leading-tight">Transition Packing List</h2>
              <p className="text-xs text-emerald-100">Gear & items moving between homes</p>
            </div>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-emerald-900 rounded-2xl text-xs font-bold shadow-xs hover:bg-emerald-50 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Item</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-black/15 backdrop-blur-xs p-3 rounded-2xl flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-semibold">
            <span>{packedCount} of {filteredItems.length} items packed</span>
            <span className="text-emerald-200">{progressPct}% Complete</span>
          </div>
          <div className="w-full bg-white/20 h-2.5 rounded-full overflow-hidden">
            <div
              className="bg-white h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPct}%` }}
            />
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
                ? "bg-emerald-600 text-white shadow-xs"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Items List */}
      <section className="flex flex-col gap-2.5">
        {filteredItems.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <Package className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-medium">No packing items found for this filter.</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const child = childrenList.find((c) => c.id === item.childId);
            const targetHome = parents.find((p) => p.id === item.targetHomeId);

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-3.5 flex items-center justify-between gap-3 transition-all ${
                  item.isPacked
                    ? "border-emerald-200 bg-emerald-50/30 opacity-80"
                    : "border-slate-200 shadow-2xs hover:border-slate-300"
                }`}
              >
                {/* Checkbox */}
                <button
                  onClick={() => StorageEngine.togglePackingItem(item.id)}
                  className="shrink-0 text-emerald-600 hover:scale-110 transition-transform"
                >
                  {item.isPacked ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-600 fill-emerald-100" />
                  ) : (
                    <Circle className="w-6 h-6 text-slate-300" />
                  )}
                </button>

                {/* Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{child?.avatar}</span>
                    <h3 className={`text-xs font-bold ${item.isPacked ? "line-through text-slate-400" : "text-slate-800"}`}>
                      {item.title}
                    </h3>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-medium">
                      <Calendar className="w-3 h-3 text-slate-400" />
                      {item.neededForDate}
                    </span>
                    <span className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      <Home className="w-3 h-3" />
                      To {targetHome?.name ? targetHome.name.split(" ")[0] : "Home"}
                    </span>
                  </div>
                </div>

                {/* Delete button */}
                <button
                  onClick={() => StorageEngine.deletePackingItem(item.id)}
                  className="text-slate-300 hover:text-rose-500 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })
        )}
      </section>

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800">Add Transition Packing Item</h3>

            <form onSubmit={handleAddItem} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Item Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Violin & Sheet Music"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Child</label>
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
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
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    <option value="sports">Sports</option>
                    <option value="school">School</option>
                    <option value="instrument">Instrument</option>
                    <option value="clothing">Clothing</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Needed Date</label>
                  <input
                    type="date"
                    value={neededForDate}
                    onChange={(e) => setNeededForDate(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Target Home</label>
                  <select
                    value={targetHomeId}
                    onChange={(e) => setTargetHomeId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 outline-none bg-white"
                  >
                    {parents.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
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
                  className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700"
                >
                  Save Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
