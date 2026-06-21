/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import WeeklySchedule from "./components/WeeklySchedule";
import DriverLibrary from "./components/DriverLibrary";
import KidsView from "./components/KidsView";
import HistoryLog from "./components/HistoryLog";
import NotificationCenter from "./components/NotificationCenter";
import { StorageEngine, subscribeToStore } from "./data";
import { Users, Shield, CalendarCheck, Clock, Sparkles, Car, Lock, Key, AlertTriangle, HelpCircle } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Driver } from "./types";

export default function App() {
  const [userRole, setUserRole] = useState<"parent" | "driver" | "child">("parent");
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(() => {
    return localStorage.getItem("kid_sync_active_driver_id") || "drv_shosh";
  });

  // מודאל אימות קוד הורים לשחרור נעילת הילדים
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pendingTargetRole, setPendingTargetRole] = useState<"parent" | "driver" | "child" | null>(null);

  const [stats, setStats] = useState({
    totalPickups: 0,
    urgentPickups: 0,
    completedToday: 0,
  });

  useEffect(() => {
    const updateStatsAndDrivers = () => {
      const allPickups = StorageEngine.getPickups();
      const allDrivers = StorageEngine.getDrivers();
      setDrivers(allDrivers);

      const urgent = allPickups.filter((p) => p.status === "urgent" && !p.completed).length;
      const completed = allPickups.filter((p) => p.completed).length;

      setStats({
        totalPickups: allPickups.length,
        urgentPickups: urgent,
        completedToday: completed,
      });
    };

    updateStatsAndDrivers();
    return subscribeToStore(updateStatsAndDrivers);
  }, []);

  // שמירת הנהג הפעיל בדפדפן
  useEffect(() => {
    if (activeDriverId) {
      localStorage.setItem("kid_sync_active_driver_id", activeDriverId);
    } else {
      localStorage.removeItem("kid_sync_active_driver_id");
    }
  }, [activeDriverId]);

  // פונקציית מעבר בורר תפקידים חכמה
  const handleRoleChange = (targetRole: "parent" | "driver" | "child") => {
    if (userRole === "child" && targetRole !== "child") {
      // ניסיון לביטול או מעבר ממצב ילדים דורש סיסמת הורים (PIN)
      setPendingTargetRole(targetRole);
      setPinInput("");
      setPinError("");
      setIsPinModalOpen(true);
    } else {
      setUserRole(targetRole);
    }
  };

  // אישור קוד הורים בנעילת בטיחות ילדים
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "1234") {
      if (pendingTargetRole) {
        setUserRole(pendingTargetRole);
        StorageEngine.addLog(
          "בקרת הורים",
          `בוצע מעבר מאושר ממצב ילדים לממשק ${pendingTargetRole === "parent" ? "מנהל/הורים" : "נהגים"}.`,
          "parent"
        );
      }
      setIsPinModalOpen(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError("קוד שגוי! אנא נסו שוב (ברירת מחדל: 1234)");
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans antialiased border-[8px] border-[#141414] pb-12" id="family_shuttle_root_app">
      {/* סרגל ניווט עליון מרכזי */}
      <header className="sticky top-0 z-30 bg-[#E4E3E0] border-b-4 border-[#141414] px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-row-reverse">
          {/* לוגו המערכת */}
          <div className="flex items-center gap-2.5 flex-row-reverse text-right">
            <div className="bg-[#141414] text-[#E4E3E0] p-2.5 border-2 border-[#141414] tech-shadow-sm">
              <CalendarCheck className="w-5.5 h-5.5 font-bold" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[#141414] flex items-center gap-1.5 flex-row-reverse font-serif uppercase italic">
                <span>KIDRIDE / סהרון</span>
                <span className="text-[10px] bg-[#141414] text-[#E4E3E0] px-2 py-0.5 font-mono font-bold">
                  {userRole === "parent" ? "● מנהל/הורים" : userRole === "driver" ? "● ממשק נהג" : "● תצוגת ילדים"}
                </span>
              </h1>
              <p className="text-[10px] text-slate-700 font-mono tracking-wider uppercase">מערך הסעות משפחתי מעודכן בזמן אמת</p>
            </div>
          </div>

          {/* לוח מתגי בקרה ובורר תפקידים מוגן */}
          <div className="flex items-center gap-4 flex-row-reverse">
            {/* מרכז ההתראות החי - מציג להורים או לנהג מלווה בלבד בהתאמה, מתחבא לילדים */}
            <NotificationCenter userRole={userRole} activeDriverId={activeDriverId} />

            {/* בורר תפקידים (הרשאות וממשק) */}
            {userRole === "child" ? (
              /* במצב ילדים: הסלקטור נעול לחיצות ומציג חיווי בטחון */
              <div className="flex items-center gap-2 flex-row-reverse select-none">
                <span className="text-[10px] sm:text-xs bg-red-150 border-2 border-red-900 text-red-950 px-3 py-1 font-black flex items-center gap-1.5 flex-row-reverse shadow-[2px_2px_0_0_#7f1d1d]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>נעילת ילדים פעילה</span>
                </span>
                <button
                  onClick={() => handleRoleChange("parent")}
                  className="px-3 py-1 text-xs font-black border-2 border-[#141414] bg-white text-black hover:bg-[#141414] hover:text-white transition-all cursor-pointer flex items-center gap-1 flex-row-reverse"
                >
                  <Key className="w-3.5 h-3.5" />
                  <span>מעבר הורים/נהג 🔑</span>
                </button>
              </div>
            ) : (
              /* במצב מנהל או נהגים: סלקטור פשוט ונוח */
              <div className="bg-[#D1D0CC] p-1 border-2 border-[#141414] flex items-center flex-row-reverse select-none">
                <button
                  onClick={() => handleRoleChange("parent")}
                  className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-row-reverse ${
                    userRole === "parent"
                      ? "bg-[#141414] text-[#E4E3E0]"
                      : "text-[#141414] hover:bg-[#c0bfba]"
                  }`}
                  id="tab_select_parent_view"
                >
                  <Shield className="w-3.5 h-3.5" />
                  <span>הורים (אדמין)</span>
                </button>
                <button
                  onClick={() => handleRoleChange("driver")}
                  className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-row-reverse ${
                    userRole === "driver"
                      ? "bg-[#141414] text-[#E4E3E0]"
                      : "text-[#141414] hover:bg-[#c0bfba]"
                  }`}
                  id="tab_select_driver_view"
                >
                  <Car className="w-3.5 h-3.5" />
                  <span>נהגים</span>
                </button>
                <button
                  onClick={() => handleRoleChange("child")}
                  className={`px-3 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-row-reverse ${
                    userRole === "child"
                      ? "bg-[#141414] text-[#E4E3E0]"
                      : "text-[#141414] hover:bg-[#c0bfba]"
                  }`}
                  id="tab_select_child_view"
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>ילדים (View-Only)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* אזור הסטטיסטיקות והנתונים המהירים */}
      <div className="bg-[#D1D0CC] border-b-2 border-[#141414] py-3 px-4 hidden sm:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center text-xs text-[#141414] flex-row-reverse">
          <div className="flex gap-4 flex-row-reverse items-center">
            <span className="flex items-center gap-1 flex-row-reverse font-mono font-bold">
              <Clock className="w-3.5 h-3.5" />
              <span>SYSTEM: ACTIVE</span>
            </span>
            <span className="text-[#141414] opacity-40">|</span>
            <span className="flex items-center gap-1 flex-row-reverse font-mono">
              <Sparkles className="w-3.5 h-3.5" />
              <span>DATA_SYNC: REAL_TIME</span>
            </span>
          </div>

          <div className="flex gap-6 flex-row-reverse items-center font-bold text-[#141414]">
            <span className="border border-[#141414] bg-white px-2 py-0.5">סה״כ הסעות: <strong className="font-black text-black">{stats.totalPickups}</strong></span>
            <span className="border border-[#141414] bg-red-100 px-2 py-0.5">שינויים דחופים: <strong className="font-black text-red-700">{stats.urgentPickups}</strong></span>
            <span className="border border-[#141414] bg-[#e6fee6] px-2 py-0.5">בוצעו: <strong className="font-black text-emerald-800">{stats.completedToday}</strong></span>
          </div>
        </div>
      </div>

      {/* האזור המרכזי של הדף */}
      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 py-8 flex-1">
        <AnimatePresence mode="wait">
          {userRole === "parent" && (
            /* ממשק הורים: לוח שבועי מלא + ספריית נהגים ותיעודים */
            <motion.div
              key="parent_layout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-8"
              id="parent_panel_root"
            >
              {/* מקטע 1: תוכנית איסופים שבועית בגריד */}
              <div className="bg-white border-4 border-[#141414] tech-shadow p-6">
                <WeeklySchedule userRole="parent" activeDriverId={activeDriverId} />
              </div>

              {/* מקטע 2: פיצול לשני עמודות (ספרייה ויומונים) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ספריית נהגים */}
                <DriverLibrary />

                {/* יומן פעילות */}
                <HistoryLog />
              </div>
            </motion.div>
          )}

          {userRole === "driver" && (
            /* ממשק נהגים: סינון לפי נהג נבחר ומניעת עריכה של נהגים אחרים */
            <motion.div
              key="driver_layout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="space-y-6"
              id="driver_panel_root"
            >
              {/* כרטיס זהות נהג פעיל */}
              <div className="p-5 bg-emerald-50 border-4 border-emerald-950 shadow-[4px_4px_0_0_#064e3b] text-right space-y-4 rounded-xl flex flex-col md:flex-row justify-between items-center gap-4 flex-row-reverse">
                <div className="space-y-1">
                  <h4 className="text-base font-black text-emerald-950 flex items-center gap-2 justify-end flex-row-reverse">
                    <Car className="w-5 h-5 text-emerald-700 animate-pulse" />
                    <span>ממשק נהג מלווה / נסיעות השבוע שלי</span>
                  </h4>
                  <p className="text-xs text-emerald-900 font-bold leading-normal">
                    שלום! אנא בחרו את שמכם כדי לראות את הנסיעות המשויכות אליכם השבוע, לעדכן סטטוס &quot;נאסף&quot;, ולצפות בהתראות המיועדות לכם בלבד.
                  </p>
                </div>
                <div className="flex items-center gap-2.5 flex-row-reverse w-full md:w-auto">
                  <label className="text-xs font-black text-emerald-950 whitespace-nowrap">נהג פעיל:</label>
                  <select
                    value={activeDriverId || ""}
                    onChange={(e) => setActiveDriverId(e.target.value || null)}
                    className="bg-white border-2 border-emerald-950 p-2 text-xs font-black focus:outline-none flex-1 md:w-52 text-right font-mono"
                  >
                    <option value="">-- בחר נהג להזדהות --</option>
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.type === "permanent" ? "קבוע" : "אורח"})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* לוח הסעות שבועי מותאם לנהגים */}
              <div className="bg-white border-4 border-[#141414] tech-shadow p-6">
                <WeeklySchedule userRole="driver" activeDriverId={activeDriverId} />
              </div>
            </motion.div>
          )}

          {userRole === "child" && (
            /* ממשק ילדים: חסום לשינויים, תמציתי וידידותי בגובה המורשת */
            <motion.div
              key="child_layout"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              id="child_panel_root"
            >
              <KidsView />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* מודאל נעילת ילדים קוד הורים */}
      <AnimatePresence>
        {isPinModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono">
            {/* רקע לסגירה בהקלקלה */}
            <div className="absolute inset-0 bg-transparent" onClick={() => setIsPinModalOpen(false)} />

            {/* כרטיס מודאל בעיצוב מודגש ניאו-ברוטלי */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white border-4 border-[#141414] shadow-[8px_8px_0_0_#141414] max-w-sm w-full p-6 relative z-10 text-right space-y-4"
            >
              <div className="flex items-center gap-2 justify-end flex-row-reverse border-b-2 border-slate-250 pb-2">
                <Lock className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="text-base font-black text-slate-900">
                  נעילת בקרת הורים / PARENTAL LOCK
                </h3>
              </div>

              <p className="text-xs text-slate-700 leading-normal font-bold">
                פעולה זו דורשת קוד הורים על מנת למנוע מהילדים גישה לתמונת המכשירים המלאה ולשינויי לו״ז:
              </p>

              <form onSubmit={handleVerifyPin} className="space-y-4">
                <div>
                  <label className="block text-[11px] text-slate-500 font-bold mb-1.5">הזינו 4 ספרות קוד דיגיטלי:</label>
                  <input
                    type="password"
                    maxLength={4}
                    placeholder="••••"
                    value={pinInput}
                    onChange={(e) => {
                      setPinInput(e.target.value.replace(/[^0-9]/g, ""));
                      setPinError("");
                    }}
                    autoFocus
                    className="w-full text-center tracking-[1.5em] text-2xl font-black py-2.5 border-2 border-[#141414] focus:outline-none bg-slate-50 placeholder-slate-300 font-mono"
                  />
                  {pinError && (
                    <p className="text-[11px] text-red-600 font-bold mt-1.5 bg-red-50 border-r-4 border-red-500 p-1.5">
                      ⚠️ {pinError}
                    </p>
                  )}
                  <p className="text-[10px] text-slate-500 italic mt-1.5">
                    * קוד ברירת המחדל הבטוח של סהרון הוא: <strong>1234</strong>
                  </p>
                </div>

                <div className="flex gap-2 justify-start pt-2 flex-row-reverse">
                  <button
                    type="submit"
                    className="px-5 py-2.5 bg-[#141414] text-white border-2 border-[#141414] font-black text-xs hover:bg-white hover:text-black transition-all cursor-pointer shadow-[3px_3px_0_0_#141414] hover:shadow-none"
                  >
                    אשר קוד
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsPinModalOpen(false);
                      setPinInput("");
                      setPinError("");
                    }}
                    className="px-5 py-2.5 bg-slate-100 text-slate-700 border-2 border-[#141414] font-black text-xs hover:bg-[#141414] hover:text-white transition-all cursor-pointer"
                  >
                    ביטול
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* כותרת תחתונה מעוצבת ונקיה */}
      <footer className="mt-auto border-t-2 border-[#141414] bg-[#141414] text-[#E4E3E0] py-6 text-center font-mono">
        <div className="max-w-7xl mx-auto px-4 text-xs space-y-1.5">
          <div className="flex justify-center items-center gap-1.5 flex-row-reverse">
            <span>המערכת מסונכרנת מקומית ובזמן אמת עבור מכשירים שונים</span>
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
          </div>
          <p className="text-[10px] text-[#E4E3E0] opacity-80">
            SYSTEM: ACTIVE | DATA_SYNC: REAL_TIME | ENCRYPTION: AES-256 | © 2026 סהרון - KIDRIDE
          </p>
        </div>
      </footer>
    </div>
  );
}
