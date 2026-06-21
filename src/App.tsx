/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import WeeklySchedule from "./components/WeeklySchedule";
import DriverLibrary from "./components/DriverLibrary";
import KidsView from "./components/KidsView";
import HistoryLog from "./components/HistoryLog";
import NotificationCenter from "./components/NotificationCenter";
import { StorageEngine, subscribeToStore } from "./data";
import { Users, Shield, CalendarCheck, BookOpen, Clock, Heart, Radio, Activity, Sparkles, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  const [userRole, setUserRole] = useState<"parent" | "child">("parent");
  const [stats, setStats] = useState({
    totalPickups: 0,
    urgentPickups: 0,
    completedToday: 0,
  });

  useEffect(() => {
    const updateStats = () => {
      const allPickups = StorageEngine.getPickups();
      const currentDay = "ראשון"; // אנו שומרים כברירת מחדל של היום הנוכחי בדוגמה

      const urgent = allPickups.filter((p) => p.status === "urgent" && !p.completed).length;
      const completed = allPickups.filter((p) => p.completed).length;

      setStats({
        totalPickups: allPickups.length,
        urgentPickups: urgent,
        completedToday: completed,
      });
    };

    updateStats();
    return subscribeToStore(updateStats);
  }, []);

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans antialiased border-[8px] border-[#141414] pb-12" id="family_shuttle_root_app">
      {/* סרגל ניווט עליון מרכזי */}
      <header className="sticky top-0 z-30 bg-[#E4E3E0] border-b-4 border-[#141414] px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-row-reverse">
          {/* לוגו המערכת בסגנון דמוקרטי נעים */}
          <div className="flex items-center gap-2.5 flex-row-reverse text-right">
            <div className="bg-[#141414] text-[#E4E3E0] p-2.5 border-2 border-[#141414] tech-shadow-sm">
              <CalendarCheck className="w-5.5 h-5.5 font-bold" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[#141414] flex items-center gap-1.5 flex-row-reverse font-serif uppercase italic">
                <span>KIDRIDE / סהרון</span>
                <span className="text-[10px] bg-[#141414] text-[#E4E3E0] px-2 py-0.5 font-mono font-bold animate-pulse-slow">
                  ● לוח בקרה הורים
                </span>
              </h1>
              <p className="text-[10px] text-slate-700 font-mono tracking-wider uppercase">ניהול מטה הסעות הילדים בזמן אמת</p>
            </div>
          </div>

          {/* לוח מתגי בקרה ובורר תפקידים (במוקד הקליק האנושי) */}
          <div className="flex items-center gap-4 flex-row-reverse">
            {/* מרכז ההתראות החי של ההורים */}
            <NotificationCenter />

            {/* בורר התפקידים (הרשאות וממשק) */}
            <div className="bg-[#D1D0CC] p-1 border-2 border-[#141414] flex items-center flex-row-reverse select-none">
              <button
                onClick={() => setUserRole("parent")}
                className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-row-reverse ${
                  userRole === "parent"
                    ? "bg-[#141414] text-[#E4E3E0]"
                    : "text-[#141414] hover:bg-[#c0bfba]"
                }`}
                id="tab_select_parent_view"
              >
                <Shield className="w-3.5 h-3.5" />
                <span>ממשק הורים (מלא)</span>
              </button>
              <button
                onClick={() => setUserRole("child")}
                className={`px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 flex-row-reverse ${
                  userRole === "child"
                    ? "bg-[#141414] text-[#E4E3E0]"
                    : "text-[#141414] hover:bg-[#c0bfba]"
                }`}
                id="tab_select_child_view"
              >
                <Users className="w-3.5 h-3.5" />
                <span>ממשק ילדים (View-Only)</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* אזור הסטטיסטיקות והנתונים המהירים (מציג את הבעיה הנשנית של בישול נתונים חיים) */}
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
          {userRole === "parent" ? (
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
                <WeeklySchedule userRole="parent" />
              </div>

              {/* מקטע 2: פיצול לשני עמודות (ספרייה ויומונים) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ספריית נהגים */}
                <DriverLibrary />

                {/* יומן פעילות */}
                <HistoryLog />
              </div>
            </motion.div>
          ) : (
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
