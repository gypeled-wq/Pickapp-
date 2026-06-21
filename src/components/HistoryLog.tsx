/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { ActivityLog, DEFAULT_CHILDREN } from "../types";
import { StorageEngine, subscribeToStore } from "../data";
import { History, Search, Filter, Calendar, User, UserCheck, ShieldAlert, BadgeInfo } from "lucide-react";

export default function HistoryLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [childFilter, setChildFilter] = useState<string>("all");

  useEffect(() => {
    setLogs(StorageEngine.getLogs());
    return subscribeToStore(() => {
      setLogs(StorageEngine.getLogs());
    });
  }, []);

  const filteredLogs = logs.filter((log) => {
    // דיוק סינונים לפי ילד
    const matchesChild = childFilter === "all" || log.childName === childFilter;

    // חיפוש טקסט חופשי בפרטי הלוג או הפעולה
    const matchesText =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesChild && matchesText;
  });

  const getRoleBadgeColor = (role: ActivityLog["userRole"]) => {
    switch (role) {
      case "parent":
        return "bg-[#141414] text-[#E4E3E0] border-[#141414]";
      case "child":
        return "bg-white text-[#141414] border-[#141414]";
      default:
        return "bg-[#D1D0CC] text-[#141414] border-[#141414]";
    }
  };

  const getRoleLabel = (role: ActivityLog["userRole"]) => {
    if (role === "parent") return "הורים";
    if (role === "child") return "ילדים";
    return "מערכת";
  };

  return (
    <div className="bg-[#E4E3E0] border-4 border-[#141414] tech-shadow p-6 text-right" id="activity_logs_section">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b-2 border-[#141414] pb-4 mb-6 flex-row-reverse">
        <div>
          <h3 className="text-xl font-black text-[#141414] flex items-center gap-1.5 justify-end flex-row-reverse font-serif uppercase italic">
            <History className="w-5 h-5 text-[#141414]" />
            <span>יומן פעילות ותיעוד היסטורי</span>
          </h3>
          <p className="text-xs text-slate-700 mt-1 font-mono uppercase tracking-tight">תיעוד מפורט של כל אירועי ההסעות, שינויי לו״ז וסטטוס ביצוע</p>
        </div>

        {/* בורר סינון הילד */}
        <div className="flex gap-2 flex-wrap items-center flex-row-reverse select-none">
          <span className="text-xs font-bold text-slate-800 flex items-center gap-1 flex-row-reverse font-mono uppercase">
            <Filter className="w-3.5 h-3.5" />
            <span>סנן לפי ילד/ה:</span>
          </span>
          <button
            onClick={() => setChildFilter("all")}
            className={`px-3 py-1.5 border-2 border-[#141414] text-xs font-black transition-colors cursor-pointer ${
              childFilter === "all"
                ? "bg-[#141414] text-[#E4E3E0]"
                : "bg-white text-[#141414] hover:bg-slate-100"
            }`}
          >
            כל הילדים
          </button>
          {DEFAULT_CHILDREN.map((c) => (
            <button
              key={c}
              onClick={() => setChildFilter(c)}
              className={`px-3 py-1.5 border-2 border-[#141414] text-xs font-black transition-colors cursor-pointer ${
                childFilter === c
                  ? "bg-[#141414] text-[#E4E3E0]"
                  : "bg-white text-[#141414] hover:bg-slate-100"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* חיפוש מהיר */}
      <div className="mb-4 relative">
        <input
          type="text"
          placeholder="חיפוש פסקאות, נהגים או סיבות ביומן..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs px-3.5 py-2.5 border-2 border-[#141414] focus:outline-none Focus:ring-0 bg-white placeholder-slate-500 text-right pr-9 font-mono"
        />
        <Search className="w-4 h-4 text-slate-700 absolute right-3.5 top-3.5" />
      </div>

      {/* רשימת לוגים גלולה */}
      <div className="space-y-3.5 max-h-[350px] overflow-y-auto pr-1">
        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-slate-600 border-2 border-dashed border-[#141414] bg-white">
            <p className="text-xs font-bold">אין היסטוריה המתאימה לפרמטרים שנבחרו</p>
            <p className="text-[10px] text-slate-500 mt-1 font-mono">כל שינוי או סימון &quot;הושלם&quot; שיתבצע במערכת יופיע כאן מייד.</p>
          </div>
        ) : (
          filteredLogs.map((log) => (
            <div
              key={log.id}
              className="p-3.5 border-2 border-[#141414] bg-white transition-colors"
            >
              <div className="flex flex-col sm:flex-row justify-between items-start gap-2 flex-row-reverse text-right">
                <div className="flex items-center gap-2 flex-row-reverse">
                  {/* סוג הפעולה */}
                  <span className="font-bold text-[#141414] text-xs sm:text-sm">{log.action}</span>

                  {/* יוזם הפעולה */}
                  <span className={`text-[10px] px-2 py-0.5 font-bold border ${getRoleBadgeColor(log.userRole)}`}>
                    {getRoleLabel(log.userRole)}
                  </span>

                  {log.childName && (
                    <span className="bg-[#D1D0CC] text-[#141414] text-[10px] px-2 py-0.5 border border-[#141414] font-bold">
                      {log.childName}
                    </span>
                  )}
                </div>

                {/* זמן גלובלי */}
                <span className="text-[10px] font-mono text-[#141414] ltr bg-[#F2F2EF] border border-[#141414] px-2 py-0.5">
                  {new Date(log.timestamp).toLocaleDateString("he-IL", {
                    day: "2-digit",
                    month: "2-digit",
                  })}{" "}
                  -{" "}
                  {new Date(log.timestamp).toLocaleTimeString("he-IL", {
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </span>
              </div>

              {/* פירוט השינוי */}
              <p className="text-xs text-slate-800 mt-2 leading-relaxed bg-[#F2F2EF] p-2 border border-[#141414] font-mono">
                {log.details}
              </p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
