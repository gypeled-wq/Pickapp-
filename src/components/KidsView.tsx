import React, { useState } from "react";
import { Child, CustodySchedule, TaskOrPickup, PackingItem, ParentProfile, DriverProfile, DriverPickupTask } from "../types";
import { StorageEngine } from "../data";
import { Home, Sparkles, CheckCircle2, Circle, Clock, Heart, Lock, Calendar, Star, Sun, BellRing, MapPin } from "lucide-react";

interface KidsViewProps {
  childrenList: Child[];
  parents: ParentProfile[];
  schedules: CustodySchedule[];
  tasks: TaskOrPickup[];
  packingItems: PackingItem[];
  drivers: DriverProfile[];
  driverTasks: DriverPickupTask[];
  onLockKidsMode: () => void;
  isLockedInKidsMode?: boolean;
}

export const KidsView: React.FC<KidsViewProps> = ({
  childrenList,
  parents,
  schedules,
  tasks,
  packingItems,
  drivers,
  driverTasks,
  onLockKidsMode,
  isLockedInKidsMode,
}) => {
  const [selectedChildId, setSelectedChildId] = useState<string>(childrenList[0]?.id || "child1");
  const [stars, setStars] = useState<number>(3);
  const [starredToday, setStarredToday] = useState(false);
  const [reminderAlertMinutes, setReminderAlertMinutes] = useState<number>(30);
  const [reminderActive, setReminderActive] = useState<boolean>(true);

  const selectedChild = childrenList.find((c) => c.id === selectedChildId) || childrenList[0];
  const todayStr = new Date().toISOString().split("T")[0];
  const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];

  // Schedules
  const todaySchedule = schedules.find((s) => s.date === todayStr) || { primaryParentId: "parent1" };
  const tomorrowSchedule = schedules.find((s) => s.date === tomorrowStr) || { primaryParentId: "parent2" };

  const todayParent = parents.find((p) => p.id === todaySchedule.primaryParentId) || parents[0];
  const tomorrowParent = parents.find((p) => p.id === tomorrowSchedule.primaryParentId) || parents[1];

  // Today's Pickup person for this child
  // Check driver tasks first, then parent tasks
  const todayDriverTask = driverTasks.find(
    (dt) => dt.date === todayStr && (dt.childId === selectedChildId || dt.childId === "all") && !dt.completed
  );

  let pickupPersonName = todayParent?.name || "אמא / אבא";
  let pickupPersonAvatar = todayParent?.avatarUrl || "👤";
  let pickupTimeStr = "16:00";
  let pickupLocation = "שער המסגרת";

  if (todayDriverTask) {
    const driver = drivers.find((d) => d.id === todayDriverTask.driverId);
    if (driver) {
      pickupPersonName = `${driver.name} (${driver.relation})`;
      pickupPersonAvatar = driver.avatar;
      pickupTimeStr = todayDriverTask.time;
      pickupLocation = todayDriverTask.location;
    }
  } else {
    // Check parent task
    const parentTask = tasks.find(
      (t) => t.date === todayStr && (t.childId === selectedChildId || t.childId === "all") && t.type === "pickup"
    );
    if (parentTask) {
      const respParent = parents.find((p) => p.id === parentTask.responsibleParentId);
      if (respParent) {
        pickupPersonName = respParent.name;
        pickupPersonAvatar = respParent.avatarUrl;
        pickupTimeStr = parentTask.time;
        pickupLocation = parentTask.location || pickupLocation;
      }
    }
  }

  // Countdown math to pickup time
  const calculateTimeRemaining = (timeStr: string) => {
    const now = new Date();
    const [hours, minutes] = timeStr.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return "בסוף יום הלימודים";

    const targetTime = new Date();
    targetTime.setHours(hours, minutes, 0, 0);

    const diffMs = targetTime.getTime() - now.getTime();
    if (diffMs <= 0) return "זמן האיסוף הגיע!";

    const totalMinutes = Math.floor(diffMs / (1000 * 60));
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;

    if (h > 0) {
      return `בעוד ${h} שעות ו-${m} דקות`;
    }
    return `בעוד ${m} דקות`;
  };

  const timeUntilPickup = calculateTimeRemaining(pickupTimeStr);

  // Activities for this child today
  const childTodayActivities = tasks.filter(
    (t) => t.date === todayStr && (t.childId === selectedChildId || t.childId === "all")
  );

  // Gear / Packing for this child
  const childPacking = packingItems.filter(
    (p) => (p.childId === selectedChildId || p.childId === "all") && p.neededForDate === todayStr
  );

  const handleStarClick = () => {
    if (!starredToday) {
      setStars((prev) => prev + 1);
      setStarredToday(true);
    }
  };

  return (
    <div className="space-y-4 pb-24" dir="rtl">
      {/* Header Banner for Kids */}
      <div className="bg-gradient-to-r from-violet-500 via-purple-500 to-pink-500 rounded-3xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-white/20 text-xs font-bold backdrop-blur-md">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              אזור הילדים והלו"ז היומי
            </span>

            <button
              onClick={onLockKidsMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-2xl text-xs font-bold transition-all shadow-xs ${
                isLockedInKidsMode
                  ? "bg-amber-400 text-slate-900 border border-amber-300"
                  : "bg-white/20 hover:bg-white/30 text-white border border-white/30"
              }`}
            >
              <Lock className="w-3.5 h-3.5" />
              {isLockedInKidsMode ? "מצב נעול לילדים" : "נעול תצוגה לילדים"}
            </button>
          </div>

          <h2 className="text-2xl font-black flex items-center gap-2">
            <span>שלום {selectedChild?.name || "חמודים"}!</span>
            <span className="text-3xl animate-bounce">🎈</span>
          </h2>
          <p className="text-xs opacity-90 mt-1">
            כאן תוכלו לראות איפה ישנים הלילה, מי אוסף אתכם, ואיזה ציוד צריך להכין!
          </p>

          {/* Child Switcher Buttons */}
          <div className="flex items-center gap-2 mt-4">
            {childrenList.map((c) => (
              <button
                key={c.id}
                onClick={() => setSelectedChildId(c.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-2xl text-xs font-bold transition-all ${
                  selectedChildId === c.id
                    ? "bg-white text-purple-700 shadow-md scale-105"
                    : "bg-purple-700/50 text-white hover:bg-purple-700/70"
                }`}
              >
                <span className="text-base">{c.avatar}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Status Cards for Kids */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {/* Card 1: Where am I sleeping tonight? */}
        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl p-5 border border-indigo-100 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-extrabold text-indigo-700 bg-indigo-100/80 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Home className="w-3.5 h-3.5 text-indigo-600" />
              איפה ישנים הלילה?
            </span>
            <span className="text-2xl">🌙</span>
          </div>

          <div className="flex items-center gap-4 bg-white/80 p-3.5 rounded-2xl border border-indigo-100/60 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500 text-white flex items-center justify-center text-3xl shadow-sm shrink-0">
              {todayParent?.avatarUrl || "🏠"}
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500">הלילה ישנים בבית של:</p>
              <h3 className="text-lg font-black text-indigo-950 mt-0.5">
                {todayParent?.name || "בית אמא / אבא"}
              </h3>
              <p className="text-[11px] text-indigo-600 font-semibold mt-0.5 flex items-center gap-1">
                <Heart className="w-3 h-3 text-pink-500 fill-pink-500" />
                מחר עוברים ל: {tomorrowParent?.name || "בית שני"}
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Who is picking me up today? */}
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-3xl p-5 border border-amber-100 shadow-xs relative overflow-hidden space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-amber-800 bg-amber-100/80 px-3 py-1 rounded-full flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-amber-600" />
              מי אוסף אותי היום?
            </span>
            <span className="text-2xl">🚗</span>
          </div>

          <div className="flex items-center gap-4 bg-white/90 p-3.5 rounded-2xl border border-amber-100/60 shadow-2xs">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center text-3xl shadow-sm shrink-0">
              {pickupPersonAvatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-500">נאסף בסוף היום על ידי:</p>
              <h3 className="text-base font-black text-amber-950 mt-0.5 truncate">{pickupPersonName}</h3>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-amber-900 font-bold flex-wrap">
                <span className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-lg text-amber-900">
                  <Clock className="w-3 h-3 text-amber-700" />
                  בשעה {pickupTimeStr}
                </span>
                <span className="flex items-center gap-1 bg-amber-100 px-2 py-0.5 rounded-lg text-amber-900">
                  <MapPin className="w-3 h-3 text-amber-700" />
                  {pickupLocation}
                </span>
              </div>
            </div>
          </div>

          {/* Countdown & Reminder Alert Box */}
          <div className="bg-amber-100/80 p-3 rounded-2xl border border-amber-200/80 flex flex-col gap-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-black text-amber-950 flex items-center gap-1">
                <Clock className="w-4 h-4 text-orange-600 animate-spin" />
                זמן עד האיסוף: <span className="text-orange-700 font-black">{timeUntilPickup}</span>
              </span>
              <span className="text-[10px] font-bold bg-orange-600 text-white px-2 py-0.5 rounded-full">
                התראה מוגדרת ✨
              </span>
            </div>

            <div className="flex items-center justify-between pt-1 border-t border-amber-200/60">
              <span className="text-[11px] font-bold text-amber-900">התראה לפני:</span>
              <div className="flex items-center gap-1">
                {[15, 30, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => setReminderAlertMinutes(mins)}
                    className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold transition-all ${
                      reminderAlertMinutes === mins
                        ? "bg-orange-600 text-white shadow-2xs"
                        : "bg-white text-amber-900 border border-amber-200 hover:bg-amber-50"
                    }`}
                  >
                    {mins} דקות
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Card: Child's Activities Schedule Today */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <Calendar className="w-4 h-4 text-indigo-600" />
            פעילויות וחוגים להיום ({selectedChild?.name})
          </h3>
          <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full">
            {childTodayActivities.length} פעילויות
          </span>
        </div>

        {childTodayActivities.length === 0 ? (
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-slate-600">אין חוגים מיוחדים היום – יום חופשי! 🎉</p>
          </div>
        ) : (
          <div className="space-y-2">
            {childTodayActivities.map((act) => (
              <div
                key={act.id}
                className="flex items-center justify-between p-3 rounded-2xl bg-indigo-50/50 border border-indigo-100 text-xs"
              >
                <div className="flex items-center gap-2.5">
                  <span className="p-2 rounded-xl bg-indigo-600 text-white font-bold">
                    {act.time}
                  </span>
                  <div>
                    <h4 className="font-extrabold text-slate-900">{act.title}</h4>
                    <p className="text-[11px] text-slate-500 font-medium">{act.location || "מסגרת קבועה"}</p>
                  </div>
                </div>

                <span className="px-2.5 py-1 bg-white rounded-xl text-[11px] font-bold text-indigo-700 shadow-2xs border border-indigo-100">
                  {act.type === "pickup" ? "איסוף" : act.type === "dropoff" ? "הורדה" : "חוג"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Card 3: What to pack / Gear checklist for today */}
      <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-extrabold text-slate-800 flex items-center gap-2">
            <BellRing className="w-4 h-4 text-purple-600" />
            מה מכינים בתיק להיום? ({selectedChild?.name})
          </h3>
          <span className="text-xs font-bold text-purple-600 bg-purple-50 px-2.5 py-1 rounded-full">
            {childPacking.filter((p) => p.isPacked).length} מתוך {childPacking.length} מוכנים
          </span>
        </div>

        {childPacking.length === 0 ? (
          <div className="bg-emerald-50/60 border border-emerald-100 rounded-2xl p-4 text-center space-y-1">
            <span className="text-2xl">🌟</span>
            <p className="text-xs font-bold text-emerald-800">הכול מוכן בתיק להיום!</p>
            <p className="text-[11px] text-emerald-600">אין פריטים מיוחדים שצריך לארוז היום.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {childPacking.map((item) => (
              <div
                key={item.id}
                onClick={() => StorageEngine.togglePackingItem(item.id)}
                className={`flex items-center justify-between p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  item.isPacked
                    ? "bg-emerald-50/80 border-emerald-200 text-emerald-900"
                    : "bg-slate-50 border-slate-100 hover:border-purple-200 text-slate-800"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button className="text-slate-400">
                    {item.isPacked ? (
                      <CheckCircle2 className="w-6 h-6 text-emerald-500 fill-emerald-100" />
                    ) : (
                      <Circle className="w-6 h-6 text-slate-300" />
                    )}
                  </button>
                  <span className={`text-sm font-bold ${item.isPacked ? "line-through opacity-70" : ""}`}>
                    {item.title}
                  </span>
                </div>

                <span className="text-xs bg-white px-2.5 py-1 rounded-xl shadow-2xs font-semibold text-slate-600">
                  {item.category === "sports"
                    ? "⚽ ספורט"
                    : item.category === "instrument"
                    ? "🎻 מוזיקה"
                    : item.category === "school"
                    ? "📚 לימודים"
                    : "🎒 ציוד"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Daily Star Sticker Reward Widget */}
      <div className="bg-gradient-to-r from-amber-400 via-orange-400 to-pink-400 rounded-3xl p-4 text-white shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-2xl shadow-xs">
            ⭐
          </div>
          <div>
            <h4 className="text-sm font-extrabold">כוכב יומי למערכת!</h4>
            <p className="text-xs opacity-90">מוכנים ליום מוצלח? לחצו לקבלת כוכב</p>
          </div>
        </div>

        <button
          onClick={handleStarClick}
          disabled={starredToday}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shadow-sm flex items-center gap-1.5 ${
            starredToday
              ? "bg-white/30 text-white cursor-default"
              : "bg-white text-orange-600 hover:bg-orange-50 active:scale-95"
          }`}
        >
          <Star className="w-4 h-4 fill-amber-300 text-amber-400" />
          <span>{starredToday ? "אספת כוכב!" : "קבל כוכב"}</span>
          <span className="bg-orange-600 text-white px-2 py-0.5 rounded-full text-[10px] font-bold">
            {stars}
          </span>
        </button>
      </div>
    </div>
  );
};
