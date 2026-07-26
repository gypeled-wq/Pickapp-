import React from "react";
import { ParentProfile, Child } from "../types";
import { Sparkles, Lock, Unlock } from "lucide-react";

interface HeaderProps {
  parents: ParentProfile[];
  activeParentId: string;
  onSelectParent: (id: string) => void;
  childrenList: Child[];
  selectedChildId: string | "all";
  onSelectChild: (id: string | "all") => void;
  onOpenAiModal: () => void;
  onToggleLock?: () => void;
  isLocked?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  parents,
  activeParentId,
  onSelectParent,
  childrenList,
  selectedChildId,
  onSelectChild,
  onOpenAiModal,
  onToggleLock,
  isLocked,
}) => {
  const activeParent =
    (parents && parents.length > 0 && (parents.find((p) => p.id === activeParentId) || parents[0])) || {
      id: "parent1",
      name: "Parent",
      role: "Mom",
      color: "bg-indigo-500",
      avatarUrl: "👤",
    };

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-30 px-4 py-3 shadow-xs" dir="rtl">
      <div className="max-w-lg mx-auto flex flex-col gap-2.5">
        {/* Top Row: App Title & Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg shadow-sm">
              🏡
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight leading-none">
                NestFlow
              </h1>
              <span className="text-[11px] font-semibold text-slate-400">ניהול הורות משותפת והסעות</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Lock Button */}
            {onToggleLock && (
              <button
                onClick={onToggleLock}
                className={`p-2 rounded-full text-xs font-semibold transition-all shadow-2xs ${
                  isLocked
                    ? "bg-amber-100 text-amber-800 border border-amber-300 animate-pulse"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
                title={isLocked ? "נעול בסיסמה (לחץ לשחרור)" : "נעילת גישה בסיסמה"}
              >
                {isLocked ? <Lock className="w-4 h-4 text-amber-700" /> : <Unlock className="w-4 h-4 text-slate-500" />}
              </button>
            )}

            {/* AI Magic Input Button */}
            <button
              onClick={onOpenAiModal}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-full text-xs font-semibold shadow-sm hover:opacity-95 transition-all active:scale-95"
              title="הוספת משימות, איסופים או הוצאות בשפה חופשית"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              <span>תיעוד מהיר</span>
            </button>
          </div>
        </div>

        {/* Bottom Row: Active Role Selector & Child Filter */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80">
          {/* Active Parent Switcher */}
          <div className="flex items-center gap-1 bg-slate-100/80 p-1 rounded-2xl">
            {(parents || []).map((p) => {
              if (!p) return null;
              const isActive = p.id === activeParentId;
              return (
                <button
                  key={p.id}
                  onClick={() => onSelectParent(p.id)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs font-semibold scale-[1.02]"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span className="text-sm">{p.avatarUrl || "👤"}</span>
                  <span>{p.name ? p.name.split(" ")[0] : "Parent"}</span>
                </button>
              );
            })}
          </div>

          {/* Children Selector */}
          <div className="flex items-center gap-1">
            <button
              onClick={() => onSelectChild("all")}
              className={`px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                selectedChildId === "all"
                  ? "bg-slate-800 text-white font-semibold"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              כל הילדים
            </button>
            {childrenList.map((c) => (
              <button
                key={c.id}
                onClick={() => onSelectChild(c.id)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-xl text-xs font-medium transition-all ${
                  selectedChildId === c.id
                    ? "bg-indigo-600 text-white font-semibold shadow-xs"
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                }`}
              >
                <span>{c.avatar}</span>
                <span>{c.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};
