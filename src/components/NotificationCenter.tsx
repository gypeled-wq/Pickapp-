/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AlertNotification } from "../types";
import { StorageEngine, subscribeToStore } from "../data";
import { Bell, BellRing, Check, ShieldAlert, CheckCircle2, Info, X, MessageSquareCode } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function NotificationCenter() {
  const [alerts, setAlerts] = useState<AlertNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [toast, setToast] = useState<AlertNotification | null>(null);

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
          setToast(latest);
          // השמעת צליל חלש ומודרני (אופציונלי אך נחמד ל-חוויה, נשתמש ב-Vibe ויזואלי)
          setTimeout(() => {
            setToast((curr) => (curr && curr.id === latest.id ? null : curr));
          }, 6000);
        }
      }
    });

    return unsubscribe;
  }, [toast]);

  const markAllAsRead = () => {
    const updated = alerts.map((a) => ({ ...a, read: true }));
    StorageEngine.saveAlerts(updated);
    StorageEngine.addLog("התראות", "כל ההתראות סומנו כנקראו", "parent");
  };

  const clearAlerts = () => {
    StorageEngine.saveAlerts([]);
    StorageEngine.addLog("התראות", "יומן ההתראות נוקה", "parent");
  };

  const unreadCount = alerts.filter((a) => !a.read).length;

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
            <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/3 -translate-y-1/3 bg-rose-500 rounded-full">
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
                  <span className="font-semibold text-slate-800 text-base">מרכז התראות הורים</span>
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
                      סמן הכל כנקרא
                    </button>
                  )}
                  {alerts.length > 0 && (
                    <button
                      onClick={clearAlerts}
                      className="text-xs text-slate-400 hover:text-slate-600 font-medium cursor-pointer mr-2 border-r pr-2 border-slate-200"
                    >
                      נקה הכל
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto divide-y divide-slate-50">
                {alerts.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center gap-2">
                    <CheckCircle2 className="w-8 h-8 text-slate-300" />
                    <p className="text-sm">הכל שקט ומעודכן בזמן אמת</p>
                    <p className="text-xs text-slate-300">שינויים בלו״ז יקפצו כאן מיידית לשני ההורים</p>
                  </div>
                ) : (
                  alerts.map((item) => (
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
                              נשלח SMS להורים ולנהג
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
