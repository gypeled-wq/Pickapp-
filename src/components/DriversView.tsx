import React, { useState } from "react";
import { DriverProfile, DriverPickupTask, Child, ParentProfile } from "../types";
import { StorageEngine } from "../data";
import { Car, Phone, CheckCircle2, Circle, Clock, MapPin, Plus, UserCheck, Shield, ChevronRight, Navigation } from "lucide-react";

interface DriversViewProps {
  drivers: DriverProfile[];
  driverTasks: DriverPickupTask[];
  childrenList: Child[];
  parents: ParentProfile[];
  activeParentId: string;
  onLockDriverMode?: (driverId: string) => void;
  isLockedInDriverMode?: boolean;
}

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  driverTasks,
  childrenList,
  parents,
  activeParentId,
  onLockDriverMode,
  isLockedInDriverMode,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | "all" | "unassigned">("all");
  const [isAddPickupOpen, setIsAddPickupOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);

  // Claim Ride Modal State
  const [claimingTaskId, setClaimingTaskId] = useState<string | null>(null);
  const [claimDriverSelect, setClaimDriverSelect] = useState<string>(drivers[0]?.id || "");

  // Form State for new Pickup
  const [newDriverId, setNewDriverId] = useState<string>("unassigned");
  const [newChildId, setNewChildId] = useState("all");
  const [newType, setNewType] = useState<"pickup" | "dropoff" | "babysitter" | "combined">("pickup");
  const [newTime, setNewTime] = useState("16:00");
  const [newDate, setNewDate] = useState(new Date().toISOString().split("T")[0]);
  const [newLocation, setNewLocation] = useState("");
  const [newDestination, setNewDestination] = useState("");
  const [newNotes, setNewNotes] = useState("");

  // Form State for new Driver
  const [driverName, setDriverName] = useState("");
  const [driverRelation, setDriverRelation] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [driverCar, setDriverCar] = useState("");
  const [driverAvatar, setDriverAvatar] = useState("🚘");

  const handleAddPickupSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLocation) return;

    StorageEngine.addDriverTask({
      driverId: newDriverId || "unassigned",
      childId: newChildId,
      type: newType,
      date: newDate,
      time: newTime,
      location: newLocation,
      destination: newDestination || "בית/מסגרת",
      completed: false,
      notes: newNotes,
      assignedByParentId: activeParentId,
    });

    setIsAddPickupOpen(false);
    setNewLocation("");
    setNewDestination("");
    setNewNotes("");
  };

  const handleClaimSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingTaskId || !claimDriverSelect) return;
    StorageEngine.claimDriverTask(claimingTaskId, claimDriverSelect);
    setClaimingTaskId(null);
  };

  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverPhone) return;

    StorageEngine.addDriver({
      name: driverName,
      relation: driverRelation || "נהג/ת מורשה",
      phone: driverPhone,
      carInfo: driverCar,
      avatar: driverAvatar || "🚘",
    });

    setIsAddDriverOpen(false);
    setDriverName("");
    setDriverPhone("");
    setDriverCar("");
    setDriverRelation("");
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredTasks = driverTasks.filter((t) => {
    if (selectedDriverId === "unassigned") return t.driverId === "unassigned";
    if (selectedDriverId !== "all" && t.driverId !== selectedDriverId) return false;
    return true;
  });

  const unassignedCount = driverTasks.filter((t) => t.driverId === "unassigned" && !t.completed).length;

  return (
    <div className="space-[#1e293b] space-y-4 pb-24" dir="rtl">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-600 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold backdrop-blur-md">
              <Car className="w-3.5 h-3.5" />
              נהגים ואיסופים מורשים
            </span>
            <span className="text-xs opacity-90">{todayStr}</span>
          </div>
          <h2 className="text-xl font-bold">מערך ההסעות של הילדים</h2>
          <p className="text-xs opacity-90 mt-1 max-w-sm">
            ריכוז משימות איסוף והורדה לנהגים, סבים/סבתות, ובייביסיטרים - ללא גישה לפרטי ההורים.
          </p>

          <div className="flex items-center gap-2 mt-4 flex-wrap">
            <button
              onClick={() => setIsAddPickupOpen(true)}
              className="flex items-center gap-1.5 bg-white text-orange-600 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs hover:bg-orange-50 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              איסוף חדש לנהג
            </button>

            <button
              onClick={() => setIsAddDriverOpen(true)}
              className="flex items-center gap-1.5 bg-orange-700/60 hover:bg-orange-700 text-white px-3.5 py-2 rounded-2xl text-xs font-bold border border-white/20 transition-all"
            >
              <UserCheck className="w-4 h-4" />
              הוסף נהג חדש
            </button>

            {onLockDriverMode && (
              <button
                onClick={() => {
                  const targetId = selectedDriverId === "all" || selectedDriverId === "unassigned" ? (drivers[0]?.id || "driver1") : selectedDriverId;
                  onLockDriverMode(targetId);
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                  isLockedInDriverMode
                    ? "bg-amber-300 text-slate-900 font-extrabold"
                    : "bg-black/20 hover:bg-black/30 text-white border border-white/20"
                }`}
              >
                <span>🔒 נעול תצוגת נהג</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Driver Selector Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedDriverId("all")}
          className={`px-3.5 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
            selectedDriverId === "all"
              ? "bg-orange-600 text-white shadow-sm"
              : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
          }`}
        >
          כל המשימות ({driverTasks.length})
        </button>

        <button
          onClick={() => setSelectedDriverId("unassigned")}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all ${
            selectedDriverId === "unassigned"
              ? "bg-rose-600 text-white shadow-sm"
              : "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
          }`}
        >
          <span>❓ ללא נהג</span>
          {unassignedCount > 0 && (
            <span className="bg-rose-200 text-rose-900 px-1.5 py-0.2 rounded-full text-[10px]">
              {unassignedCount}
            </span>
          )}
        </button>

        {drivers.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDriverId(d.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold whitespace-nowrap transition-all ${
              selectedDriverId === d.id
                ? "bg-orange-600 text-white shadow-sm"
                : "bg-white text-slate-600 border border-slate-200/80 hover:bg-slate-50"
            }`}
          >
            <span>{d.avatar}</span>
            <span>{d.name}</span>
          </button>
        ))}
      </div>

      {/* Driver Pickups List Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-orange-500" />
          לוח משימות איסוף, הורדה ובייביסיטר
        </h3>
        <span className="text-xs text-slate-400">{filteredTasks.length} משימות</span>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-xs space-y-2">
          <Car className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">אין משימות איסוף בקטגוריה זו</p>
          <p className="text-xs text-slate-400">לחץ על "איסוף חדש לנהג" כדי להגדיר נשייעה או משימה</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const driver = drivers.find((d) => d.id === task.driverId);
            const isUnassigned = task.driverId === "unassigned";
            const child = childrenList.find((c) => c.id === task.childId);
            const isToday = task.date === todayStr;

            let typeBadgeClass = "bg-amber-100 text-amber-800";
            let typeText = "🚗 איסוף";
            if (task.type === "dropoff") {
              typeBadgeClass = "bg-blue-100 text-blue-800";
              typeText = "🚌 הורדה";
            } else if (task.type === "babysitter") {
              typeBadgeClass = "bg-purple-100 text-purple-800";
              typeText = "🍼 בייביסיטר / השגחה";
            } else if (task.type === "combined") {
              typeBadgeClass = "bg-emerald-100 text-emerald-800";
              typeText = "🚘🔄 משולב (איסוף+פיזור)";
            }

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
                  task.completed
                    ? "border-slate-100 opacity-60 bg-slate-50/60"
                    : isUnassigned
                    ? "border-rose-200 bg-rose-50/30 hover:border-rose-300"
                    : "border-slate-100 hover:border-orange-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <button
                      onClick={() => StorageEngine.toggleDriverTask(task.id)}
                      className="mt-0.5 text-slate-400 hover:text-orange-600 transition-colors"
                    >
                      {task.completed ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </button>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${typeBadgeClass}`}>
                          {typeText}
                        </span>

                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.time} ({task.date})
                        </span>

                        {isToday && (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            היום
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-800 mt-1.5 flex items-center gap-1 flex-wrap">
                        <span>{child ? `${child.avatar} ${child.name}` : "👧👦 כל הילדים"}</span>
                        <span className="text-slate-300 font-normal">|</span>
                        {isUnassigned ? (
                          <span className="inline-flex items-center gap-1 text-xs font-black text-rose-700 bg-rose-100 px-2 py-0.5 rounded-lg border border-rose-200 animate-pulse">
                            ❓ דרוש נהג! (נסיעה פתוחה)
                          </span>
                        ) : (
                          <span className="text-xs text-slate-600 font-semibold">
                            נהג: {driver ? `${driver.avatar} ${driver.name}` : "נהג מורשה"}
                          </span>
                        )}
                      </p>

                      <div className="mt-2 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>איסוף / יציאה: </span>
                          <span className="font-bold text-slate-900">{task.location}</span>
                        </div>
                        {task.destination && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>יעד הגעה: </span>
                            <span className="font-medium text-slate-800">{task.destination}</span>
                          </div>
                        )}
                      </div>

                      {task.notes && (
                        <p className="text-xs text-amber-800 bg-amber-50/80 p-2 rounded-lg mt-2 border border-amber-100/60 font-medium">
                          💡 הערות: {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    {isUnassigned ? (
                      <button
                        onClick={() => {
                          setClaimingTaskId(task.id);
                          setClaimDriverSelect(drivers[0]?.id || "");
                        }}
                        className="px-3 py-1.5 bg-gradient-to-r from-orange-600 to-amber-600 text-white text-xs font-bold rounded-xl shadow-xs hover:from-orange-700 hover:to-amber-700 active:scale-95 transition-all flex items-center gap-1"
                      >
                        <span>✋ קח נסיעה זו</span>
                      </button>
                    ) : (
                      driver?.phone && (
                        <a
                          href={`tel:${driver.phone}`}
                          className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                          title="חייג לנהג"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Driver Profiles Cards (Moved to bottom) */}
      <div className="pt-4 border-t border-slate-200/80 space-y-2.5">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <UserCheck className="w-4 h-4 text-orange-500" />
          פרטי נהגים ומסיעים מורשים
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {drivers.map((driver) => {
            const tasksCount = driverTasks.filter((t) => t.driverId === driver.id && !t.completed).length;
            return (
              <div
                key={driver.id}
                className="bg-white rounded-2xl p-3.5 border border-slate-100 shadow-xs flex items-center justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center text-xl shadow-xs">
                    {driver.avatar}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-800">{driver.name}</h3>
                      {tasksCount > 0 && (
                        <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                          {tasksCount} איסופים
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-500">{driver.relation}</p>
                    {driver.carInfo && (
                      <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Car className="w-3 h-3 text-slate-400" />
                        {driver.carInfo}
                      </p>
                    )}
                  </div>
                </div>

                <a
                  href={`tel:${driver.phone}`}
                  className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition-all shadow-xs"
                  title="חייג לנהג"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal: Claim Ride */}
      {claimingTaskId && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-xl border border-slate-100 space-y-4" dir="rtl">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-orange-500" />
                שיבוץ נהג / קליטת נסיעה
              </h3>
              <button
                onClick={() => setClaimingTaskId(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClaimSubmit} className="space-y-3 text-xs">
              <p className="text-slate-600 font-medium">
                בחר נהג שיקח ויבצע את הנסיעה הזו:
              </p>

              <div>
                <label className="block text-slate-700 font-bold mb-1">בחר נהג מהרשימה:</label>
                <select
                  value={claimDriverSelect}
                  onChange={(e) => setClaimDriverSelect(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-slate-200 bg-slate-50 font-bold text-slate-800"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.avatar} {d.name} ({d.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 text-white p-3 rounded-2xl font-bold hover:bg-emerald-700 transition-colors shadow-xs"
                >
                  קח/שבץ נסיעה
                </button>
                <button
                  type="button"
                  onClick={() => setClaimingTaskId(null)}
                  className="px-4 bg-slate-100 text-slate-600 p-3 rounded-2xl font-semibold hover:bg-slate-200"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Pickup Task */}
      {isAddPickupOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-orange-500" />
                הגדרת איסוף/נסיעה חדשה
              </h3>
              <button
                onClick={() => setIsAddPickupOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddPickupSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">בחר נהג מורשה (או השאר פתוח):</label>
                <select
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="unassigned">❓ ללא נהג (נסיעה פתוחה לקליטה)</option>
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.avatar} {d.name} ({d.relation})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">עבור מי הילד/ה:</label>
                <select
                  value={newChildId}
                  onChange={(e) => setNewChildId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="all">👧👦 כל הילדים</option>
                  {childrenList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.avatar} {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">סוג משימה:</label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as "pickup" | "dropoff" | "babysitter" | "combined")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="pickup">🚗 איסוף</option>
                    <option value="dropoff">🚌 הורדה/פיזור</option>
                    <option value="babysitter">🍼 בייביסיטר / השגחה</option>
                    <option value="combined">🚘🔄 משולב (איסוף ופיזור)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">שעה:</label>
                  <input
                    type="time"
                    value={newTime}
                    onChange={(e) => setNewTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">תאריך:</label>
                <input
                  type="date"
                  value={newDate}
                  onChange={(e) => setNewDate(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">מקום איסוף/הורדה:</label>
                <input
                  type="text"
                  placeholder="למשל: בית ספר יסודי - שער א'"
                  value={newLocation}
                  onChange={(e) => setNewLocation(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">יעד (לאן מסיעים):</label>
                <input
                  type="text"
                  placeholder="למשל: בית אבא / חוג כדורגל"
                  value={newDestination}
                  onChange={(e) => setNewDestination(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">הערות ודגשים לנהג:</label>
                <textarea
                  rows={2}
                  placeholder="למשל: להביא בקבוק מים, קסדה..."
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white p-2.5 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-xs"
                >
                  שמור משימה
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddPickupOpen(false)}
                  className="px-4 bg-slate-100 text-slate-600 p-2.5 rounded-xl font-semibold hover:bg-slate-200"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Driver */}
      {isAddDriverOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-orange-500" />
                הוספת נהג מורשה חדש
              </h3>
              <button
                onClick={() => setIsAddDriverOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddDriverSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">שם מלא:</label>
                <input
                  type="text"
                  placeholder="למשל: סבא אלי / יוסף הנהג"
                  value={driverName}
                  onChange={(e) => setDriverName(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">תפקיד / זיקה לילדים:</label>
                <input
                  type="text"
                  placeholder="למשל: סבא, בייביסיטר, נהג קבוע"
                  value={driverRelation}
                  onChange={(e) => setDriverRelation(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">מספר טלפון לתיאום:</label>
                <input
                  type="tel"
                  placeholder="050-0000000"
                  value={driverPhone}
                  onChange={(e) => setDriverPhone(e.target.value)}
                  required
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">פרטי רכב (צבע, דגם, מס' רישוי):</label>
                <input
                  type="text"
                  placeholder="למשל: מאזדה 3 לבנה (78-901-23)"
                  value={driverCar}
                  onChange={(e) => setDriverCar(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">אייקון / אימוג'י:</label>
                <select
                  value={driverAvatar}
                  onChange={(e) => setDriverAvatar(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
                  <option value="👴">👴 סבא</option>
                  <option value="👵">👵 סבתא</option>
                  <option value="👩‍🦰">👩‍🦰 בייביסיטר</option>
                  <option value="🚘">🚘 נהג</option>
                  <option value="🚐">🚐 הסעה</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 bg-orange-600 text-white p-2.5 rounded-xl font-bold hover:bg-orange-700 transition-colors shadow-xs"
                >
                  אישור והוספה
                </button>
                <button
                  type="button"
                  onClick={() => setIsAddDriverOpen(false)}
                  className="px-4 bg-slate-100 text-slate-600 p-2.5 rounded-xl font-semibold hover:bg-slate-200"
                >
                  ביטול
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
