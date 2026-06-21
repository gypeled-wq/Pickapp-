/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { Pickup, Driver, DAYS_OF_WEEK, DEFAULT_CHILDREN } from "../types";
import { StorageEngine, subscribeToStore } from "../data";
import { Calendar, Clock, Smile, Car, ShieldAlert, CheckCircle2, Compass, User } from "lucide-react";
import { motion } from "motion/react";

export default function KidsView() {
  const [pickups, setPickups] = useState<Pickup[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeKid, setActiveKid] = useState("איתי");

  // מציאת היום הנוכחי (או הדמיה של היום לפי זמן המערכת הנוכחי)
  const getCurrentHebrewDay = (): string => {
    const days = ["ראשון", "ראשון", "שני", "שלישי", "רביעי", "חמישי", "שישי", "ראשון"];
    const dayIndex = new Date().getDay(); // 0 is Sunday
    return days[dayIndex];
  };

  const [simulatedDay, setSimulatedDay] = useState(getCurrentHebrewDay());

  useEffect(() => {
    setPickups(StorageEngine.getPickups());
    setDrivers(StorageEngine.getDrivers());

    const unsubscribe = subscribeToStore(() => {
      setPickups(StorageEngine.getPickups());
      setDrivers(StorageEngine.getDrivers());
    });
    return unsubscribe;
  }, []);

  // סינון איסופים רק עבור הילד הפעיל
  const kidPickups = pickups.filter((p) => p.childName === activeKid);

  // האיסוף של היום הנוכחי מתוך הרשימה
  const todaysPickup = kidPickups.find((p) => p.day === simulatedDay);
  const driverForToday = todaysPickup ? drivers.find((d) => d.id === todaysPickup.driverId) : null;

  const handleImInTheCar = (pickupId: string) => {
    StorageEngine.togglePickupCompletion(pickupId);
  };

  return (
    <div className="space-y-6 text-right font-mono text-[#141414]" id="kids_view_panel">
      {/* פאנל בחירת ילד/ה חביב */}
      <div className="bg-[#E4E3E0] border-4 border-[#141414] p-6 shadow-[4px_4px_0_0_#141414] relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-4 flex-row-reverse font-mono">
        <div className="relative space-y-2 text-center md:text-right">
          <h2 className="text-2xl font-black flex items-center gap-2 justify-center md:justify-end flex-row-reverse">
            <Smile className="w-8 h-8 text-black animate-bounce" />
            <span>היי חמודים! איפה אתם נמצאים?</span>
          </h2>
          <p className="text-xs text-slate-700 font-bold">
            מצב תצוגת ילדים נוח וברור ללא אפשרות לשנות בלו״ז. בחרו את השם שלכם:
          </p>
        </div>

        {/* לחצני בחירה ענקיים לילדים */}
        <div className="flex gap-2.5 relative select-none z-10">
          {DEFAULT_CHILDREN.map((kid) => {
            const isActive = activeKid === kid;
            return (
              <button
                key={kid}
                onClick={() => setActiveKid(kid)}
                className={`py-3 px-6 border-2 border-[#141414] text-sm font-black transition-all cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#141414] text-white shadow-none"
                    : "bg-white hover:bg-slate-100 text-[#141414]"
                }`}
              >
                <span>{kid}</span>
                <span className="text-sm">👦</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* בקרי הדמיית ימים לטובת המשתמש */}
      <div className="flex justify-between items-center bg-white p-3 border-2 border-[#141414] text-xs flex-row-reverse text-[#141414] font-mono shadow-[2px_2px_0_0_#141414]">
        <span className="font-bold border-r-4 border-[#141414] pr-2">סימולטור ימים לילדים:</span>
        <div className="flex gap-1 overflow-x-auto">
          {DAYS_OF_WEEK.map((day) => (
            <button
              key={day}
              onClick={() => setSimulatedDay(day)}
              className={`px-2.5 py-1 border transition-all cursor-pointer font-bold text-[11px] ${
                simulatedDay === day
                  ? "bg-[#141414] text-white border-[#141414]"
                  : "bg-[#E4E3E0] hover:bg-slate-300 text-slate-800 border-[#141414]"
              }`}
            >
              הצג יום {day}
            </button>
          ))}
        </div>
      </div>

      {/* מדור האיסוף העיקרי של היום */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* כרטיס ראשי: מי אוסף אותי ומתי היום */}
        <div className="lg:col-span-2 bg-white card-border p-6 shadow-flat space-y-6 flex flex-col justify-between" id="kids_today_card">
          <div>
            <div className="flex justify-between items-center mb-4 flex-row-reverse">
              <span className="bg-[#141414] text-white text-xs px-3 py-1 font-bold">
                איסוף מתוכנן להיום (יום {simulatedDay})
              </span>
              <span className="flex items-center gap-1 text-slate-500 text-xs flex-row-reverse font-bold">
                <Calendar className="w-4 h-4" />
                <span>עידכון חי / LIVE LOCK</span>
              </span>
            </div>

            {todaysPickup ? (
              <div className="space-y-6">
                {/* הודעה גדולה ומזמינה */}
                <div className="space-y-2">
                  <h3 className="text-xl md:text-2xl font-black text-[#141414] leading-snug">
                    היי {activeKid}, היום יום {simulatedDay} ויאסוף אותך:
                  </h3>
                  <div className="flex items-center gap-3 mt-4 justify-start flex-row-reverse">
                    <div className="bg-[#E4E3E0] p-3 border-2 border-[#141414] text-[#141414]">
                      <Clock className="w-8 h-8 font-bold animate-pulse" />
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-500 font-bold">بדיוק בשעה שנקבעה:</p>
                      <p className="text-3xl font-black text-[#141414] font-mono tracking-wider">{todaysPickup.time}</p>
                    </div>
                  </div>
                </div>

                {/* פרטי הנהג והרכב בעיניים מותאמות לילדים */}
                <div className="bg-[#E4E3E0] p-5 border-2 border-[#141414] space-y-4">
                  <div className="flex items-center gap-3.5 flex-row-reverse text-right">
                    <div className="bg-[#141414] text-white p-3 border border-black">
                      <Car className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-bold">הנהג/ת המלווה:</p>
                      <p className="text-lg font-black text-black">{driverForToday ? driverForToday.name : "רכב לא ידוע"}</p>
                    </div>
                  </div>

                  {driverForToday?.vehicleInfo && (
                    <div className="pt-2 border-t-2 border-[#141414] text-right">
                      <p className="text-xs text-slate-500 font-bold">סימני זיהוי של הרכב:</p>
                      <p className="text-sm font-bold text-black bg-white border border-[#141414] p-2.5 mt-1 inline-block">
                        🚗 {driverForToday.vehicleInfo}
                      </p>
                    </div>
                  )}

                  {todaysPickup.notes && (
                    <div className="pt-2 border-t-2 border-[#141414]">
                      <p className="text-xs text-red-600 font-bold">הודעה חשובה מההורים / DISPATCH FEED:</p>
                      <p className="text-sm font-semibold text-slate-800 bg-white p-3 border border-[#141414] mt-1">
                        📢 &quot;{todaysPickup.notes}&quot;
                      </p>
                    </div>
                  )}

                  {todaysPickup.status === "urgent" && (
                    <div className="flex items-center gap-2 bg-red-600 text-white p-3 border-2 border-[#141414] text-xs flex-row-reverse mt-2">
                      <ShieldAlert className="w-4 h-4 animate-bounce shrink-0" />
                      <strong>שינוי דחוף של הרגע האחרון! שימו לב לשעה ולמלווה.</strong>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 border-2 border-dashed border-[#141414] bg-[#E4E3E0] flex flex-col items-center justify-center gap-3">
                <p className="text-6xl">🍿</p>
                <p className="text-lg font-black text-[#141414]">יאיי! אין איסוף רשום עבורך היום.</p>
                <p className="text-xs">ההורים כנראה אוספים אתכם בעצמם או שאין חוג היום.</p>
              </div>
            )}
          </div>

          {/* מקש דיווח מהיר: אני ברכב (completed) */}
          {todaysPickup && (
            <div className="mt-6 pt-4 border-t-2 border-[#141414] flex flex-col sm:flex-row gap-4 justify-between items-center flex-row-reverse">
              <div className="text-right">
                <p className="text-xs text-slate-500 font-bold">גע/י כאן ברגע שאת/ה נכנס/ת למכונית:</p>
              </div>
              <button
                onClick={() => handleImInTheCar(todaysPickup.id)}
                className={`w-full sm:w-auto px-8 py-4 border-2 border-[#141414] font-black text-base cursor-pointer transform hover:-translate-y-0.5 active:translate-y-0 flex items-center justify-center gap-2 flex-row-reverse transition-all ${
                  todaysPickup.completed
                    ? "bg-[#D1D0CC] text-[#141414]"
                    : "bg-emerald-600 hover:bg-[#141414] text-white shadow-[3px_3px_0_0_#141414] hover:shadow-none"
                }`}
                id="btn_kids_confirm_pickup"
              >
                {todaysPickup.completed ? (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    <span>דיווחת בהצלחה: אני ברכב!</span>
                  </>
                ) : (
                  <>
                    <span>נכנסתי לרכב! 🚗 JOIN CAR</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* לוח השבוע של הילד שנבחר */}
        <div className="bg-[#E4E3E0] p-6 border-4 border-[#141414] shadow-[4px_4px_0_0_#141414] text-right font-mono" id="kids_weekly_timeline">
          <h3 className="text-base font-extrabold text-[#141414] mb-4 flex items-center gap-1.5 flex-row-reverse border-b-2 border-[#141414] pb-2 uppercase italic">
            <Compass className="w-5 h-5" />
            <span>כל איסוּפי השבוע / WEEKLY TIMELINE</span>
          </h3>

          <div className="space-y-3.5 max-h-[400px] overflow-y-auto pr-1">
            {DAYS_OF_WEEK.map((day) => {
              const dayPickup = kidPickups.find((p) => p.day === day);
              const dayDriver = dayPickup ? drivers.find((d) => d.id === dayPickup.driverId) : null;

              return (
                <div
                  key={day}
                  className={`p-3 border-2 flex flex-col gap-1 transition-colors ${
                    simulatedDay === day
                      ? "bg-white border-[#141414] shadow-[2px_2px_0_0_#141414]"
                      : dayPickup?.completed
                      ? "bg-[#D1D0CC] border-slate-400 text-slate-600 line-through"
                      : "bg-[#F3F2EE] border-[#141414]"
                  }`}
                >
                  <div className="flex justify-between items-center flex-row-reverse">
                    <span className="font-bold text-[#141414] text-xs">יום {day}</span>
                    {dayPickup ? (
                      <span className="text-xs font-mono font-black text-[#141414] bg-[#E4E3E0] border border-[#141414] px-1.5 py-0.5">
                        {dayPickup.time}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 italic">אין הסעה</span>
                    )}
                  </div>

                  {dayPickup && (
                    <div className="text-xs mt-1 space-y-0.5 text-slate-700 leading-relaxed">
                      <p className="flex items-center gap-1 justify-end flex-row-reverse font-bold">
                        <User className="w-3.5 h-3.5" />
                        <span>מלווה: {dayDriver ? dayDriver.name : "רכב לא ידוע"}</span>
                      </p>
                      {dayPickup.notes && (
                        <p className="text-[11px] text-slate-600 truncate text-right">
                          &quot;{dayPickup.notes}&quot;
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
