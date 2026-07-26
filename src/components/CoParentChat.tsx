import React, { useState } from "react";
import { ChatMessage, ActivityLog, ParentProfile } from "../types";
import { StorageEngine } from "../data";
import { MessageSquare, Send, CheckCheck, Clock, ShieldAlert, History } from "lucide-react";

interface CoParentChatProps {
  messages: ChatMessage[];
  logs: ActivityLog[];
  parents: ParentProfile[];
  activeParentId: string;
}

export const CoParentChat: React.FC<CoParentChatProps> = ({
  messages,
  logs,
  parents,
  activeParentId,
}) => {
  const [activeTab, setActiveTab] = useState<"chat" | "logs">("chat");
  const [text, setText] = useState("");

  const DEFAULT_PARENT: ParentProfile = {
    id: "parent1",
    name: "Parent",
    role: "Mom",
    color: "bg-indigo-500",
    avatarUrl: "👤",
  };

  const activeParent = (parents && parents.find((p) => p.id === activeParentId)) || parents?.[0] || DEFAULT_PARENT;
  const coParent = (parents && parents.find((p) => p.id !== activeParentId)) || parents?.[1] || parents?.[0] || DEFAULT_PARENT;

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;

    StorageEngine.sendMessage(
      text,
      activeParent.id,
      activeParent.name,
      coParent.id,
      coParent.name
    );
    setText("");
  };

  return (
    <div className="flex flex-col gap-4 pb-24 h-[calc(100vh-140px)]">
      {/* Sub-tabs header */}
      <div className="flex bg-slate-100 p-1 rounded-2xl shrink-0">
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "chat"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <MessageSquare className="w-4 h-4" />
          <span>Chat with {coParent.name.split(" ")[0]}</span>
        </button>

        <button
          onClick={() => setActiveTab("logs")}
          className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === "logs"
              ? "bg-white text-indigo-700 shadow-xs"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <History className="w-4 h-4" />
          <span>Activity Log</span>
        </button>
      </div>

      {activeTab === "chat" ? (
        <div className="flex-1 flex flex-col justify-between bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-2xs">
          {/* Chat Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto flex flex-col gap-3">
            {messages.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs flex flex-col items-center gap-2">
                <MessageSquare className="w-8 h-8 text-slate-300" />
                <p>No messages yet. Send a message to coordinate with {coParent.name}.</p>
              </div>
            ) : (
              messages.map((msg) => {
                const isMine = msg.senderId === activeParentId;

                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col max-w-[80%] ${
                      isMine ? "ml-auto items-end" : "mr-auto items-start"
                    }`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                      {msg.senderName.split(" ")[0]}
                    </span>

                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed ${
                        isMine
                          ? "bg-indigo-600 text-white rounded-br-xs"
                          : "bg-slate-100 text-slate-800 rounded-bl-xs"
                      }`}
                    >
                      {msg.text}
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-slate-400 mt-1 px-1">
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {isMine && <CheckCheck className="w-3 h-3 text-indigo-400" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Message Input Bar */}
          <form
            onSubmit={handleSendMessage}
            className="p-3 border-t border-slate-100 bg-slate-50 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder={`Message ${coParent.name.split(" ")[0]}...`}
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none"
            />
            <button
              type="submit"
              disabled={!text.trim()}
              className="p-2.5 bg-indigo-600 text-white rounded-2xl shadow-xs hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      ) : (
        /* Activity Log Feed */
        <div className="flex-1 bg-white border border-slate-200 rounded-3xl p-4 overflow-y-auto flex flex-col gap-3 shadow-2xs">
          <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Logistics Audit Log
          </h3>

          {logs.map((log) => (
            <div
              key={log.id}
              className="p-3 bg-slate-50 rounded-2xl border border-slate-100 text-xs flex flex-col gap-1"
            >
              <div className="flex items-center justify-between font-bold text-slate-800">
                <span>{log.action}</span>
                <span className="text-[10px] font-normal text-slate-400">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
              <p className="text-slate-600 text-[11px]">{log.details}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
