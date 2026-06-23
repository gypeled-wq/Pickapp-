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
  const [userRole, setUserRole] = useState<"parent" | "driver" | "child">(() => {
    const params = new URLSearchParams(window.location.search);
    const roleParam = params.get("role");
    if (roleParam === "parent" || roleParam === "driver" || roleParam === "child") {
      return roleParam as "parent" | "driver" | "child";
    }
    return "driver";
  });
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [activeDriverId, setActiveDriverId] = useState<string | null>(() => {
    return localStorage.getItem("kid_sync_active_driver_id") || "drv_shosh";
  });

  // מודאל אימות קוד הורים לשחרור נעילת הילדים
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [pinError, setPinError] = useState("");
  const [pendingTargetRole, setPendingTargetRole] = useState<"parent" | "driver" | "child" | null>(null);

  // PWA & התקנה למסך הבית
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallGuideOpen, setIsInstallGuideOpen] = useState(false);

  const [stats, setStats] = useState({
    totalPickups: 0,
    urgentPickups: 0,
    completedToday: 0,
  });
  const [masterCount, setMasterCount] = useState(0);

  // החלפת ה-URL עם שינוי תפקיד כדי לשמור את המצב המדויק בהוספה למסך הבית
  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("role", userRole);
    window.history.replaceState({}, "", url.toString());
  }, [userRole]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleAddToHomeScreen = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
      }
    } else {
      setIsInstallGuideOpen(true);
    }
  };

  useEffect(() => {
    const updateStatsAndDrivers = () => {
      const allPickups = StorageEngine.getPickups();
      const allDrivers = StorageEngine.getDrivers();
      const allMaster = StorageEngine.getMasterPickups();
      setDrivers(allDrivers);
      setMasterCount(allMaster.length);

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
    // בקרת גישה קפדנית: כל מעבר מתפקיד אחד לאחר (הורה, נהג, ילד) דורש הזנת קוד בקרה מטעמי בטיחות ופרטיות
    if (targetRole !== userRole) {
      setPendingTargetRole(targetRole);
      setPinInput("");
      setPinError("");
      setIsPinModalOpen(true);
    } else {
      setUserRole(targetRole);
    }
  };

  // אישור קוד הורים בנעילת בטיחות ילדים ובקרת גישה
  const handleVerifyPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput === "1234") {
      if (pendingTargetRole) {
        setUserRole(pendingTargetRole);
        StorageEngine.addLog(
          "בקרת הורים",
          `בוצע מעבר מאושר לממשק ${pendingTargetRole === "parent" ? "מנהל/הורים" : pendingTargetRole === "driver" ? "נהגים" : "ילדים"}.`,
          "parent"
        );
      }
      setIsPinModalOpen(false);
      setPinInput("");
      setPinError("");
    } else {
      setPinError("קוד שגוי! אנא נסו שוב");
    }
  };

  return (
    <div className="min-h-screen bg-[#E4E3E0] text-[#141414] flex flex-col font-sans antialiased border-[8px] border-[#141414] pb-12" id="family_shuttle_root_app">
      {/* סרגל ניווט עליון מרכזי */}
      <header className="sticky top-0 z-30 bg-[#E4E3E0] border-b-4 border-[#141414] px-4 py-3.5 sm:px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center flex-row-reverse">
          {/* לוגו המערכת */}
          <div className="flex items-center gap-2.5 flex-row-reverse text-right">
            <div className="hidden sm:block bg-[#141414] text-[#E4E3E0] p-2.5 border-2 border-[#141414] tech-shadow-sm">
              <CalendarCheck className="w-5.5 h-5.5 font-bold" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight text-[#141414] flex items-center gap-1.5 flex-row-reverse font-serif uppercase italic">
                <span className="hidden sm:inline">KIDRIDE / סהרון</span>
                <span className="hidden sm:inline-block text-[10px] bg-[#141414] text-[#E4E3E0] px-2 py-0.5 font-mono font-bold">
                  {userRole === "parent" ? "● מנהל/הורים" : userRole === "driver" ? "● ממשק נהג" : "● תצוגת ילדים"}
                </span>
                <span className={`hidden sm:inline-block text-[9px] px-1.5 py-0.5 font-mono font-black border uppercase tracking-wider ${
                  (import.meta as any).env?.PROD
                    ? "bg-emerald-600 text-white border-emerald-950"
                    : "bg-amber-100 text-amber-950 border-amber-500 animate-pulse"
                }`}>
                  {(import.meta as any).env?.PROD ? "PROD (PRODUCTION)" : "DEV (PLAYGROUND)"}
                </span>
              </h1>
              <p className="hidden sm:block text-[10px] text-slate-700 font-mono tracking-wider uppercase">מערך הסעות משפחתי מעודכן בזמן אמת</p>
            </div>
          </div>

          {/* לוח מתגי בקרה ובורר תפקידים מוגן */}
          <div className="flex items-center gap-4 flex-row-reverse">
            {/* מרכז ההתראות החי - מציג להורים בלבד, מתחבא לנהגים וילדים */}
            {userRole === "parent" && <NotificationCenter userRole={userRole} activeDriverId={activeDriverId} />}

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
              <div className="bg-white border-4 border-[#141414] tech-shadow p-2 px-2 pb-4 pt-3 xs:p-4 sm:p-6">
                <WeeklySchedule userRole="parent" activeDriverId={activeDriverId} />
              </div>

              {/* מקטע 2: פיצול לשני עמודות (ספרייה ויומונים) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* ספריית נהגים */}
                <DriverLibrary />

                {/* יומן פעילות */}
                <HistoryLog />
              </div>

              {/* מקטע 3: קונסולת ניהול לוח בסיס קבוע ומחזורים בתחתית לשונית הורים */}
              <div className="bg-[#FFFDF6] border-4 border-[#141414] shadow-[4px_4px_0_0_#141414] p-5 md:p-6 text-right font-mono" style={{ direction: "rtl" }}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 flex-row-reverse text-right">
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-amber-950 flex items-center gap-1.5 flex-row-reverse justify-end">
                      <CalendarCheck className="w-5 h-5 text-amber-900 shrink-0" />
                      <span>📋 ניהול שבלונת בסיס קבועה / MASTER SCHEDULE BASELINE</span>
                    </h4>
                    <p className="text-xs text-slate-700 leading-relaxed font-sans font-bold">
                      כאן תוכלו לשמור את מערך ההסעות הפעיל שלכם (כרגע ישנן <strong className="text-[#141414] underline text-[13px]">{stats.totalPickups} נסיעות פעילות</strong>) כ&quot;לוח הבסיס הקבוע&quot; של הבית. 
                      בהתחלת השבוע הבא, לחיצה על <strong className="text-indigo-950">שחזר והתחל שבוע חדש 🔄</strong> תשחזר תמיד את ההסעות ונהגיהן בדיוק לפי המערך הזה!
                    </p>
                    <div className="text-[10px] text-slate-500 font-bold font-mono pt-1">
                      שבלונה פעילה כעת: <strong className="text-amber-800">{masterCount} נסיעות קבועות משוריינות</strong> בלוח הבסיס המאובטח.
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2 shrink-0 md:justify-end w-full md:w-auto">
                    <button
                      onClick={() => {
                        const activePickups = StorageEngine.getPickups();
                        if (activePickups.length === 0) {
                          alert("❌ לא ניתן לשמור לוח בסיס ריק! אנא הוסיפו מעט נסיעות קבועות בלוח תחילה.");
                          return;
                        }
                        if (confirm(`האם להגדיר את ${activePickups.length} הנסיעות המופיעות כרגע על המסך כסידור הבית הקבוע (לוח בסיס) לשחזור?`)) {
                          StorageEngine.saveMasterPickups(activePickups);
                          StorageEngine.addLog(
                            "שמירת לוח בסיס קבוע",
                            `ההורים שמרו סידור בית קבוע מעודכן המכיל ${activePickups.length} נסיעות קבועות לשחזור.`,
                            "parent"
                          );
                          StorageEngine.addAlert(
                            "לוח הבסיס הקבוע עודכן!",
                            `הסידור עם ${activePickups.length} נסיעות הוגדר וסונכרן בהצלחה לענן!`,
                            "success"
                          );
                          alert("📋 סיימנו! לוח הבסיס השבועי נשמר וסונכרן בהצלחה. כל שחזור שבוע הבא ישוב לנקודה זו! ✨");
                        }
                      }}
                      className="px-4 py-2.5 bg-[#F59E0B] hover:bg-[#D97706] text-white border-2 border-[#141414] shadow-[2px_2px_0_0_#141414] hover:shadow-none active:translate-y-0.5 transition-all flex items-center justify-center gap-1.5 flex-row-reverse cursor-pointer font-sans text-xs font-black"
                    >
                      <span>💾 שמור לוח פעיל כלוח בסיס קבוע</span>
                    </button>

                    <button
                      onClick={() => {
                        if (confirm("האם ברצונכם לאפס את לוח הבסיס הקבוע להגדרות המפעל הראשוניות של האפליקציה?")) {
                          StorageEngine.resetMasterPickupsToDefault();
                          StorageEngine.addLog(
                            "איפוס לוח בסיס",
                            "לוח הבסיס הקבוע של המערכת אופס להגדרות ברירת המחדל הראשוניות.",
                            "parent"
                          );
                          StorageEngine.addAlert(
                            "לוח הבסיס אופס לברירת המחדל",
                            "לוח הבסיס השבועי הקבוע אופס להגדרות ברירת המחדל הראשוניות בהצלחה.",
                            "success"
                          );
                          alert("🔄 לוח הבסיס הקבוע אופס בהצלחה להסעות הראשוניות של המערכת! ✨");
                        }
                      }}
                      className="px-3 py-2 bg-[#E4E3E0] hover:bg-[#D1D0CC] text-slate-800 border-2 border-[#141414] text-xs font-bold transition-all cursor-pointer"
                    >
                      <span>🔄 שחזר הגדרות יצרן של הלוח</span>
                    </button>
                  </div>
                </div>
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
                    <span className="hidden sm:inline">ממשק נהג מלווה / נסיעות השבוע שלי</span>
                  </h4>
                  <p className="hidden sm:block text-xs text-emerald-900 font-bold leading-normal">
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
              <div className="bg-white border-4 border-[#141414] tech-shadow p-2 px-2 pb-4 pt-3 xs:p-4 sm:p-6">
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

      {/* מודאל מדריך הוספה למסך הבית */}
      <AnimatePresence>
        {isInstallGuideOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 font-mono" style={{ direction: "rtl" }}>
            <div className="absolute inset-0 bg-transparent" onClick={() => setIsInstallGuideOpen(false)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-[#141414] shadow-[8px_8px_0_0_#141414] max-w-sm w-full p-6 relative z-10 text-right space-y-4 text-[#141414]"
            >
              <div className="flex items-center gap-2 justify-end flex-row-reverse border-b-2 border-slate-250 pb-2">
                <Sparkles className="w-5 h-5 text-amber-500 shrink-0" />
                <h3 className="text-base font-black text-slate-900">
                  הוספת האפליקציה למסך הבית 📱
                </h3>
              </div>

              <div className="text-xs space-y-3 leading-relaxed font-bold text-slate-800">
                <p>האפליקציה תיפתח בדיוק בתצוגה הנוכחית שלכם (<strong>{userRole === "child" ? "תצוגת ילדים 👦" : userRole === "driver" ? "תצוגת נהגים 🚗" : "תצוגת הורים 🔐"}</strong>):</p>
                
                <div className="bg-slate-50 p-3 border border-[#141414] space-y-1.5 font-sans">
                  <p className="font-extrabold text-[#141414]">במכשירי Apple (Safari / iOS):</p>
                  <p>1. לחצו על כפתור <strong>שיתוף (Share)</strong> <span className="text-sm">⎋</span> בתחתית הדפדפן.</p>
                  <p>2. גללו למטה ובחרו <strong>הוסף למסך הבית (Add to Home Screen)</strong> <span className="text-sm">⊞</span>.</p>
                </div>

                <div className="bg-slate-50 p-3 border border-[#141414] space-y-1.5 font-sans">
                  <p className="font-extrabold text-[#141414]">במכשירי Android / Chrome:</p>
                  <p>1. לחצו על <strong>3 הנקודות</strong> בפינת הדפדפן.</p>
                  <p>2. בחרו באפשרות <strong>התקנה (Install app)</strong> או <strong>הוספה למסך הבית</strong>.</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsInstallGuideOpen(false)}
                className="w-full text-center py-2 bg-[#141414] text-white border-2 border-[#141414] font-black text-xs hover:bg-white hover:text-black transition-all cursor-pointer"
              >
                הבנתי, תודה! 👍
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* כותרת תחתונה מעוצבת ונקיה */}
      <footer className="mt-auto border-t-2 border-[#141414] bg-[#141414] text-[#E4E3E0] py-8 text-center font-mono">
        <div className="max-w-7xl mx-auto px-4 text-xs space-y-4">
          <div className="flex flex-col items-center justify-center gap-3">
            <button
              onClick={handleAddToHomeScreen}
              className="px-5 py-2.5 bg-amber-400 hover:bg-amber-350 text-black border-2 border-[#E4E3E0] hover:border-black font-black text-xs transition-all shadow-[2px_2px_0_0_#FFF] hover:shadow-none active:translate-y-0.5 cursor-pointer flex items-center gap-2 flex-row-reverse"
              id="btn_add_to_home_screen"
            >
              <span>📱 שמירה והוספה למסך הבית</span>
              <span className="text-[10px] bg-black text-white px-1.5 py-0.5 rounded uppercase">PWA</span>
            </button>
            <p className="text-[10px] text-slate-400 max-w-sm leading-normal">
              טיפ: השמירה תשמור את הקישור הישיר לתצוגת <strong>{userRole === "child" ? "ילדים 👦" : userRole === "driver" ? "נהגים 🚗" : "הורים 🔐"}</strong>, כדי שהאפליקציה תיפתח בדיוק בטאב הנוכחי שלכם!
            </p>
          </div>

          <div className="border-t border-slate-800 pt-4 flex flex-col items-center gap-1">
            <div className="flex justify-center items-center gap-1.5 flex-row-reverse">
              <span>המערכת מסונכרנת מקומית ובזמן אמת עבור מכשירים שונים</span>
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"></div>
            </div>
            <p className="text-[10px] text-[#E4E3E0] opacity-80">
              SYSTEM: ACTIVE | DATA_SYNC: REAL_TIME | ENCRYPTION: AES-256 | © 2026 סהרון - KIDRIDE
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
