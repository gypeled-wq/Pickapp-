import React, { useState } from "react";
import { Child, ParentProfile, DriverProfile } from "../types";
import { StorageEngine } from "../data";
import {
  ShieldCheck,
  User,
  Users,
  Car,
  Plus,
  Trash2,
  Edit2,
  Check,
  X,
  KeyRound,
  Heart,
  Baby,
  Phone,
  Save,
  Smile,
} from "lucide-react";

interface AdminViewProps {
  childrenList: Child[];
  parents: ParentProfile[];
  drivers: DriverProfile[];
}

export const AdminView: React.FC<AdminViewProps> = ({
  childrenList,
  parents,
  drivers,
}) => {
  const [activeTab, setActiveTab] = useState<"children" | "parents" | "drivers" | "security">("children");

  // Children editing state
  const [editingChild, setEditingChild] = useState<Child | null>(null);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [newChildName, setNewChildName] = useState("");
  const [newChildAvatar, setNewChildAvatar] = useState("👧");
  const [newChildNotes, setNewChildNotes] = useState("");
  const [newChildClothing, setNewChildClothing] = useState("");
  const [newChildShoe, setNewChildShoe] = useState("");

  // Parents editing state
  const [editingParent, setEditingParent] = useState<ParentProfile | null>(null);

  // Drivers editing state
  const [editingDriver, setEditingDriver] = useState<DriverProfile | null>(null);
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverRelation, setNewDriverRelation] = useState("");
  const [newDriverPhone, setNewDriverPhone] = useState("");
  const [newDriverCar, setNewDriverCar] = useState("");
  const [newDriverAvatar, setNewDriverAvatar] = useState("🚘");

  // Security / PIN state
  const [currentPin, setCurrentPin] = useState(StorageEngine.getPinCode() || "1234");
  const [newPinInput, setNewPinInput] = useState("");
  const [pinSuccessMsg, setPinSuccessMsg] = useState("");

  // Quick Emoji choices
  const EMOJI_LIST = ["👧", "👦", "👶", "🧒", "👩‍👧", "👨‍👦", "👴", "👵", "👩‍🦰", "👨‍🦲", "🚘", "🚗", "🚲"];

  // Handle Child actions
  const handleSaveChildEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingChild) return;
    StorageEngine.updateChild(editingChild);
    setEditingChild(null);
  };

  const handleAddChildSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChildName.trim()) return;
    StorageEngine.addChild({
      name: newChildName.trim(),
      avatar: newChildAvatar,
      notes: newChildNotes.trim(),
      clothingSize: newChildClothing.trim(),
      shoeSize: newChildShoe.trim(),
    });
    setNewChildName("");
    setNewChildNotes("");
    setNewChildClothing("");
    setNewChildShoe("");
    setIsAddingChild(false);
  };

  const handleDeleteChild = (id: string, name: string) => {
    if (confirm(`האם למחוק את הפרופיל של ${name}?`)) {
      StorageEngine.deleteChild(id);
    }
  };

  // Handle Parent actions
  const handleSaveParentEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingParent) return;
    StorageEngine.updateParent(editingParent);
    setEditingParent(null);
  };

  // Handle Driver actions
  const handleSaveDriverEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    StorageEngine.updateDriver(editingDriver);
    setEditingDriver(null);
  };

  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDriverName.trim()) return;
    StorageEngine.addDriver({
      name: newDriverName.trim(),
      relation: newDriverRelation.trim() || "נהג / מסיע",
      phone: newDriverPhone.trim(),
      carInfo: newDriverCar.trim(),
      avatar: newDriverAvatar,
    });
    setNewDriverName("");
    setNewDriverRelation("");
    setNewDriverPhone("");
    setNewDriverCar("");
    setIsAddingDriver(false);
  };

  const handleDeleteDriver = (id: string, name: string) => {
    if (confirm(`האם למחוק את הנהג ${name}?`)) {
      StorageEngine.deleteDriver(id);
    }
  };

  // Handle Security / PIN
  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPinInput.length === 4) {
      StorageEngine.setPinCode(newPinInput);
      setCurrentPin(newPinInput);
      setNewPinInput("");
      setPinSuccessMsg("קוד PIN עודכן בהצלחה!");
      setTimeout(() => setPinSuccessMsg(""), 3000);
    } else {
      alert("קוד ה-PIN חייב להכיל בדיוק 4 ספרות");
    }
  };

  return (
    <div className="space-y-4 pb-24" dir="rtl">
      {/* Admin Header Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="flex items-center justify-between mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
            מסך ניהול ואדמין
          </span>
          <span className="text-2xl">⚙️</span>
        </div>
        <h2 className="text-xl font-black text-white">ניהול הגדרות, ילדים ונהגים</h2>
        <p className="text-xs opacity-80 mt-1">
          שינוי שמות הורים, הוספת/עריכת ילדים, עדכון נהגים מסיעים והגדרת קוד אבטחה.
        </p>

        {/* Tab Switcher inside Admin */}
        <div className="grid grid-cols-4 gap-1.5 mt-4 bg-white/10 p-1 rounded-2xl backdrop-blur-md">
          <button
            onClick={() => setActiveTab("children")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === "children"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Baby className="w-3.5 h-3.5" />
            <span>ילדים</span>
          </button>

          <button
            onClick={() => setActiveTab("parents")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === "parents"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>הורים</span>
          </button>

          <button
            onClick={() => setActiveTab("drivers")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === "drivers"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <Car className="w-3.5 h-3.5" />
            <span>נהגים</span>
          </button>

          <button
            onClick={() => setActiveTab("security")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 ${
              activeTab === "security"
                ? "bg-white text-indigo-950 shadow-sm"
                : "text-slate-300 hover:text-white"
            }`}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span>אבטחה</span>
          </button>
        </div>
      </div>

      {/* TAB 1: CHILDREN MANAGEMENT */}
      {activeTab === "children" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Baby className="w-4 h-4 text-purple-600" />
              ניהול פרופיל הילדים ({childrenList.length})
            </h3>
            <button
              onClick={() => setIsAddingChild(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-purple-700 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף ילד/ה</span>
            </button>
          </div>

          {/* Form: Add Child */}
          {isAddingChild && (
            <form onSubmit={handleAddChildSubmit} className="bg-purple-50/80 border border-purple-200 rounded-3xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-purple-200 pb-2">
                <span className="font-extrabold text-purple-900">הוספת ילד/ה חדש/ה</span>
                <button
                  type="button"
                  onClick={() => setIsAddingChild(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">שם הילד/ה *</label>
                  <input
                    type="text"
                    required
                    placeholder="לדוגמה: אמה"
                    value={newChildName}
                    onChange={(e) => setNewChildName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">אימוג'י / סמל</label>
                  <div className="flex items-center gap-1 overflow-x-auto pb-1">
                    {EMOJI_LIST.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setNewChildAvatar(emoji)}
                        className={`text-lg p-1.5 rounded-xl transition-all ${
                          newChildAvatar === emoji ? "bg-purple-200 scale-110" : "hover:bg-white"
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">מידת ביגוד (אופציונלי)</label>
                  <input
                    type="text"
                    placeholder="לדוגמה: 8-9Y"
                    value={newChildClothing}
                    onChange={(e) => setNewChildClothing(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">מידת נעליים (אופציונלי)</label>
                  <input
                    type="text"
                    placeholder="לדוגמה: 33 EU"
                    value={newChildShoe}
                    onChange={(e) => setNewChildShoe(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">הערות רפואיות / חוגים</label>
                <textarea
                  placeholder="לדוגמה: אלרגיה לבוטנים, חוג כדורגל בשלישי וחמישי"
                  value={newChildNotes}
                  onChange={(e) => setNewChildNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-white h-16"
                />
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingChild(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold hover:bg-purple-700"
                >
                  שמור ילד/ה
                </button>
              </div>
            </form>
          )}

          {/* Children Cards List */}
          <div className="space-y-2.5">
            {childrenList.map((child) => (
              <div
                key={child.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
              >
                {editingChild?.id === child.id ? (
                  /* Edit Child Form Inline */
                  <form onSubmit={handleSaveChildEdit} className="space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-800">עריכת {editingChild.name}</span>
                      <button
                        type="button"
                        onClick={() => setEditingChild(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">שם</label>
                        <input
                          type="text"
                          value={editingChild.name}
                          onChange={(e) => setEditingChild({ ...editingChild, name: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">אימוג'י</label>
                        <input
                          type="text"
                          value={editingChild.avatar}
                          onChange={(e) => setEditingChild({ ...editingChild, avatar: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">מידת ביגוד</label>
                        <input
                          type="text"
                          value={editingChild.clothingSize || ""}
                          onChange={(e) => setEditingChild({ ...editingChild, clothingSize: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">מידת נעליים</label>
                        <input
                          type="text"
                          value={editingChild.shoeSize || ""}
                          onChange={(e) => setEditingChild({ ...editingChild, shoeSize: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-600 mb-0.5">הערות וחוגים</label>
                      <input
                        type="text"
                        value={editingChild.notes || ""}
                        onChange={(e) => setEditingChild({ ...editingChild, notes: e.target.value })}
                        className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                      />
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingChild(null)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl font-bold"
                      >
                        ביטול
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-purple-600 text-white rounded-xl font-bold"
                      >
                        עדכן
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Display Child Card */
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center text-2xl shadow-2xs">
                        {child.avatar}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900">{child.name}</h4>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {child.notes || "אין הערות מיוחדות"}
                        </p>
                        <div className="flex items-center gap-3 text-[11px] font-semibold text-slate-600 mt-1.5">
                          {child.clothingSize && <span>👕 ביגוד: {child.clothingSize}</span>}
                          {child.shoeSize && <span>👟 נעליים: {child.shoeSize}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingChild(child)}
                        className="p-2 text-slate-400 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition-all"
                        title="ערוך"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      {childrenList.length > 1 && (
                        <button
                          onClick={() => handleDeleteChild(child.id, child.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                          title="מחק"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PARENTS MANAGEMENT */}
      {activeTab === "parents" && (
        <div className="space-y-3">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-4 h-4 text-indigo-600" />
            שינוי שמות הורים ופרופילים
          </h3>

          <div className="space-y-3">
            {parents.map((parent) => (
              <div
                key={parent.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
              >
                {editingParent?.id === parent.id ? (
                  <form onSubmit={handleSaveParentEdit} className="space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-800">עריכת פרופיל הורה</span>
                      <button
                        type="button"
                        onClick={() => setEditingParent(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">שם ההורה</label>
                      <input
                        type="text"
                        required
                        value={editingParent.name}
                        onChange={(e) => setEditingParent({ ...editingParent, name: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">סמל אימוג'י / אווטאר</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editingParent.avatarUrl}
                          onChange={(e) => setEditingParent({ ...editingParent, avatarUrl: e.target.value })}
                          className="w-20 p-2.5 rounded-xl border border-slate-200 bg-slate-50 text-center text-xl"
                        />
                        <div className="flex items-center gap-1 overflow-x-auto">
                          {["👩‍👧", "👨‍👦", "👩", "👨", "👩‍🦰", "👨‍🦲"].map((emoji) => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => setEditingParent({ ...editingParent, avatarUrl: emoji })}
                              className="text-xl p-1.5 rounded-xl hover:bg-slate-100"
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingParent(null)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl font-bold"
                      >
                        ביטול
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700"
                      >
                        שמור שינויים
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-700 flex items-center justify-center text-2xl shadow-2xs">
                        {parent.avatarUrl}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900">{parent.name}</h4>
                        <span className="inline-block text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded-full mt-0.5">
                          {parent.role === "Mom" ? "אמא" : parent.role === "Dad" ? "אבא" : "הורה מלווה"}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => setEditingParent(parent)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                      title="ערוך שם"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: DRIVERS MANAGEMENT */}
      {activeTab === "drivers" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
              <Car className="w-4 h-4 text-orange-600" />
              ניהול נהגים ומסיעים ({drivers.length})
            </h3>
            <button
              onClick={() => setIsAddingDriver(true)}
              className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-orange-700 active:scale-95 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>הוסף נהג/ת</span>
            </button>
          </div>

          {/* Form: Add Driver */}
          {isAddingDriver && (
            <form onSubmit={handleAddDriverSubmit} className="bg-orange-50/80 border border-orange-200 rounded-3xl p-4 space-y-3 text-xs">
              <div className="flex justify-between items-center border-b border-orange-200 pb-2">
                <span className="font-extrabold text-orange-950">הוספת נהג/ת מסיע/ה</span>
                <button
                  type="button"
                  onClick={() => setIsAddingDriver(false)}
                  className="text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">שם הנהג/ת *</label>
                  <input
                    type="text"
                    required
                    placeholder="לדוגמה: סבא אלי"
                    value={newDriverName}
                    onChange={(e) => setNewDriverName(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">זיקה / תפקיד</label>
                  <input
                    type="text"
                    placeholder="לדוגמה: סבא / בייביסיטר / נהג משפחתי"
                    value={newDriverRelation}
                    onChange={(e) => setNewDriverRelation(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">מספר טלפון</label>
                  <input
                    type="tel"
                    placeholder="050-1234567"
                    value={newDriverPhone}
                    onChange={(e) => setNewDriverPhone(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">פרטי רכב (דגם ומספר)</label>
                  <input
                    type="text"
                    placeholder="מאזדה 3 לבנה (78-901-23)"
                    value={newDriverCar}
                    onChange={(e) => setNewDriverCar(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-1">
                <button
                  type="button"
                  onClick={() => setIsAddingDriver(false)}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-300"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold hover:bg-orange-700"
                >
                  שמור נהג/ת
                </button>
              </div>
            </form>
          )}

          {/* Drivers List */}
          <div className="space-y-2.5">
            {drivers.map((driver) => (
              <div
                key={driver.id}
                className="bg-white rounded-2xl p-4 border border-slate-100 shadow-xs space-y-3"
              >
                {editingDriver?.id === driver.id ? (
                  <form onSubmit={handleSaveDriverEdit} className="space-y-3 text-xs">
                    <div className="flex justify-between items-center border-b pb-2">
                      <span className="font-extrabold text-slate-800">עריכת נהג {editingDriver.name}</span>
                      <button
                        type="button"
                        onClick={() => setEditingDriver(null)}
                        className="text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">שם</label>
                        <input
                          type="text"
                          value={editingDriver.name}
                          onChange={(e) => setEditingDriver({ ...editingDriver, name: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50 font-bold"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">זיקה/תפקיד</label>
                        <input
                          type="text"
                          value={editingDriver.relation}
                          onChange={(e) => setEditingDriver({ ...editingDriver, relation: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">טלפון</label>
                        <input
                          type="tel"
                          value={editingDriver.phone}
                          onChange={(e) => setEditingDriver({ ...editingDriver, phone: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">פרטי רכב</label>
                        <input
                          type="text"
                          value={editingDriver.carInfo || ""}
                          onChange={(e) => setEditingDriver({ ...editingDriver, carInfo: e.target.value })}
                          className="w-full p-2 rounded-xl border border-slate-200 bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => setEditingDriver(null)}
                        className="px-3 py-1.5 bg-slate-200 text-slate-700 rounded-xl font-bold"
                      >
                        ביטול
                      </button>
                      <button
                        type="submit"
                        className="px-3 py-1.5 bg-orange-600 text-white rounded-xl font-bold"
                      >
                        עדכן
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center text-2xl shadow-2xs">
                        {driver.avatar}
                      </div>
                      <div>
                        <h4 className="text-base font-black text-slate-900">{driver.name}</h4>
                        <p className="text-xs text-orange-700 font-semibold">{driver.relation}</p>
                        <div className="flex items-center gap-3 text-[11px] font-medium text-slate-600 mt-1">
                          <span className="flex items-center gap-1">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {driver.phone}
                          </span>
                          {driver.carInfo && <span>🚘 {driver.carInfo}</span>}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setEditingDriver(driver)}
                        className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-xl transition-all"
                        title="ערוך"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteDriver(driver.id, driver.name)}
                        className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                        title="מחק"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: SECURITY & PIN */}
      {activeTab === "security" && (
        <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-4">
          <div className="flex items-center gap-3 border-b pb-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center text-xl">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-extrabold text-slate-800">הגדרת קוד אבטחה (PIN)</h3>
              <p className="text-xs text-slate-500">
                קוד זה משמש לנעילת המסך ועריכת הגדרות הורים/ילדים
              </p>
            </div>
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/60 flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700">קוד PIN נוכחי במערכת:</span>
            <span className="font-black text-indigo-700 bg-indigo-100 px-3 py-1 rounded-xl tracking-widest text-sm">
              {currentPin}
            </span>
          </div>

          {pinSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600" />
              {pinSuccessMsg}
            </div>
          )}

          <form onSubmit={handleUpdatePin} className="space-y-3 text-xs pt-1">
            <label className="block font-extrabold text-slate-800">הזן קוד PIN חדש (4 ספרות):</label>
            <div className="flex gap-2">
              <input
                type="password"
                maxLength={4}
                required
                placeholder="****"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value)}
                className="flex-1 p-3 rounded-2xl border border-slate-200 bg-slate-50 text-center font-black text-lg tracking-widest"
              />
              <button
                type="submit"
                className="px-5 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 shadow-xs"
              >
                עדכן קוד
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
