import React, { useState } from "react";
import { Medication, Child, ParentProfile } from "../types";
import { StorageEngine } from "../data";
import { Pill, Plus, CheckCircle2, Clock, AlertTriangle, ShieldCheck, Trash2 } from "lucide-react";

interface MedicationTrackerProps {
  medications: Medication[];
  childrenList: Child[];
  parents: ParentProfile[];
  activeParentId: string;
  selectedChildId: string | "all";
}

export const MedicationTracker: React.FC<MedicationTrackerProps> = ({
  medications,
  childrenList,
  parents,
  activeParentId,
  selectedChildId,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Form state
  const [name, setName] = useState("");
  const [childId, setChildId] = useState(childrenList[0]?.id || "child1");
  const [dosage, setDosage] = useState("");
  const [timeSchedule, setTimeSchedule] = useState("");
  const [notes, setNotes] = useState("");

  const filteredMeds = medications.filter((m) => {
    return selectedChildId === "all" || m.childId === selectedChildId;
  });

  const handleAddMedication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !dosage) return;
    StorageEngine.addMedication({
      name,
      childId,
      dosage,
      timeSchedule,
      notes,
      handoffConfirmed: true,
    });
    setName("");
    setDosage("");
    setTimeSchedule("");
    setNotes("");
    setShowAddModal(false);
  };

  return (
    <div className="flex flex-col gap-4 pb-24">
      {/* Banner */}
      <section className="bg-gradient-to-r from-rose-600 to-pink-700 rounded-3xl p-5 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-xl">
            💊
          </div>
          <div>
            <h2 className="text-base font-bold leading-tight">Medication & Health Tracker</h2>
            <p className="text-xs text-rose-100">Dosages, schedules & handoff notes</p>
          </div>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-rose-900 rounded-2xl text-xs font-bold shadow-xs hover:bg-rose-50 transition-all active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Med</span>
        </button>
      </section>

      {/* List */}
      <section className="flex flex-col gap-3">
        {filteredMeds.length === 0 ? (
          <div className="bg-white border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 flex flex-col items-center gap-2">
            <Pill className="w-8 h-8 text-slate-300" />
            <p className="text-xs font-medium">No medications configured for selected child.</p>
          </div>
        ) : (
          filteredMeds.map((med) => {
            const child = childrenList.find((c) => c.id === med.childId);
            const lastParent = parents.find((p) => p.id === med.lastAdministeredBy);

            return (
              <div
                key={med.id}
                className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs flex flex-col gap-3"
              >
                {/* Top Row: Name, Dosage & Child */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xl">{child?.avatar}</span>
                    <div>
                      <h3 className="text-sm font-bold text-slate-800 leading-tight">{med.name}</h3>
                      <p className="text-xs text-rose-600 font-semibold mt-0.5">{med.dosage}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => StorageEngine.deleteMedication(med.id)}
                    className="text-slate-300 hover:text-rose-500 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                {/* 30-Day Supply Tracker & Alert Banner */}
                {(() => {
                  const total = med.totalQuantity ?? 30;
                  const perDay = med.pillsPerDay ?? 1;
                  const remaining = med.remainingQuantity ?? 30;
                  const daysLeft = Math.floor(remaining / Math.max(1, perDay));
                  const percentLeft = Math.round((remaining / total) * 100);
                  const isLow = daysLeft <= 7;

                  return (
                    <div className="space-y-2">
                      <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex flex-col gap-2">
                        <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                          <span className="flex items-center gap-1 text-slate-800">
                            <Pill className="w-3.5 h-3.5 text-rose-500" />
                            מלאי תרופה (ספירת 30 ימים)
                          </span>
                          <span className={isLow ? "text-rose-600 font-black" : "text-emerald-700 font-extrabold"}>
                            נותרו {remaining} / {total} מנות ({daysLeft} ימים)
                          </span>
                        </div>

                        {/* Progress Bar */}
                        <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all ${
                              isLow ? "bg-rose-500" : "bg-emerald-500"
                            }`}
                            style={{ width: `${Math.min(100, percentLeft)}%` }}
                          />
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium pt-0.5">
                          <span>תאריך חידוש אחרון: {med.lastRefillDate || "ללא רישום"}</span>
                          <button
                            onClick={() => StorageEngine.refillMedication(med.id, 30)}
                            className="text-indigo-600 hover:text-indigo-800 font-extrabold flex items-center gap-1"
                          >
                            <span>🔄 חידוש מלאי / מרשם (+30 יום)</span>
                          </button>
                        </div>
                      </div>

                      {/* Low Supply / Prescription Renewal Alert */}
                      {isLow && (
                        <div className="bg-rose-50 border border-rose-200 p-3 rounded-2xl flex items-center justify-between text-xs text-rose-900 font-bold gap-2">
                          <div className="flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 animate-bounce" />
                            <span>⚠️ התראה: נדרש חידוש מרשם ואיסוף תרופות חדש בתוך {daysLeft} ימים!</span>
                          </div>
                          <button
                            onClick={() => StorageEngine.refillMedication(med.id, 30)}
                            className="px-2.5 py-1 bg-rose-600 text-white rounded-xl text-[11px] font-extrabold shadow-2xs shrink-0"
                          >
                            חידוש מרשם
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Schedule & Instructions */}
                <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-600 flex flex-col gap-1.5">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                    <Clock className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Schedule: {med.timeSchedule || "As Needed"}</span>
                  </div>
                  {med.notes && <p className="italic text-slate-500">{med.notes}</p>}
                </div>

                {/* Handoff & Administration Status */}
                <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                  <div className="flex flex-col">
                    <span className="text-[11px] text-slate-400">Last Administered:</span>
                    <span className="text-xs font-medium text-slate-700">
                      {med.lastAdministered
                        ? `${new Date(med.lastAdministered).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} by ${lastParent?.name ? lastParent.name.split(" ")[0] : "Co-parent"}`
                        : "No recent dose recorded"}
                    </span>
                  </div>

                  <button
                    onClick={() => StorageEngine.confirmMedicationAdministered(med.id, activeParentId)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-2xl text-xs font-bold hover:bg-rose-100 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Log Dose</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </section>

      {/* Add Medication Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4">
            <h3 className="text-base font-bold text-slate-800">Add Medication Schedule</h3>

            <form onSubmit={handleAddMedication} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">Medication Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ventolin Inhaler"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">Child</label>
                  <select
                    value={childId}
                    onChange={(e) => setChildId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none bg-white"
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">Dosage</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2 puffs"
                    value={dosage}
                    onChange={(e) => setDosage(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Time / Schedule</label>
                <input
                  type="text"
                  placeholder="e.g. Twice daily at 08:00 & 18:00"
                  value={timeSchedule}
                  onChange={(e) => setTimeSchedule(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">Special Notes</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Take with meals, keep in backpack..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-rose-500 outline-none"
                />
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
                  className="px-4 py-2 bg-rose-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-rose-700"
                >
                  Save Medication
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
