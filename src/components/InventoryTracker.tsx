import React, { useState } from "react";
import { InventoryItem, Child } from "../types";
import { StorageEngine } from "../data";
import { ShoppingBag, Plus, AlertCircle, CheckCircle2, Tag, Edit2, Trash2 } from "lucide-react";

interface InventoryTrackerProps {
  inventory: InventoryItem[];
  childrenList: Child[];
  selectedChildId: string | "all";
}

export const InventoryTracker: React.FC<InventoryTrackerProps> = ({
  inventory,
  childrenList,
  selectedChildId,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingChildSizes, setEditingChildSizes] = useState<Child | null>(null);

  // Clothing & Shoe sizes state for edit modal
  const [editClothing, setEditClothing] = useState("");
  const [editShoe, setEditShoe] = useState("");

  // New Item state
  const [title, setTitle] = useState("");
  const [childId, setChildId] = useState(childrenList[0]?.id || "child1");
  const [status, setStatus] = useState<"good" | "needs_replacement" | "replaced">("needs_replacement");
  const [category, setCategory] = useState<string>("shoes");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [notes, setNotes] = useState("");

  const filteredItems = inventory.filter((item) => {
    return selectedChildId === "all" || item.childId === selectedChildId;
  });

  const handleAddInventory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return;

    StorageEngine.addInventoryItem({
      title,
      childId,
      status,
      category: category as any,
      estimatedCost: estimatedCost ? parseFloat(estimatedCost) : undefined,
      notes,
    });

    setTitle("");
    setEstimatedCost("");
    setNotes("");
    setShowAddModal(false);
  };

  const handleSaveSizes = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingChildSizes) {
      StorageEngine.updateChild({
        ...editingChildSizes,
        clothingSize: editClothing,
        shoeSize: editShoe,
      });
      setEditingChildSizes(null);
    }
  };

  return (
    <div className="flex flex-col gap-4 pb-24" dir="rtl">
      {/* Banner */}
      <section className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-3xl p-5 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl">
            👟
          </div>
          <div>
            <h2 className="text-base font-extrabold leading-tight">מעקב מידות, ציוד והתבלות</h2>
            <p className="text-xs text-amber-100">מידות ביגוד ונעליים ופריטים הדורשים חידוש</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-amber-900 rounded-2xl text-xs font-bold shadow-xs hover:bg-amber-50 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>הוסף ציוד לחידוש</span>
        </button>
      </section>

      {/* 1. Kids Current Sizes Cards */}
      <section className="flex flex-col gap-2">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider px-1">
          מידות עדכניות של הילדים
        </h3>

        <div className="grid grid-cols-2 gap-2.5">
          {childrenList.map((child) => (
            <div
              key={child.id}
              className="bg-white border border-slate-200 rounded-2xl p-3.5 shadow-2xs flex flex-col justify-between gap-2"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <span className="text-lg">{child.avatar}</span>
                  <span className="text-xs font-extrabold text-slate-800">{child.name}</span>
                </div>
                <button
                  onClick={() => {
                    setEditingChildSizes(child);
                    setEditClothing(child.clothingSize || "");
                    setEditShoe(child.shoeSize || "");
                  }}
                  className="text-slate-400 hover:text-amber-600 p-1"
                  title="עדכן מידות"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5 text-center bg-slate-50 p-2 rounded-xl">
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">ביגוד</p>
                  <p className="text-xs font-black text-slate-800">{child.clothingSize || "לא צוין"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-slate-400 font-bold">נעליים</p>
                  <p className="text-xs font-black text-slate-800">{child.shoeSize || "לא צוין"}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2. Replacement & Wear/Tear List */}
      <section className="flex flex-col gap-2.5">
        <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider px-1">
          פריטים הדורשים החלפה/קנייה ({filteredItems.filter((i) => i.status === "needs_replacement").length})
        </h3>

        {filteredItems.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <ShoppingBag className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-medium">כל הפריטים והציוד במצב מעולה!</p>
          </div>
        ) : (
          filteredItems.map((item) => {
            const child = childrenList.find((c) => c.id === item.childId);

            return (
              <div
                key={item.id}
                className={`bg-white border rounded-2xl p-3.5 flex items-center justify-between gap-3 ${
                  item.status === "needs_replacement"
                    ? "border-amber-200 bg-amber-50/20 shadow-2xs"
                    : item.status === "replaced"
                    ? "border-emerald-200 bg-emerald-50/20 opacity-70"
                    : "border-slate-200"
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs">{child?.avatar}</span>
                    <h4 className="text-xs font-bold text-slate-800">{item.title}</h4>
                  </div>

                  {item.notes && <p className="text-[11px] text-slate-500 mt-1">{item.notes}</p>}

                  {item.estimatedCost && (
                    <p className="text-[11px] font-extrabold text-amber-700 mt-1">
                      עלות משוערת: ₪{item.estimatedCost}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <select
                    value={item.status}
                    onChange={(e) =>
                      StorageEngine.updateInventoryStatus(item.id, e.target.value as any)
                    }
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold border outline-none bg-white ${
                      item.status === "needs_replacement"
                        ? "text-amber-800 border-amber-300 bg-amber-50"
                        : item.status === "replaced"
                        ? "text-emerald-800 border-emerald-300 bg-emerald-50"
                        : "text-slate-700 border-slate-200"
                    }`}
                  >
                    <option value="needs_replacement">נדרשת קנייה</option>
                    <option value="replaced">נקנה חודש ✨</option>
                    <option value="good">מצב תקין</option>
                  </select>

                  <button
                    onClick={() => StorageEngine.deleteInventoryItem(item.id)}
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

      {/* Edit Sizes Modal */}
      {editingChildSizes && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-extrabold text-slate-800">
              עדכון מידות עבור {editingChildSizes.name}
            </h3>

            <form onSubmit={handleSaveSizes} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700">מידת ביגוד</label>
                <input
                  type="text"
                  placeholder="לדוגמה: 8-9Y"
                  value={editClothing}
                  onChange={(e) => setEditClothing(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">מידת נעליים</label>
                <input
                  type="text"
                  placeholder="לדוגמה: 33 EU"
                  value={editShoe}
                  onChange={(e) => setEditShoe(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingChildSizes(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-amber-700"
                >
                  שמור מידות
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-extrabold text-slate-800">הוספת ציוד/פריט להחלפה</h3>

            <form onSubmit={handleAddInventory} className="flex flex-col gap-3 text-xs">
              <div>
                <label className="text-xs font-bold text-slate-700">שם הפריט</label>
                <input
                  type="text"
                  required
                  placeholder="לדוגמה: נעלי כדורגל חדשות מידה 34"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">עבור הילד/ה</label>
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">קטגוריה</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
                  >
                    <option value="shoes">נעליים</option>
                    <option value="clothing">ביגוד</option>
                    <option value="school_supplies">ציוד בית ספר</option>
                    <option value="gear">ציוד חוגים/ספורט</option>
                    <option value="other">שונות</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">עלות משוערת (₪)</label>
                  <input
                    type="number"
                    placeholder="150"
                    value={estimatedCost}
                    onChange={(e) => setEstimatedCost(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">סטטוס</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as any)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none bg-white font-medium"
                  >
                    <option value="needs_replacement">נדרשת קנייה</option>
                    <option value="replaced">נקנה</option>
                    <option value="good">תקין</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">הערות</label>
                <textarea
                  rows={2}
                  placeholder="לדוגמה: הנעליים הקודמות לוחצות באצבעות..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-amber-700"
                >
                  שמור
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
