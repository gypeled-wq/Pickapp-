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
}

export const DriversView: React.FC<DriversViewProps> = ({
  drivers,
  driverTasks,
  childrenList,
  parents,
  activeParentId,
}) => {
  const [selectedDriverId, setSelectedDriverId] = useState<string | "all">("all");
  const [isAddPickupOpen, setIsAddPickupOpen] = useState(false);
  const [isAddDriverOpen, setIsAddDriverOpen] = useState(false);

  // Form State for new Pickup
  const [newDriverId, setNewDriverId] = useState(drivers[0]?.id || "");
  const [newChildId, setNewChildId] = useState("all");
  const [newType, setNewType] = useState<"pickup" | "dropoff">("pickup");
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
    if (!newDriverId || !newLocation) return;

    StorageEngine.addDriverTask({
      driverId: newDriverId,
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

  const handleAddDriverSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!driverName || !driverPhone) return;

    StorageEngine.addDriver(
      {
        name: driverName,
        relation: driverRelation || "נהג/ת מורשה",
        phone: driverPhone,
        carInfo: driverCar,
        avatar: driverAvatar || "🚘",
      }
    );

    setIsAddDriverOpen(false);
    setDriverName("");
    setDriverPhone("");
    setDriverCar("");
    setDriverRelation("");
  };

  const todayStr = new Date().toISOString().split("T")[0];

  const filteredTasks = driverTasks.filter((t) => {
    if (selectedDriverId !== "all" && t.driverId !== selectedDriverId) return false;
    return true;
  });

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

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={() => setIsAddPickupOpen(true)}
              className="flex items-center gap-1.5 bg-white text-orange-600 px-3.5 py-2 rounded-2xl text-xs font-bold shadow-xs hover:bg-orange-50 transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              איסוף חדש לנהג
            </button>
            <button
              onClick={() => setIsAddDriverOpen(true)}
              className="flex items-center gap-1.5 bg-orange-700/60 text-white px-3.5 py-2 rounded-2xl text-xs font-semibold border border-white/20 hover:bg-orange-700/80 transition-all active:scale-95"
            >
              <UserCheck className="w-4 h-4" />
              הוספת נהג מורשה
            </button>
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
          כל הנהגים ({driverTasks.length})
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

      {/* Driver Profiles Cards */}
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

      {/* Driver Pickups List Header */}
      <div className="flex items-center justify-between pt-2">
        <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
          <Navigation className="w-4 h-4 text-orange-500" />
          לוח משימות איסוף והורדה
        </h3>
        <span className="text-xs text-slate-400">{filteredTasks.length} משימות</span>
      </div>

      {/* Task List */}
      {filteredTasks.length === 0 ? (
        <div className="bg-white rounded-3xl p-8 text-center border border-slate-100 shadow-xs space-y-2">
          <Car className="w-10 h-10 text-slate-300 mx-auto" />
          <p className="text-sm font-semibold text-slate-600">אין משימות איסוף מוגדרות</p>
          <p className="text-xs text-slate-400">לחץ על "איסוף חדש לנהג" כדי להגדיר נהג מורשה</p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filteredTasks.map((task) => {
            const driver = drivers.find((d) => d.id === task.driverId);
            const child = childrenList.find((c) => c.id === task.childId);
            const isToday = task.date === todayStr;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl p-4 border transition-all shadow-xs ${
                  task.completed
                    ? "border-slate-100 opacity-60 bg-slate-50/60"
                    : "border-slate-100 hover:border-orange-200"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3">
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

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            task.type === "pickup"
                              ? "bg-amber-100 text-amber-800"
                              : "bg-blue-100 text-blue-800"
                          }`}
                        >
                          {task.type === "pickup" ? "איסוף" : "הורדה"}
                        </span>

                        <span className="text-xs font-bold text-slate-800 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          {task.time}
                        </span>

                        {isToday && (
                          <span className="bg-emerald-100 text-emerald-700 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                            היום
                          </span>
                        )}
                      </div>

                      <p className="text-sm font-bold text-slate-800 mt-1 flex items-center gap-1">
                        <span>{child ? `${child.avatar} ${child.name}` : "כל הילדים"}</span>
                        <span className="text-slate-400 font-normal">|</span>
                        <span className="text-xs text-slate-600">נהג: {driver?.name || "נהג מורשה"}</span>
                      </p>

                      <div className="mt-2 space-y-1 text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>מקום איסוף: </span>
                          <span className="font-bold text-slate-900">{task.location}</span>
                        </div>
                        {task.destination && (
                          <div className="flex items-center gap-1.5 text-slate-600">
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                            <span>יעד: </span>
                            <span className="font-medium text-slate-800">{task.destination}</span>
                          </div>
                        )}
                      </div>

                      {task.notes && (
                        <p className="text-xs text-amber-800 bg-amber-50/80 p-2 rounded-lg mt-2 border border-amber-100/60 font-medium">
                          💡 הערות לנהג: {task.notes}
                        </p>
                      )}
                    </div>
                  </div>

                  {driver?.phone && (
                    <a
                      href={`tel:${driver.phone}`}
                      className="p-2 rounded-xl bg-slate-100 text-slate-600 hover:text-emerald-600 hover:bg-emerald-50 transition-all"
                      title="חייג"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Add Pickup Task */}
      {isAddPickupOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-slate-800 text-base flex items-center gap-2">
                <Car className="w-5 h-5 text-orange-500" />
                הגדרת איסוף חדש לנהג
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
                <label className="block text-slate-600 font-semibold mb-1">בחר נהג מורשה:</label>
                <select
                  value={newDriverId}
                  onChange={(e) => setNewDriverId(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                >
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
                    onChange={(e) => setNewType(e.target.value as "pickup" | "dropoff")}
                    className="w-full p-2.5 rounded-xl border border-slate-200 bg-slate-50 font-medium"
                  >
                    <option value="pickup">🚗 איסוף</option>
                    <option value="dropoff">🚌 הורדה</option>
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
