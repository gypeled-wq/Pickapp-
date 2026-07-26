import React, { useState } from "react";
import { CustodySchedule, TaskOrPickup, ParentProfile, Child, CustodySwapRequest, DriverProfile, DriverPickupTask } from "../types";
import { StorageEngine } from "../data";
import { Calendar as CalendarIcon, Clock, MapPin, ArrowRightLeft, Plus, CheckCircle2, Circle, AlertCircle, Sparkles, ChevronLeft, ChevronRight, Car, Phone, UserCheck, Navigation } from "lucide-react";

interface CustodyScheduleViewProps {
  schedules: CustodySchedule[];
  tasks: TaskOrPickup[];
  parents: ParentProfile[];
  childrenList: Child[];
  activeParentId: string;
  selectedChildId: string | "all";
  swaps: CustodySwapRequest[];
  drivers?: DriverProfile[];
  driverTasks?: DriverPickupTask[];
}

export const CustodyScheduleView: React.FC<CustodyScheduleViewProps> = ({
  schedules,
  tasks,
  parents,
  childrenList,
  activeParentId,
  selectedChildId,
  swaps,
  drivers = [],
  driverTasks = [],
}) => {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [viewMode, setViewMode] = useState<"daily" | "calendar">("calendar");
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showAddTaskModal, setShowAddTaskModal] = useState(false);

  // Month Calendar Helper Calculation
  const selectedDateObj = new Date(selectedDate + "T00:00:00");
  const currentYear = selectedDateObj.getFullYear();
  const currentMonth = selectedDateObj.getMonth();

  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun

  const monthName = selectedDateObj.toLocaleDateString("he-IL", { month: "long", year: "numeric" });

  const handlePrevMonth = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setMonth(d.getMonth() - 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    setSelectedDate(`${year}-${month}-01`);
  };

  const handleNextMonth = () => {
    const d = new Date(selectedDate + "T00:00:00");
    d.setMonth(d.getMonth() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, "0");
    setSelectedDate(`${year}-${month}-01`);
  };

  // New task form state
  const [taskTitle, setTaskTitle] = useState("");
  const [taskChildId, setTaskChildId] = useState(childrenList[0]?.id || "child1");
  const [taskType, setTaskType] = useState<"pickup" | "dropoff" | "activity">("pickup");
  const [taskTime, setTaskTime] = useState("16:00");
  const [taskLocation, setTaskLocation] = useState("");

  // Swap form state
  const [swapDate, setSwapDate] = useState(todayStr);
  const [proposedSubDate, setProposedSubDate] = useState("");
  const [swapNote, setSwapNote] = useState("");

  // Driver Pickup Modal State
  const [showDriverPickupModal, setShowDriverPickupModal] = useState(false);
  const [dpDriverId, setDpDriverId] = useState("unassigned");
  const [dpChildId, setDpChildId] = useState(childrenList[0]?.id || "child1");
  const [dpTime, setDpTime] = useState("16:00");
  const [dpType, setDpType] = useState<"pickup" | "dropoff" | "babysitter" | "combined">("pickup");
  const [dpLocation, setDpLocation] = useState("");
  const [dpDestination, setDpDestination] = useState("");
  const [dpNotes, setDpNotes] = useState("");

  // Claim ride state
  const [claimingDriverTaskId, setClaimingDriverTaskId] = useState<string | null>(null);
  const [claimingDriverId, setClaimingDriverId] = useState(drivers[0]?.id || "");

  const handleCreateDriverTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dpLocation) return;
    StorageEngine.addDriverTask({
      driverId: dpDriverId,
      childId: dpChildId,
      type: dpType,
      date: selectedDate,
      time: dpTime,
      location: dpLocation,
      destination: dpDestination || "בית/מסגרת",
      completed: false,
      notes: dpNotes,
      assignedByParentId: activeParentId,
    });
    setShowDriverPickupModal(false);
    setDpLocation("");
    setDpDestination("");
    setDpNotes("");
  };

  const handleClaimDriverTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimingDriverTaskId || !claimingDriverId) return;
    StorageEngine.claimDriverTask(claimingDriverTaskId, claimingDriverId);
    setClaimingDriverTaskId(null);
  };

  const todaySchedule = schedules.find((s) => s.date === todayStr) || {
    date: todayStr,
    primaryParentId: "parent1",
    hasHandoff: false,
  };

  const tomorrowDateObj = new Date();
  tomorrowDateObj.setDate(tomorrowDateObj.getDate() + 1);
  const tomorrowStr = tomorrowDateObj.toISOString().split("T")[0];
  const tomorrowSchedule = schedules.find((s) => s.date === tomorrowStr) || {
    date: tomorrowStr,
    primaryParentId: "parent2",
    hasHandoff: true,
  };

  const DEFAULT_PARENT: ParentProfile = {
    id: "parent1",
    name: "Parent",
    role: "Mom",
    color: "bg-indigo-500",
    avatarUrl: "👤",
  };

  const todayParent =
    (parents && parents.length > 0 && (parents.find((p) => p.id === todaySchedule.primaryParentId) || parents[0])) ||
    DEFAULT_PARENT;
  const tomorrowParent =
    (parents && parents.length > 0 && (parents.find((p) => p.id === tomorrowSchedule.primaryParentId) || parents[1] || parents[0])) ||
    DEFAULT_PARENT;

  // Selected Date Schedule
  const activeSchedule = schedules.find((s) => s.date === selectedDate) || {
    date: selectedDate,
    primaryParentId: "parent1",
    hasHandoff: false,
  };
  const activeParentForDate =
    (parents && parents.length > 0 && (parents.find((p) => p.id === activeSchedule.primaryParentId) || parents[0])) ||
    DEFAULT_PARENT;

  // Filter tasks for selected date and selected child
  const filteredTasks = tasks.filter((t) => {
    const matchDate = t.date === selectedDate;
    const matchChild = selectedChildId === "all" || t.childId === selectedChildId;
    return matchDate && matchChild;
  });

  // Days list for horizontal date slider (7 days window)
  const dateWindow = Array.from({ length: 9 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 2 + i);
    return d.toISOString().split("T")[0];
  });

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle) return;
    StorageEngine.addTask({
      title: taskTitle,
      childId: taskChildId,
      type: taskType,
      time: taskTime,
      date: selectedDate,
      responsibleParentId: activeParentId,
      location: taskLocation,
      completed: false,
    });
    setTaskTitle("");
    setTaskLocation("");
    setShowAddTaskModal(false);
  };

  const handleCreateSwap = (e: React.FormEvent) => {
    e.preventDefault();
    StorageEngine.addSwapRequest({
      requestedByParentId: activeParentId,
      dateToSwap: swapDate,
      proposedSubstituteDate: proposedSubDate || undefined,
      note: swapNote,
    });
    setShowSwapModal(false);
    setSwapNote("");
  };

  return (
    <div className="flex flex-col gap-5 pb-24">
      {/* 1. Who Has the Kids Banner */}
      <section className="bg-gradient-to-br from-indigo-900 via-indigo-800 to-slate-900 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden" dir="rtl">
        <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-indigo-500/10 rounded-full blur-xl pointer-events-none" />
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-semibold tracking-wider text-indigo-200 bg-indigo-700/50 px-3 py-1 rounded-full border border-indigo-500/30 backdrop-blur-xs">
            תצוגת אחריות ואיסופים
          </span>
          <button
            onClick={() => setShowSwapModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-xs font-medium backdrop-blur-xs border border-white/15 transition-all active:scale-95"
          >
            <ArrowRightLeft className="w-3.5 h-3.5 text-indigo-300" />
            <span>בקשת החלפה</span>
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {/* Today Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
            <span className="text-[11px] text-indigo-200 font-bold">היום</span>
            <div className="my-2 flex items-center gap-2.5">
              <span className="text-2xl">{todayParent.avatarUrl}</span>
              <div>
                <p className="font-bold text-sm leading-tight text-white">{todayParent.name}</p>
                <p className="text-[11px] text-indigo-200">משמורת ראשית</p>
              </div>
            </div>
            {todaySchedule.hasHandoff ? (
              <div className="mt-1 pt-2 border-t border-white/10 flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                <span>מעבר ב-{todaySchedule.handoffTime || "17:00"}</span>
              </div>
            ) : (
              <div className="mt-1 pt-2 border-t border-white/10 text-[11px] text-emerald-300">
                יום מלא בבית
              </div>
            )}
          </div>

          {/* Tomorrow Card */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 border border-white/10 flex flex-col justify-between">
            <span className="text-[11px] text-indigo-200 font-bold">מחר</span>
            <div className="my-2 flex items-center gap-2.5">
              <span className="text-2xl">{tomorrowParent.avatarUrl}</span>
              <div>
                <p className="font-bold text-sm leading-tight text-white">{tomorrowParent.name}</p>
                <p className="text-[11px] text-indigo-200">משמורת ראשית</p>
              </div>
            </div>
            {tomorrowSchedule.hasHandoff ? (
              <div className="mt-1 pt-2 border-t border-white/10 flex items-center gap-1 text-[11px] text-amber-300 font-medium">
                <Clock className="w-3 h-3 text-amber-300 shrink-0" />
                <span>מעבר ב-{tomorrowSchedule.handoffTime || "17:00"}</span>
              </div>
            ) : (
              <div className="mt-1 pt-2 border-t border-white/10 text-[11px] text-emerald-300">
                יום מלא בבית
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Focus Area: Drop-offs at school for Mom's days & Special Items to Bring Me */}
      <section className="bg-gradient-to-br from-slate-900 to-indigo-950 rounded-3xl p-4 text-white shadow-md space-y-3" dir="rtl">
        <div className="flex items-center justify-between border-b border-indigo-800/80 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-300">🚗</span>
            <h3 className="text-sm font-extrabold text-white">הורדות במסגרת ודברים להעברה</h3>
          </div>
          <span className="text-[11px] font-semibold text-indigo-300 bg-indigo-900/60 px-2.5 py-0.5 rounded-full border border-indigo-700/50">
            תצוגה ממוקדת
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {/* Drop-offs for Mom's Days */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-indigo-200">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-400" />
                הורדות שלי במסגרות לימים שלה
              </span>
              <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full">08:00 בבוקר</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              כשמתחיל יום של אמא: הורדת הילדים בבית הספר/גן ב-08:00. משם היא אוספת אותם אליה.
            </p>
            <div className="bg-indigo-950/60 p-2 rounded-xl text-[11px] text-indigo-200 font-medium flex items-center justify-between">
              <span>הורדה קרובה: בוקר יום חמישי</span>
              <span className="font-bold text-emerald-400">08:00 בשער</span>
            </div>
          </div>

          {/* Special Items She Needs to Bring Me */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3 border border-white/10 space-y-1.5">
            <div className="flex items-center justify-between font-bold text-rose-200">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" />
                דברים מיוחדים שהיא צריכה להביא לי
              </span>
              <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded-full">מעברים</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              ציוד מיוחד וציוד מעבר (תרופות, כינור, קסדה) שהיא צריכה להעביר אליך לקראת הימים שלך.
            </p>
            <div className="bg-indigo-950/60 p-2 rounded-xl text-[11px] text-pink-200 font-medium flex items-center justify-between">
              <span>תרופות וכינור של נועם</span>
              <span className="font-bold text-amber-300">לפני יום ראשון</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Driver Rides Array Rubric (מערך ההסעות והאיסופים) */}
      <section className="bg-gradient-to-br from-amber-500 via-orange-600 to-amber-600 rounded-3xl p-4 text-white shadow-md space-y-3" dir="rtl">
        <div className="flex items-center justify-between border-b border-white/20 pb-2.5 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-xl bg-white/20 text-white text-base">🚘</span>
            <div>
              <h3 className="text-sm font-extrabold text-white">מערך ההסעות והאיסופים היומי</h3>
              <p className="text-[11px] opacity-90">איסופים לנהגים, סבים/סבתות ובייביסיטר ליום {selectedDate}</p>
            </div>
          </div>
          <button
            onClick={() => setShowDriverPickupModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-orange-700 hover:bg-orange-50 rounded-2xl text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            <Plus className="w-3.5 h-3.5 text-orange-600" />
            <span>הוסף איסוף לנהג</span>
          </button>
        </div>

        {/* List of driver tasks for selected date (or fallback) */}
        {(() => {
          const dateDriverTasks = driverTasks.filter((t) => t.date === selectedDate);
          const tasksToShow = dateDriverTasks.length > 0 ? dateDriverTasks : driverTasks.slice(0, 3);

          if (tasksToShow.length === 0) {
            return (
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-3.5 text-center text-xs text-white/90">
                אין איסופי נהגים מוגדרים ליום זה. לחץ על "הוסף איסוף לנהג" כדי לשבץ נהג/מסיע.
              </div>
            );
          }

          return (
            <div className="space-y-2">
              {dateDriverTasks.length === 0 && (
                <p className="text-[11px] text-amber-100 font-bold bg-black/15 px-3 py-1 rounded-xl">
                  📌 מציג איסופים קרובים ברשת (אין איסוף ספציפי בתאריך שנבחר):
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {tasksToShow.map((dt) => {
                  const driver = drivers.find((d) => d.id === dt.driverId);
                  const child = childrenList.find((c) => c.id === dt.childId);

                  return (
                    <div
                      key={dt.id}
                      className="bg-white text-slate-800 rounded-2xl p-3 shadow-xs space-y-2 border border-orange-100"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs text-orange-600 bg-orange-50 px-2 py-0.5 rounded-lg border border-orange-200/60">
                            ⏰ {dt.time}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                            {child ? `${child.avatar} ${child.name}` : "כל הילדים"}
                          </span>
                        </div>
                        <button
                          onClick={() => StorageEngine.toggleDriverTask(dt.id)}
                          className="text-slate-400 hover:text-emerald-600"
                          title="סמן כהושלם"
                        >
                          {dt.completed ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                          ) : (
                            <Circle className="w-5 h-5" />
                          )}
                        </button>
                      </div>

                      <div className="text-xs space-y-0.5">
                        <p className="font-bold text-slate-900 flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                          <span>מאיפה: {dt.location}</span>
                        </p>
                        <p className="text-slate-600 flex items-center gap-1 text-[11px]">
                          <Navigation className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                          <span>לאן: {dt.destination}</span>
                        </p>
                        {dt.notes && (
                          <p className="text-[11px] text-slate-500 italic bg-slate-50 p-1.5 rounded-lg">
                            "{dt.notes}"
                          </p>
                        )}
                      </div>

                      {/* Driver assignment bar */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                        {driver ? (
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800">
                              <span>{driver.avatar}</span>
                              <span>{driver.name}</span>
                              <span className="text-[10px] font-normal text-slate-500">({driver.relation})</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <a
                                href={`tel:${driver.phone}`}
                                className="p-1.5 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-100 transition-all"
                                title="חייג לנהג"
                              >
                                <Phone className="w-3.5 h-3.5" />
                              </a>
                              <button
                                onClick={() => {
                                  setClaimingDriverTaskId(dt.id);
                                  setClaimingDriverId(driver.id);
                                }}
                                className="text-[10px] text-orange-600 font-bold hover:underline px-1"
                              >
                                החלף
                              </button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between w-full bg-rose-50 p-1.5 rounded-xl border border-rose-200">
                            <span className="text-[11px] font-bold text-rose-700 flex items-center gap-1">
                              ⚠️ טרם שובץ נהג
                            </span>
                            <button
                              onClick={() => {
                                setClaimingDriverTaskId(dt.id);
                                setClaimingDriverId(drivers[0]?.id || "");
                              }}
                              className="px-2.5 py-1 bg-rose-600 text-white rounded-lg text-[10px] font-bold shadow-2xs hover:bg-rose-700 active:scale-95 transition-all"
                            >
                              שבץ נהג
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </section>

      {/* Pending Swaps Banner (if any) */}
      {swaps.filter((s) => s.status === "pending").length > 0 && (
        <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
            <AlertCircle className="w-4 h-4 text-amber-600" />
            <span>Pending Custody Swap Request</span>
          </div>
          {swaps
            .filter((s) => s.status === "pending")
            .map((swap) => {
              const requester = (parents && parents.find((p) => p.id === swap.requestedByParentId)) || parents?.[0] || DEFAULT_PARENT;
              const isMine = swap.requestedByParentId === activeParentId;

              return (
                <div
                  key={swap.id}
                  className="bg-white rounded-xl p-3 border border-amber-200/60 flex flex-col gap-2 shadow-2xs"
                >
                  <p className="text-xs text-slate-700">
                    <span className="font-semibold text-slate-900">{requester.name}</span> requested to swap custody on{" "}
                    <span className="font-semibold">{swap.dateToSwap}</span>
                    {swap.proposedSubstituteDate && (
                      <> in exchange for <span className="font-semibold">{swap.proposedSubstituteDate}</span></>
                    )}.
                  </p>
                  {swap.note && <p className="text-xs italic text-slate-500 bg-slate-50 p-2 rounded-lg">"{swap.note}"</p>}

                  {!isMine ? (
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        onClick={() => StorageEngine.respondToSwapRequest(swap.id, "accepted")}
                        className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-semibold shadow-xs hover:bg-emerald-700"
                      >
                        Accept Swap
                      </button>
                      <button
                        onClick={() => StorageEngine.respondToSwapRequest(swap.id, "declined")}
                        className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-xl text-xs font-semibold hover:bg-slate-200"
                      >
                        Decline
                      </button>
                    </div>
                  ) : (
                    <span className="text-xs text-amber-700 font-medium italic">Waiting for co-parent response...</span>
                  )}
                </div>
              );
            })}
        </section>
      )}

      {/* View Mode Toggle & Calendar Header */}
      <section className="flex flex-col gap-3" dir="rtl">
        <div className="flex items-center justify-between bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
          <button
            onClick={() => setViewMode("calendar")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              viewMode === "calendar"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <CalendarIcon className="w-4 h-4 text-indigo-600" />
            <span>📅 לוח שנה חודשי (צבעוני)</span>
          </button>

          <button
            onClick={() => setViewMode("daily")}
            className={`flex-1 py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 ${
              viewMode === "daily"
                ? "bg-white text-indigo-950 shadow-xs"
                : "text-slate-500 hover:text-slate-800"
            }`}
          >
            <Clock className="w-4 h-4 text-indigo-600" />
            <span>📋 סדר יום נגלל</span>
          </button>
        </div>

        {/* Color Coding Legend Banner */}
        <div className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between text-xs font-extrabold text-slate-700 shadow-2xs flex-wrap gap-2">
          <span className="text-slate-400 font-bold text-[11px]">מפתח צבעים:</span>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shadow-2xs" />
              <span className="text-rose-900">אמא (שרה)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-full bg-indigo-600 shadow-2xs" />
              <span className="text-indigo-900">אבא (דוד)</span>
            </div>
          </div>
        </div>

        {/* MONTH CALENDAR VIEW */}
        {viewMode === "calendar" && (
          <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b pb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrevMonth}
                  className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-all font-bold flex items-center gap-1 text-xs border border-slate-200/80 active:scale-95"
                  title="חודש קודם"
                >
                  <ChevronRight className="w-4 h-4" />
                  <span>קודם</span>
                </button>

                <h3 className="text-base font-black text-slate-900 flex items-center gap-1.5 px-1">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>לוח שנה: {monthName}</span>
                </h3>

                <button
                  onClick={handleNextMonth}
                  className="p-1.5 px-2.5 rounded-xl bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 text-slate-700 transition-all font-bold flex items-center gap-1 text-xs border border-slate-200/80 active:scale-95"
                  title="חודש הבא"
                >
                  <span>הבא</span>
                  <ChevronLeft className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-1 text-xs text-slate-500 font-bold">
                <span>לחץ על יום להצגת המשימות</span>
              </div>
            </div>

            {/* Weekdays Header */}
            <div className="grid grid-cols-7 gap-1 text-center font-black text-[11px] text-slate-400 pb-1 border-b border-slate-100">
              <span>א'</span>
              <span>ב'</span>
              <span>ג'</span>
              <span>ד'</span>
              <span>ה'</span>
              <span>ו'</span>
              <span>ש'</span>
            </div>

            {/* Month Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 text-xs">
              {/* Padding empty slots for month start */}
              {Array.from({ length: firstDayOfWeek }).map((_, idx) => (
                <div key={`pad-${idx}`} className="h-24 bg-slate-50/50 rounded-xl border border-dashed border-slate-100" />
              ))}

              {/* Days 1 to daysInMonth */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const monthFormatted = String(currentMonth + 1).padStart(2, "0");
                const dayFormatted = String(dayNum).padStart(2, "0");
                const dateKey = `${currentYear}-${monthFormatted}-${dayFormatted}`;

                const isSelected = dateKey === selectedDate;
                const isToday = dateKey === todayStr;

                const daySched = schedules.find((s) => s.date === dateKey);
                const isMomCustody = daySched?.primaryParentId === "parent1";

                // Tasks & Drivers for this date
                const dayTasks = tasks.filter((t) => t.date === dateKey);
                const dateDriverTasks = driverTasks.filter((dt) => dt.date === dateKey);
                const firstDriverTask = dateDriverTasks[0];
                const assignedDriver = firstDriverTask ? drivers.find((d) => d.id === firstDriverTask.driverId) : null;

                return (
                  <div
                    key={dateKey}
                    onClick={() => setSelectedDate(dateKey)}
                    className={`min-h-24 p-1.5 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between relative overflow-hidden group ${
                      isSelected
                        ? "ring-2 ring-indigo-600 ring-offset-1 border-indigo-500 shadow-md scale-[1.02]"
                        : isToday
                        ? "border-amber-400 bg-amber-50/40"
                        : "border-slate-100 hover:border-slate-300"
                    } ${
                      isMomCustody
                        ? "bg-rose-50/40 hover:bg-rose-50/80"
                        : "bg-indigo-50/40 hover:bg-indigo-50/80"
                    }`}
                  >
                    {/* Top Row: Day Number & Custody Badge & Quick Driver Assign */}
                    <div className="flex items-center justify-between gap-0.5">
                      <div className="flex items-center gap-1">
                        <span
                          className={`w-5 h-5 rounded-full font-black text-[11px] flex items-center justify-center ${
                            isToday
                              ? "bg-amber-500 text-white shadow-2xs"
                              : isSelected
                              ? "bg-indigo-600 text-white"
                              : "text-slate-800"
                          }`}
                        >
                          {dayNum}
                        </span>

                        <span
                          className={`text-[8px] font-extrabold px-1 py-0.2 rounded-full ${
                            isMomCustody
                              ? "bg-rose-200 text-rose-900"
                              : "bg-indigo-200 text-indigo-900"
                          }`}
                          title={isMomCustody ? "משמורת אמא (שרה)" : "משמורת אבא (דוד)"}
                        >
                          {isMomCustody ? "אמא" : "אבא"}
                        </span>
                      </div>

                      {/* Quick Driver Assign Button on Day Cell */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDate(dateKey);
                          setDpDriverId(drivers[0]?.id || "unassigned");
                          setDpLocation("שער בית הספר / הגן");
                          setDpDestination("בית / חוג");
                          setShowDriverPickupModal(true);
                        }}
                        className="p-1 rounded-lg bg-orange-100 hover:bg-orange-500 text-orange-700 hover:text-white transition-all text-[9px] font-bold flex items-center gap-0.5 shadow-2xs active:scale-95"
                        title="שבץ נהג ממאגר הנהגים ליום זה"
                      >
                        <Car className="w-2.5 h-2.5" />
                        <span>+</span>
                      </button>
                    </div>

                    {/* Driver Pickup Badge on Day Cell */}
                    {firstDriverTask && (
                      <div className="mt-1">
                        <span
                          className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md truncate flex items-center gap-1 border ${
                            assignedDriver
                              ? "bg-orange-500 text-white border-orange-600 shadow-2xs"
                              : "bg-rose-500 text-white border-rose-600 animate-pulse"
                          }`}
                          title={assignedDriver ? `נהג: ${assignedDriver.name}` : "טרם שובץ נהג"}
                        >
                          <Car className="w-2.5 h-2.5 shrink-0" />
                          <span className="truncate">
                            {assignedDriver ? `${assignedDriver.avatar} ${assignedDriver.name}` : "ללא נהג"}
                          </span>
                        </span>
                      </div>
                    )}

                    {/* Task Indicators for Mom and Dad */}
                    <div className="space-y-0.5 mt-1 overflow-hidden">
                      {dayTasks.slice(0, 1).map((t) => {
                        const isMomTask = t.responsibleParentId === "parent1";
                        return (
                          <div
                            key={t.id}
                            className={`text-[8px] font-bold px-1 py-0.5 rounded-md truncate flex items-center gap-1 border ${
                              isMomTask
                                ? "bg-rose-100 text-rose-900 border-rose-200"
                                : "bg-indigo-100 text-indigo-900 border-indigo-200"
                            }`}
                          >
                            <span className="w-1 h-1 rounded-full bg-slate-700 shrink-0" />
                            <span className="truncate">{t.title}</span>
                          </div>
                        );
                      })}

                      {dayTasks.length > 1 && (
                        <p className="text-[8px] font-extrabold text-slate-500 text-center">
                          +{dayTasks.length - 1} נוספים
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* HORIZONTAL SLIDER (in Daily view or when date picked) */}
        {viewMode === "daily" && (
          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
            {dateWindow.map((dateStr) => {
              const d = new Date(dateStr + "T00:00:00");
              const isSelected = dateStr === selectedDate;
              const isToday = dateStr === todayStr;
              const sched = schedules.find((s) => s.date === dateStr);
              const parent = (parents && parents.find((p) => p.id === sched?.primaryParentId)) || parents?.[0] || DEFAULT_PARENT;

              return (
                <button
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`flex flex-col items-center min-w-[62px] p-2.5 rounded-2xl border transition-all text-center ${
                    isSelected
                      ? "bg-indigo-600 text-white border-indigo-700 shadow-sm scale-105"
                      : isToday
                      ? "bg-indigo-50 border-indigo-200 text-indigo-900"
                      : "bg-white border-slate-200 text-slate-700 hover:border-slate-300"
                  }`}
                >
                  <span className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? "text-indigo-100" : "text-slate-400"}`}>
                    {d.toLocaleDateString("he-IL", { weekday: "short" })}
                  </span>
                  <span className="text-base font-extrabold my-0.5">{d.getDate()}</span>
                  <span className="text-xs">{parent.avatarUrl}</span>
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 3. Active Day Details & Tasks/Handoff Card */}
      <section className="bg-white border border-slate-200 rounded-3xl p-5 shadow-xs flex flex-col gap-4">
        {/* Day Header Info */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-xl">
              {activeParentForDate.avatarUrl}
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Primary Custody</p>
              <h3 className="text-base font-bold text-slate-800">{activeParentForDate.name}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {activeSchedule.hasHandoff ? (
              <span className="px-2.5 py-1 bg-amber-50 text-amber-700 border border-amber-200 rounded-xl text-xs font-semibold flex items-center gap-1">
                <Clock className="w-3 h-3" />
                Handoff Day
              </span>
            ) : (
              <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-xl text-xs font-medium">
                No Handoff
              </span>
            )}
          </div>
        </div>

        {/* Handoff Details if any */}
        {activeSchedule.hasHandoff && (
          <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-3 text-xs text-amber-900 flex flex-col gap-1.5">
            <div className="flex items-center gap-2 font-semibold">
              <MapPin className="w-3.5 h-3.5 text-amber-600" />
              <span>Location: {activeSchedule.handoffLocation || "School Gate"}</span>
              <span className="ml-auto bg-amber-200/80 px-2 py-0.5 rounded-md text-[11px]">
                {activeSchedule.handoffTime || "17:00"}
              </span>
            </div>
            {activeSchedule.notes && <p className="text-amber-800/90 pl-5">{activeSchedule.notes}</p>}
          </div>
        )}

        {/* Schedule Tasks / Activities List */}
        <div className="flex items-center justify-between pt-1">
          <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Daily Activities & Pickups ({filteredTasks.length})
          </h4>
          <button
            onClick={() => setShowAddTaskModal(true)}
            className="flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Event</span>
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="text-center py-6 border-2 border-dashed border-slate-100 rounded-2xl text-slate-400 text-xs">
            No specific pickups or activities logged for this day.
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {filteredTasks.map((t) => {
              const child = childrenList.find((c) => c.id === t.childId);
              const parent = parents.find((p) => p.id === t.responsibleParentId);

              return (
                <div
                  key={t.id}
                  className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-3 ${
                    t.completed
                      ? "bg-slate-50 border-slate-200 opacity-75"
                      : "bg-white border-slate-200/80 shadow-2xs hover:border-slate-300"
                  }`}
                >
                  <button
                    onClick={() => StorageEngine.toggleTaskCompletion(t.id)}
                    className="shrink-0 text-indigo-600 hover:scale-110 transition-transform"
                  >
                    {t.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 fill-emerald-50" />
                    ) : (
                      <Circle className="w-5 h-5 text-slate-300" />
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs">{child?.avatar}</span>
                      <p className={`text-xs font-bold ${t.completed ? "line-through text-slate-400" : "text-slate-800"}`}>
                        {t.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                      <span className="flex items-center gap-1 font-medium text-slate-700">
                        <Clock className="w-3 h-3 text-slate-400" />
                        {t.time}
                      </span>
                      {t.location && (
                        <span className="flex items-center gap-1 truncate">
                          <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{t.location}</span>
                        </span>
                      )}
                    </div>
                  </div>

                  <span className="text-xs shrink-0 px-2 py-1 rounded-xl bg-slate-100 text-slate-600 font-medium">
                    {parent?.name.split(" ")[0]}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal: Add Task */}
      {showAddTaskModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4 animate-in fade-in zoom-in-95 duration-150" dir="rtl">
            <h3 className="text-base font-bold text-slate-800">הוספת אירוע או איסוף ללו"ז</h3>
            <form onSubmit={handleCreateTask} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">שם האירוע / משימה</label>
                <input
                  type="text"
                  required
                  placeholder="למשל: איסוף נועם מחוג כדורגל"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-semibold text-slate-600">ילד/ה</label>
                  <select
                    value={taskChildId}
                    onChange={(e) => setTaskChildId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
                  >
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-600">שעה</label>
                  <input
                    type="time"
                    value={taskTime}
                    onChange={(e) => setTaskTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">מיקום (רשות)</label>
                <input
                  type="text"
                  placeholder="למשל: שער המגרש / בית הספר"
                  value={taskLocation}
                  onChange={(e) => setTaskLocation(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddTaskModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700"
                >
                  שמור אירוע
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Request Custody Swap */}
      {showSwapModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full shadow-2xl flex flex-col gap-4" dir="rtl">
            <div className="flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-800">בקשת החלפת ימי משמורת</h3>
            </div>

            <form onSubmit={handleCreateSwap} className="flex flex-col gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-600">תאריך שברצונך להחליף</label>
                <input
                  type="date"
                  required
                  value={swapDate}
                  onChange={(e) => setSwapDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">תאריך חלופי מוצע (רשות)</label>
                <input
                  type="date"
                  value={proposedSubDate}
                  onChange={(e) => setProposedSubDate(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-600">סיבה / הערה</label>
                <textarea
                  rows={2}
                  placeholder="למשל: אירוע משפחתי ביום שישי..."
                  value={swapNote}
                  onChange={(e) => setSwapNote(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSwapModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-indigo-700"
                >
                  שלח בקשת החלפה
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Driver Pickup Task Modal */}
      {showDriverPickupModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto" dir="rtl">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-xl space-y-4 my-auto">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                  <span>🚘</span>
                  <span>שיבוץ נהג ממאגר הנהגים ({selectedDate})</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  בחר נהג ממאגר הנהגים המאושרים והגדר פרטי נסיעה להסעת היום
                </p>
              </div>
              <button
                onClick={() => setShowDriverPickupModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold p-1 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            {/* Quick Driver Selection Cards from Library */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
                <span>בחר נהג ממאגר הנהגים:</span>
                <span className="text-[10px] text-orange-600 font-normal">לחץ לבחירה מהירה</span>
              </label>

              <div className="grid grid-cols-2 gap-2">
                {drivers.map((d) => {
                  const isSelected = dpDriverId === d.id;
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => setDpDriverId(d.id)}
                      className={`p-2 rounded-2xl border text-right transition-all flex items-center gap-2 ${
                        isSelected
                          ? "bg-orange-500 text-white border-orange-600 shadow-xs ring-2 ring-orange-300"
                          : "bg-slate-50 hover:bg-orange-50/60 border-slate-200 text-slate-800"
                      }`}
                    >
                      <span className="text-xl shrink-0">{d.avatar}</span>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-xs truncate">{d.name}</p>
                        <p className={`text-[10px] truncate ${isSelected ? "text-orange-100" : "text-slate-500"}`}>
                          {d.relation}
                        </p>
                      </div>
                    </button>
                  );
                })}

                <button
                  type="button"
                  onClick={() => setDpDriverId("unassigned")}
                  className={`p-2 rounded-2xl border text-right transition-all flex items-center gap-2 ${
                    dpDriverId === "unassigned"
                      ? "bg-rose-600 text-white border-rose-700 shadow-xs ring-2 ring-rose-300"
                      : "bg-slate-50 hover:bg-rose-50/60 border-slate-200 text-slate-700"
                  }`}
                >
                  <span className="text-xl shrink-0">⚠️</span>
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-xs truncate">טרם שובץ נהג</p>
                    <p className={`text-[10px] truncate ${dpDriverId === "unassigned" ? "text-rose-100" : "text-slate-500"}`}>
                      פתוח לכל מסיע פנוי
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <form onSubmit={handleCreateDriverTask} className="space-y-3 pt-1">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700">שיוך לילד</label>
                  <select
                    value={dpChildId}
                    onChange={(e) => setDpChildId(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
                  >
                    <option value="all">👧👦 כל הילדים</option>
                    {childrenList.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.avatar} {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700">שעת איסוף/הורדה</label>
                  <input
                    type="time"
                    required
                    value={dpTime}
                    onChange={(e) => setDpTime(e.target.value)}
                    className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">סוג נסיעה</label>
                <select
                  value={dpType}
                  onChange={(e) => setDpType(e.target.value as any)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
                >
                  <option value="pickup">🚗 איסוף בסיום מסגרת (Pickup)</option>
                  <option value="dropoff">🏫 הורדה בבוקר (Dropoff)</option>
                  <option value="babysitter">👩‍🦰 בייביסיטר ואיסוף מיוחד</option>
                  <option value="combined">🔄 משולב (הורדה + איסוף)</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">מאיפה אוספים?</label>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDpLocation("שער בית הספר / גן")}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-orange-100 rounded-lg font-bold text-slate-600"
                    >
                      🏫 בית ספר
                    </button>
                    <button
                      type="button"
                      onClick={() => setDpLocation("חוג כדורגל/מוזיקה")}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-orange-100 rounded-lg font-bold text-slate-600"
                    >
                      ⚽ חוג
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  required
                  placeholder="למשל: בית ספר יסודי - שער ראשי"
                  value={dpLocation}
                  onChange={(e) => setDpLocation(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">לאן מסיעים (יעד)?</label>
                  <div className="flex gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => setDpDestination("בית אמא (שרה)")}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-orange-100 rounded-lg font-bold text-slate-600"
                    >
                      🏠 בית אמא
                    </button>
                    <button
                      type="button"
                      onClick={() => setDpDestination("בית אבא (דוד)")}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-orange-100 rounded-lg font-bold text-slate-600"
                    >
                      🏠 בית אבא
                    </button>
                  </div>
                </div>
                <input
                  type="text"
                  placeholder="למשל: חוג כדורגל / בית אמא"
                  value={dpDestination}
                  onChange={(e) => setDpDestination(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700">הערות לנהג</label>
                <input
                  type="text"
                  placeholder="למשל: לתת לה בקבוק מים מהאוטו"
                  value={dpNotes}
                  onChange={(e) => setDpNotes(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setShowDriverPickupModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-700 text-white text-xs font-extrabold rounded-2xl shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <span>🚘</span>
                  <span>שמור ואישור נהג</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Claim / Assign Driver Modal */}
      {claimingDriverTaskId && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4" dir="rtl">
          <div className="bg-white rounded-3xl max-w-sm w-full p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-extrabold text-sm text-slate-900 flex items-center gap-1.5">
                <span>🚘</span>
                <span>שיבוץ / החלפת נהג לנסיעה</span>
              </h3>
              <button
                onClick={() => setClaimingDriverTaskId(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleClaimDriverTask} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-700">בחר נהג מהרשימה:</label>
                <select
                  value={claimingDriverId}
                  onChange={(e) => setClaimingDriverId(e.target.value)}
                  className="w-full mt-1 px-3 py-2 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                >
                  {drivers.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.avatar} {d.name} ({d.relation}) - {d.carInfo || "אין פרטי רכב"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setClaimingDriverTaskId(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-700"
                >
                  ביטול
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-orange-700"
                >
                  אשר שיבוץ נהג
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
