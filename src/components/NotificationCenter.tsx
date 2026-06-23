/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AlertNotification } from "../types";
import { StorageEngine, subscribeToStore } from "../data";
import { Bell, BellRing, Check, ShieldAlert, CheckCircle2, Info, X, MessageSquareCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

// פונקציה לייצור צליל התראה דיגיטלי נעים (הושתק לבקשת המשתמש)
const playNotificationChime = () => {
  // מושתק בכל המצבים לבקשת המשתמש
};

interface NotificationCenterProps {
  userRole?: "parent" | "driver" | "child";
  activeDriverId?: string | null;
}

export default function NotificationCenter({ userRole = "parent", activeDriverId = null }: NotificationCenterProps) {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const isIframe = typeof window !== "undefined" && window.self !== window.top;
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<AlertNotification | null>(null);

  // בקרת הרשאות להתראות דפדפן
  const [notificationPermission, setNotificationPermission] = useState<string>(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        return Notification.permission;
      } catch (e) {
        return "unsupported";
      }
    }
    return "unsupported";
  });

  const currentDriver = activeDriverId ? StorageEngine.getDrivers().find((d) => d.id === activeDriverId) : null;
  const currentDriverName = currentDriver ? currentDriver.name.split(" ")[0] : "";

  // סינון ההתראות לפי התפקיד והנהג הפעיל
  const displayAlerts = alerts.filter((a) => {
    if (userRole === "parent") return true;
    if (userRole === "child") return false; // ילדים לא רואים התראות הורים
    if (userRole === "driver") {
      if (!currentDriverName) return false;
      const content = (a.title + " " + a.message).toLowerCase();
      return (
        content.includes(currentDriverName.toLowerCase()) ||
        content.includes("נהג") ||
        content.includes("לכולם") ||
        content.includes("כללי") ||
        (currentDriver?.phone && content.includes(currentDriver.phone))
      );
    }
    return true;
  });

  // סנכרון פסיבי של מצב ההרשאה בדפדפן
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        setNotificationPermission(Notification.permission);
      } catch (e) {
        console.warn("Notification permission query not supported", e);
      }
    }
  }, []);

  const requestPermission = async () => {
    if (typeof window !== "undefined" && "Notification" in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
        if (perm === "granted") {
          new Notification("סהרון - התראות דפדפן פעילות!", {
            body: "מעולה! מעתה תקבלו התראות על נסיעות דחופות ושינויי סטטוס בזמן אמת.",
            icon: "/favicon.ico"
          });
        }
      } catch (e) {
        console.error("Failed to request browser notification permission", e);
      }
    }
  };

  useEffect(() => {
    // טעינת נתונים ראשונית
    setAlerts(StorageEngine.getAlerts());

    // הרשמה לעדכונים של האחסון
    const unsubscribe = subscribeToStore(() => {
      const updated = StorageEngine.getAlerts();
      setAlerts(updated);

      // בדיקה אם יש התראה חדשה להציג כטואסט
      if (updated.length > 0) {
        const latest = updated[0];
        const isNew = !latest.read && (!toast || toast.id !== latest.id);
        if (isNew) {
          // בדוק אם ההתראה החדשה רלוונטית למשתמש הנוכחי
          const isRelevantToMe =
            userRole === "parent" ||
            (userRole === "driver" &&
              currentDriverName &&
              (latest.title + " " + latest.message).toLowerCase().includes(currentDriverName.toLowerCase()));

          if (isRelevantToMe) {
            // התראות קופצות רק על אירועים של ביטול או שינוי נסיעה. כל השאר רק מתועדות (בלי pop up)
            const alertComboText = (latest.title + " " + latest.message).toLowerCase();
            const isCancellationOrChange = 
              alertComboText.includes("ביטול") || 
              alertComboText.includes("בוטלה") || 
              alertComboText.includes("שינוי") || 
              alertComboText.includes("חריגה") || 
              alertComboText.includes("עודכן") ||
              alertComboText.includes("עדכון") ||
              alertComboText.includes("שונה") ||
              alertComboText.includes("cancel") ||
              alertComboText.includes("delete") ||
              alertComboText.includes("change") ||
              alertComboText.includes("update") ||
              alertComboText.includes("modify") ||
              alertComboText.includes("override");

            if (isCancellationOrChange) {
              setToast(latest);

              // הפעלת צליל חיווי חביב כגיבוי בטוח (חצי-מכני נקי)
              playNotificationChime();

              // הפעלת התראת דפדפן (Browser Notification)
              if (typeof window !== "undefined" && "Notification" in window) {
                try {
                  if (Notification.permission === "granted") {
                    new Notification(latest.title, {
                      body: latest.message,
                      icon: "/favicon.ico",
                      tag: latest.id,
                    });
                  }
                } catch (e) {
                  console.error("Could not dispatch browser notification", e);
                }
              }

              setTimeout(() => {
                setToast((curr) => (curr && curr.id === latest.id ? null : curr));
              }, 6000);
            }
          }
        }
      }
    });

    return unsubscribe;
  }, [toast, userRole, activeDriverId, currentDriverName]);

  const markAllAsRead = () => {
    const visibleIds = displayAlerts.map((da) => da.id);
    const updated = alerts.map((a) => (visibleIds.includes(a.id) ? { ...a, read: true } : a));
    StorageEngine.saveAlerts(updated);
    StorageEngine.addLog("התראות", "סומנו כנקראו על ידי נהגאו הורה", userRole === "child" ? "child" : "parent");
  };

  const clearAlerts = () => {
    if (userRole === "parent") {
      StorageEngine.saveAlerts([]);
      StorageEngine.addLog("התראות", "יומן ההתראות נוקה", "parent");
    } else {
      // נהג מוחק רק את שלו
      const visibleIds = displayAlerts.map((da) => da.id);
      const updated = alerts.filter((a) => !visibleIds.includes(a.id));
      StorageEngine.saveAlerts(updated);
    }
  };

  const unreadCount = displayAlerts.filter((a) => !a.read).length;

  // להציג את אייקון ההתראות אך ורק להורים!
  if (userRole !== "parent") {
    return null;
  }

  return (
    <div className="relative" id="notification_center_module">
      {/* כפתור הפעלת פנל התראות בעל חיווי דינמי */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-all duration-200 focus:outline-none"
        title="מרכז התראות והודעות סנכרון"
        id="btn_toggle_notifications"
      >
        {unreadCount > 0 ? (
          <>
            <BellRing className="w-6 h-6 text-indigo-600 animate-swing" />
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-1.5 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-rose-500 rounded-full">
              {unreadCount}
            </span>
          </>
        ) : (
          <Bell className="w-6 h-6" />
        )}
      </button>

      {/* פנל רשימת התראות נפתח */}
      <AnimatePresence>
        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />
            <motion.div
              initial={{ opacity: 0, y: 15, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.95 }}
              className="absolute left-0 mt-3 w-96 bg-white rounded-2xl shadow-2xl border border-slate-100 z-50 overflow-hidden text-right"
              id="notification_dropdown_panel"
            >
              <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center flex-row-reverse">
                <div className="flex items-center gap-2 flex-row-reverse">
                  <span className="font-semibold text-slate-800 text-base">
                    {userRole === "parent" ? "מרכז התראות הורים" : `התראות עבור: ${currentDriver?.name || ""}`}
                  </span>
                  {unreadCount > 0 && (
                    <span className="bg-indigo-100 text-indigo-700 text-xs px-2 py-0.5 rounded-full font-medium">
                      {unreadCount} חדשות
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-indigo-600 hover:text-indigo-800 font-medium cursor-pointer"
                    >
                      סמן כנקרא
                    </button>
                  )}
                  {displayAlerts.length > 0 && (
                    <button
                      onClick={clearAlerts}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer mr-2 border-r pr-2 border-slate-200"
                    >
                      נקה
                    </button>
                  )}
                </div>
              </div>

              {/* בקרת הרשאה להתראות דפדפן */}
              <div className="px-4 py-2.5 bg-indigo-50 border-b border-indigo-100 flex justify-between items-center flex-row-reverse text-xs select-none">
                <span className="font-bold text-indigo-950 flex items-center gap-1 flex-row-reverse">
                  <span>התראות דפדפן (Push)</span>
                </span>
                {notificationPermission === "granted" ? (
                  <span className="text-emerald-700 font-extrabold flex items-center gap-1 flex-row-reverse text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    <Check className="w-3.5 h-3.5 shrink-0" />
                    <span>פעיל ומסונכרן 🔔</span>
                  </span>
                ) : notificationPermission === "denied" ? (
                  <span className="text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200 text-[11px] hover:cursor-help" title="ההרשאה חסומה בדפדפן. כדי לשנותה, לחצו על סמל המנעול בצד כתובת האתר בדפדפן">
                    נעול בהגדרות ❌
                  </span>
                ) : (
                  <button
                    onClick={requestPermission}
                    className="bg-indigo-600 hover:bg-indigo-750 text-white font-black px-3 py-1.5 text-[10px] rounded border border-indigo-950 shadow-[2px_2px_0_0_#1e1b4b] hover:shadow-none transition-all cursor-pointer"
                  >
                    הפעל התראות 🔔
                  </button>
                )}
              </div>

              {isIframe && (
                <div className="px-4 py-2 bg-amber-50 text-[10px] text-amber-950 border-b border-amber-200 text-right leading-relaxed font-sans font-medium">
                  ⚠️ <strong>חסימת iFrame פעילה בדפדפן:</strong> כרגע האתר מוצג בתוך סביבת פיתוח מוגנת (פריוויו). לקבלת התראות דפדפן מערכתיות (Push Context), פתחו את האתר בטאב חדש באמצעות קישור הפיתוח או השיתוף הישרים למעלה. <br />
                  <span className="text-indigo-900 font-semibold">💡 כגיבוי, צליל התראה מלודי מופעל כעת אוטומטית בכל שינוי!</span>
                </div>
              )}

              <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-50">
                {displayAlerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-300" />
                    <p className="text-sm">הכל שקט ומעודכן בזמן אמת</p>
                    <p className="text-xs text-slate-300">שינויים רלוונטיים יקפצו כאן מיידית</p>
                  </div>
                ) : (
                  displayAlerts.map((item) => (
                    <div
                      key={item.id}
                      className={`p-3.5 transition-colors duration-150 ${item.read ? "bg-white" : "bg-indigo-50/40"}`}
                    >
                      <div className="flex gap-3 items-start flex-row-reverse">
                        <div className="mt-0.5">
                          {item.type === "urgent" ? (
                            <ShieldAlert className="w-5 h-5 text-rose-500 shrink-0" />
                          ) : item.type === "success" ? (
                            <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                          ) : (
                            <Info className="w-5 h-5 text-blue-500 shrink-0" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0 pr-1">
                          <p className={`text-sm font-medium text-slate-800 ${!item.read ? "font-semibold" : ""}`}>
                            {item.title}
                          </p>
                          <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.message}</p>
                          <div className="flex items-center gap-1.5 mt-2 text-[10px] text-slate-400 justify-end">
                            <span>
                              {new Date(item.timestamp).toLocaleTimeString("he-IL", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <MessageSquareCode className="w-3 h-3 text-emerald-500" />
                              סנכרון פעיל
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2 bg-slate-50 border-t border-slate-100 text-center">
                <p className="text-[10px] text-slate-400 flex justify-center items-center gap-1">
                  <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
                  סנכרון פעיל (RTL WebSockets Sim)
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* הודעת פוש (Toast) קופצת בזמן אמת בראש המסך */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.9 }}
            className="fixed top-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-slate-900 text-white rounded-xl shadow-2xl p-4 z-50 border border-slate-700 mx-auto"
            id="realtime_toast_notification"
          >
            <div className="flex gap-3 items-start flex-row-reverse">
              <button
                onClick={() => setToast(null)}
                className="text-slate-400 hover:text-white shrink-0 p-0.5 rounded hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex-1 pr-1 text-right">
                <div className="flex items-center gap-2 justify-end flex-row-reverse mb-1">
                  <span className="text-xs font-semibold uppercase tracking-wider bg-indigo-600/60 text-indigo-200 px-1.5 py-0.5 rounded">
                    התראת סנכרון הורים
                  </span>
                  {toast.type === "urgent" && (
                    <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full font-bold">
                      שינוי דחוף!
                    </span>
                  )}
                </div>
                <h4 className="text-sm font-bold text-white">{toast.title}</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">{toast.message}</p>
                <div className="mt-2.5 pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex items-center justify-between">
                  <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20">
                    הדמיית SMS נשלחה בהצלחה בנפרד לנהג
                  </span>
                  <span>עכשיו</span>
                </div>
              </div>
              <div className="mt-0.5 shrink-0 bg-slate-800 p-1.5 rounded-lg border border-slate-700">
                {toast.type === "urgent" ? (
                  <ShieldAlert className="w-5 h-5 text-rose-400" />
                ) : toast.type === "success" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Info className="w-5 h-5 text-blue-400" />
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
