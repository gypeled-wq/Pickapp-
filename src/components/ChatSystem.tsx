/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from "react";
import { ChatMessage, Driver } from "../types";
import { StorageEngine, subscribeToStore } from "../data";
import { 
  MessageSquare, 
  Send, 
  Check, 
  CheckCheck, 
  Flag, 
  AlertTriangle, 
  Clock, 
  User, 
  Shield, 
  Search, 
  FileText,
  ShieldAlert,
  Info
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface ChatSystemProps {
  userRole: "parent" | "driver" | "child";
  activeDriverId: string | null;
}

export default function ChatSystem({ userRole, activeDriverId }: ChatSystemProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null);
  const [inputText, setInputText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Reported Modal State
  const [reportingMessageId, setReportingMessageId] = useState<string | null>(null);
  const [reportReason, setReportReason] = useState("");
  const [customReportReason, setCustomReportReason] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Sync with store
  useEffect(() => {
    setMessages(StorageEngine.getMessages());
    setDrivers(StorageEngine.getDrivers());
    
    return subscribeToStore(() => {
      setMessages(StorageEngine.getMessages());
      setDrivers(StorageEngine.getDrivers());
    });
  }, []);

  // For drivers, the chat partner is always "parent". For parents, auto-select the first driver if none is selected.
  useEffect(() => {
    if (userRole === "parent") {
      if (!selectedDriverId && drivers.length > 0) {
        setSelectedDriverId(drivers[0].id);
      }
    } else if (userRole === "driver") {
      setSelectedDriverId("parent");
    }
  }, [userRole, drivers, selectedDriverId]);

  // Scroll to bottom on message updates
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, selectedDriverId]);

  // Mark incoming messages as read when viewed
  useEffect(() => {
    if (!selectedDriverId) return;

    const currentUserId = userRole === "parent" ? "parent" : (activeDriverId || "");
    const unreadMessages = messages.filter(
      (m) => m.receiverId === currentUserId && m.senderId === selectedDriverId && !m.read
    );

    if (unreadMessages.length > 0) {
      unreadMessages.forEach((msg) => {
        StorageEngine.markMessageAsRead(msg.id);
      });
    }
  }, [messages, selectedDriverId, userRole, activeDriverId]);

  if (userRole === "child") {
    return (
      <div className="bg-white border-4 border-[#141414] shadow-[4px_4px_0_0_#141414] p-6 text-right" style={{ direction: "rtl" }}>
        <div className="flex flex-col items-center justify-center py-8 text-slate-500 gap-3">
          <ShieldAlert className="w-12 h-12 text-slate-400" />
          <h3 className="text-lg font-black text-slate-800">מערכת הצ׳אט חסומה לילדים</h3>
          <p className="text-sm text-slate-600 max-w-sm text-center">
            על מנת להבטיח את שלומכם ובטיחותכם, הגישה לשיחות והודעות פתוחה רק להורים ונהגים מורשים.
          </p>
        </div>
      </div>
    );
  }

  // Get current active conversation partner details
  const getChatPartnerName = () => {
    if (userRole === "driver") {
      return "הורים (אדמין)";
    }
    const driver = drivers.find((d) => d.id === selectedDriverId);
    return driver ? driver.name : "נהג";
  };

  const getChatPartnerPhone = () => {
    if (userRole === "driver") return "קו חירום משפחתי";
    const driver = drivers.find((d) => d.id === selectedDriverId);
    return driver ? driver.phone : "";
  };

  const getChatPartnerCar = () => {
    if (userRole === "driver") return "סהרון - ליווי בטוח";
    const driver = drivers.find((d) => d.id === selectedDriverId);
    return driver ? driver.vehicleInfo : "";
  };

  // Filter messages for active conversation
  const currentUserId = userRole === "parent" ? "parent" : (activeDriverId || "");
  const conversationMessages = messages.filter((m) => {
    if (userRole === "parent") {
      return (
        (m.senderId === "parent" && m.receiverId === selectedDriverId) ||
        (m.senderId === selectedDriverId && m.receiverId === "parent")
      );
    } else {
      // Driver view: conversation is strictly between this driver and the parent
      return (
        (m.senderId === activeDriverId && m.receiverId === "parent") ||
        (m.senderId === "parent" && m.receiverId === activeDriverId)
      );
    }
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    if (!selectedDriverId) return;

    const senderName = userRole === "parent" ? "הורים" : (drivers.find(d => d.id === activeDriverId)?.name || "נהג מלווה");
    const receiverName = userRole === "parent" ? (drivers.find(d => d.id === selectedDriverId)?.name || "נהג") : "הורים";

    StorageEngine.sendMessage(
      inputText,
      currentUserId,
      senderName,
      selectedDriverId,
      receiverName
    );

    setInputText("");
  };

  const handleOpenReportModal = (msgId: string) => {
    setReportingMessageId(msgId);
    setReportReason("ספאם / תוכן לא רלוונטי");
    setCustomReportReason("");
  };

  const handleSubmitReport = () => {
    if (!reportingMessageId) return;
    const finalReason = reportReason === "אחר" ? customReportReason : reportReason;
    if (!finalReason.trim()) return;

    StorageEngine.reportMessage(reportingMessageId, finalReason, currentUserId);
    setReportingMessageId(null);
  };

  // Format time beautifully
  const formatTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    } catch {
      return "";
    }
  };

  const filteredDriversList = drivers.filter(d => 
    d.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white border-4 border-[#141414] shadow-[4px_4px_0_0_#141414] rounded-xl overflow-hidden font-sans text-right" style={{ direction: "rtl" }}>
      {/* כותרת קבועה של מערכת ההודעות */}
      <div className="bg-[#141414] text-white p-4 flex justify-between items-center flex-row-reverse border-b-4 border-[#141414]">
        <div className="flex items-center gap-2 flex-row-reverse">
          <div className="w-8 h-8 rounded-full bg-indigo-500 flex items-center justify-center font-black text-sm text-white">
            💬
          </div>
          <div>
            <h3 className="font-black text-sm sm:text-base tracking-tight">מערכת שיחות והודעות / IN-APP MESSAGES</h3>
            <p className="text-[10px] text-slate-300 font-bold">תיעוד בטוח וסנכרון מלא בזמן אמת בין הורים לנהגים מלווים</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 bg-yellow-400 text-black px-2.5 py-1 text-[10px] font-black rounded border border-black">
          <Shield className="w-3.5 h-3.5" />
          <span>מבוקר בטיחותית</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 min-h-[500px]">
        {/* סיידבר של רשימת הנהגים (נראה רק להורים) */}
        {userRole === "parent" && (
          <div className="md:col-span-4 border-l-4 border-[#141414] bg-[#FFFDF6] flex flex-col">
            <div className="p-3 border-b-2 border-[#141414] space-y-2">
              <label className="text-[11px] font-extrabold text-[#141414] block">חפשו נהג לשיחה:</label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="חיפוש נהג..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border-2 border-[#141414] p-1.5 px-8 text-xs font-bold text-[#141414] focus:outline-none"
                />
                <Search className="w-4 h-4 text-[#141414] absolute right-2.5 top-2.5" />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[400px] md:max-h-[500px]">
              {filteredDriversList.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500 font-bold">לא נמצאו נהגים התואמים לחיפוש.</div>
              ) : (
                filteredDriversList.map((driver) => {
                  const isSelected = driver.id === selectedDriverId;
                  
                  // ספירת הודעות שלא נקראו
                  const unreadCount = messages.filter(
                    (m) => m.senderId === driver.id && m.receiverId === "parent" && !m.read
                  ).length;

                  // הודעה אחרונה בשיחה
                  const lastMsg = messages
                    .filter(
                      (m) =>
                        (m.senderId === "parent" && m.receiverId === driver.id) ||
                        (m.senderId === driver.id && m.receiverId === "parent")
                    )
                    .pop();

                  return (
                    <button
                      key={driver.id}
                      onClick={() => setSelectedDriverId(driver.id)}
                      className={`w-full p-3.5 text-right flex items-center justify-between border-b border-slate-200 transition-all cursor-pointer ${
                        isSelected 
                          ? "bg-[#EEF2FF] border-r-4 border-indigo-600" 
                          : "hover:bg-slate-100"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-row-reverse text-right">
                        <div className={`w-9 h-9 rounded-full border-2 border-[#141414] flex items-center justify-center font-bold text-xs ${
                          driver.type === "permanent" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"
                        }`}>
                          {driver.name.charAt(0)}
                        </div>
                        <div className="text-right">
                          <h4 className="font-black text-xs text-[#141414] flex items-center gap-1.5 justify-start">
                            {driver.name}
                            <span className={`text-[9px] px-1.5 py-0.2 font-black border border-black rounded ${
                              driver.type === "permanent" ? "bg-amber-200" : "bg-emerald-200"
                            }`}>
                              {driver.type === "permanent" ? "קבוע" : "אורח"}
                            </span>
                          </h4>
                          <p className="text-[10px] text-slate-500 font-bold font-mono truncate max-w-[150px] mt-0.5">
                            {lastMsg ? lastMsg.text : "אין הודעות קודמות"}
                          </p>
                        </div>
                      </div>

                      {unreadCount > 0 && (
                        <span className="bg-red-500 text-white font-black text-[9px] w-5 h-5 rounded-full flex items-center justify-center animate-bounce border border-black">
                          {unreadCount}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* חלון הצ׳אט הראשי */}
        <div className={`flex flex-col bg-[#FDFDFB] ${userRole === "parent" ? "md:col-span-8" : "md:col-span-12"}`}>
          {/* גוף השיחה הפעיל / פרטי שותף השיחה */}
          {selectedDriverId ? (
            <>
              {/* כותרת השיחה הפעילה */}
              <div className="p-3.5 bg-white border-b-2 border-[#141414] flex justify-between items-center flex-row-reverse">
                <div className="flex items-center gap-3 flex-row-reverse text-right">
                  <div className="w-10 h-10 rounded-full bg-slate-100 border-2 border-[#141414] flex items-center justify-center text-base">
                    👤
                  </div>
                  <div>
                    <h4 className="font-black text-xs sm:text-sm text-[#141414] flex items-center gap-1.5 justify-start">
                      {getChatPartnerName()}
                    </h4>
                    <p className="text-[10px] text-slate-500 font-bold font-mono">
                      {getChatPartnerCar() ? `🚗 ${getChatPartnerCar()}` : ""} {getChatPartnerPhone() ? `| 📞 ${getChatPartnerPhone()}` : ""}
                    </p>
                  </div>
                </div>

                {/* הערה בטיחותית קטנה */}
                <div className="hidden sm:flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-200 px-2.5 py-1 text-[10px] font-bold rounded">
                  <Info className="w-3.5 h-3.5 text-blue-700 shrink-0" />
                  <span>כל הודעה נרשמת לצרכי בטיחות ומעקב</span>
                </div>
              </div>

              {/* הודעות בשיחה */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 min-h-[300px] max-h-[420px] bg-[#FAF9F5]">
                {conversationMessages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full py-12 text-slate-400 text-center gap-2">
                    <MessageSquare className="w-10 h-10 text-slate-300" />
                    <p className="text-xs font-extrabold text-slate-500">אין הודעות בשיחה זו עדיין.</p>
                    <p className="text-[10px] text-slate-400 max-w-xs leading-normal">
                      כתבו הודעה קצרה, למשל על שינויי מיקום, עדכוני שעות או הוראות איסוף מיוחדות לילדים.
                    </p>
                  </div>
                ) : (
                  conversationMessages.map((msg) => {
                    const isMyMessage = msg.senderId === currentUserId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col max-w-[85%] ${
                          isMyMessage ? "mr-auto items-end text-left" : "ml-auto items-start text-right"
                        }`}
                      >
                        {/* שם השולח מעל בועת הצ׳אט */}
                        <span className="text-[9px] text-slate-500 font-extrabold mb-1 px-1 font-mono">
                          {isMyMessage ? "אני" : msg.senderName}
                        </span>

                        {/* בועת הצ׳אט */}
                        <div
                          className={`p-3 border-2 border-[#141414] shadow-[1.5px_1.5px_0_0_#141414] text-xs font-bold leading-relaxed relative group transition-all ${
                            isMyMessage
                              ? "bg-indigo-50 text-indigo-950 rounded-l-xl rounded-tr-xl rounded-br-none"
                              : "bg-white text-slate-900 rounded-r-xl rounded-tl-xl rounded-bl-none"
                          }`}
                        >
                          <p className="whitespace-pre-wrap">{msg.text}</p>
                          
                          {/* דיווח ופעולות בטיחות (הצפה במעבר עכבר למשנה זהירות) */}
                          {!isMyMessage && !msg.reported && (
                            <button
                              onClick={() => handleOpenReportModal(msg.id)}
                              className="absolute -top-2.5 -left-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-400 rounded-full p-1 shadow opacity-0 group-hover:opacity-100 transition-opacity duration-200 cursor-pointer"
                              title="דווח על הודעה זו מטעמי בטיחות"
                            >
                              <Flag className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {/* תחתית ההודעה: חתימת זמן + סימוני קריאה */}
                        <div className="flex items-center gap-1 mt-1 text-[9px] text-slate-500 font-semibold font-mono">
                          <span>{formatTime(msg.timestamp)}</span>
                          {isMyMessage && (
                            <span>
                              {msg.read ? (
                                <CheckCheck className="w-3.5 h-3.5 text-indigo-600 inline" />
                              ) : (
                                <Check className="w-3.5 h-3.5 text-slate-400 inline" />
                              )}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={chatEndRef} />
              </div>

              {/* טופס שליחת הודעה */}
              <form onSubmit={handleSendMessage} className="p-3 bg-white border-t-2 border-[#141414] flex gap-2 items-center">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="הקלידו הודעה כאן..."
                  className="flex-1 bg-slate-50 border-2 border-[#141414] p-2 text-xs font-bold focus:outline-none focus:bg-white text-right"
                  maxLength={500}
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className="bg-indigo-600 hover:bg-[#141414] text-white p-2.5 px-4 border-2 border-[#141414] shadow-[2px_2px_0_0_#141414] active:translate-y-0.5 active:shadow-none font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0 disabled:opacity-55 disabled:cursor-not-allowed"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>שלח</span>
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center py-12 text-slate-400 text-center gap-3">
              <MessageSquare className="w-12 h-12 text-slate-300 animate-pulse" />
              <h4 className="text-sm font-black text-slate-700">בחר שיחה בצד ימין כדי להתחיל</h4>
              <p className="text-xs text-slate-500 max-w-sm px-6 leading-relaxed">
                ממשק ההורים מאפשר התכתבות ישירה מול כל נהג ונהגת פעילים, עדכון פרטים מהיר, וסנכרון מיידי עם הנייד של הנהג המלווה.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* מודאל דיווח הודעה / בטיחות */}
      <AnimatePresence>
        {reportingMessageId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55 font-sans" style={{ direction: "rtl" }}>
            <div className="absolute inset-0" onClick={() => setReportingMessageId(null)} />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white border-4 border-[#141414] shadow-[6px_6px_0_0_#141414] max-w-sm w-full p-5 relative z-10 text-right space-y-4"
            >
              <div className="flex items-center gap-2 justify-start border-b-2 border-slate-200 pb-2 flex-row-reverse">
                <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                <h3 className="text-sm font-black text-slate-900">דיווח על הודעה מטעמי בטיחות</h3>
              </div>

              <p className="text-xs text-slate-700 leading-normal font-bold">
                אם הודעה זו חורגת מכללי הבטיחות של האפליקציה, אנא סמנו את הסיבה המתאימה. הדיווח יירשם במערכת ויצונזר מיידית:
              </p>

              <div className="space-y-2">
                {[
                  "ספאם / תוכן לא רלוונטי",
                  "שפה לא הולמת / שיח לא מכבד",
                  "סוגיית אבטחה או בטיחות של ילד",
                  "אחר"
                ].map((reason) => (
                  <label key={reason} className="flex items-center gap-2 text-xs font-bold cursor-pointer text-slate-800">
                    <input
                      type="radio"
                      name="reportReason"
                      value={reason}
                      checked={reportReason === reason}
                      onChange={() => setReportReason(reason)}
                      className="accent-rose-600 border-[#141414]"
                    />
                    <span>{reason}</span>
                  </label>
                ))}
              </div>

              {reportReason === "אחר" && (
                <textarea
                  placeholder="אנא פרטו בקצרה..."
                  value={customReportReason}
                  onChange={(e) => setCustomReportReason(e.target.value)}
                  className="w-full bg-slate-50 border-2 border-[#141414] p-1.5 text-xs font-bold text-slate-800 focus:outline-none"
                  rows={2}
                />
              )}

              <div className="flex gap-2 justify-end pt-2">
                <button
                  onClick={() => setReportingMessageId(null)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border-2 border-[#141414] text-xs font-extrabold cursor-pointer text-[#141414]"
                >
                  ביטול
                </button>
                <button
                  onClick={handleSubmitReport}
                  className="px-3 py-1.5 bg-rose-600 hover:bg-[#141414] text-white hover:text-white border-2 border-[#141414] text-xs font-black shadow-[2px_2px_0_0_#141414] active:translate-y-0.5 cursor-pointer"
                >
                  שלח דיווח
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
