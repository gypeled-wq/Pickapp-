import React, { useState } from "react";
import { Child, ParentProfile } from "../types";
import { StorageEngine } from "../data";
import { Sparkles, Mic, MicOff, Send, CheckCircle2, ArrowRight, Loader2, X } from "lucide-react";

interface AiInputModalProps {
  isOpen: boolean;
  onClose: () => void;
  activeParentId: string;
  childrenList: Child[];
  parents: ParentProfile[];
}

export const AiInputModal: React.FC<AiInputModalProps> = ({
  isOpen,
  onClose,
  activeParentId,
  childrenList,
  parents,
}) => {
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [parsedResult, setParsedResult] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);

  if (!isOpen) return null;

  const examplePrompts = [
    "Bought new shoes for Emma for $50",
    "Swapped Friday night with Mom",
    "Pack soccer cleats for Noah for Thursday",
    "Noah needs 2 puffs inhaler every morning at 8am",
    "Emma outgrew her rain jacket needs size 10",
  ];

  const handleSpeechToggle = () => {
    if (!("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  const handleParseText = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setLoading(true);
    setErrorMsg("");
    setParsedResult(null);

    try {
      const res = await fetch("/api/parse-nl", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText,
          currentParentId: activeParentId,
          children: childrenList,
          dateContext: new Date().toISOString().split("T")[0],
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Failed to process text with Gemini AI");
      }

      setParsedResult(data.result);
    } catch (err: any) {
      setErrorMsg(err.message || "An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleApplyAction = () => {
    if (!parsedResult) return;

    const cat = parsedResult.category;

    if (cat === "expense" && parsedResult.expenseData) {
      const d = parsedResult.expenseData;
      StorageEngine.addExpense({
        title: d.title || inputText,
        amount: d.amount || 25,
        paidByParentId: d.paidByParentId || activeParentId,
        date: d.date || new Date().toISOString().split("T")[0],
        category: d.category || "other",
        childId: d.childId || childrenList[0]?.id,
        splitRatio: 0.5,
        settled: false,
      });
    } else if (cat === "packing_item" && parsedResult.packingData) {
      const d = parsedResult.packingData;
      StorageEngine.addPackingItem({
        title: d.title || inputText,
        childId: d.childId || childrenList[0]?.id,
        neededForDate: d.neededForDate || new Date().toISOString().split("T")[0],
        isPacked: false,
        targetHomeId: d.targetHomeId || (activeParentId === "parent1" ? "parent2" : "parent1"),
        category: (d.category as any) || "other",
      });
    } else if (cat === "medication" && parsedResult.medicationData) {
      const d = parsedResult.medicationData;
      StorageEngine.addMedication({
        name: d.name || inputText,
        childId: d.childId || childrenList[0]?.id,
        dosage: d.dosage || "1 dose",
        timeSchedule: d.timeSchedule || "As prescribed",
        notes: d.notes || "",
        handoffConfirmed: true,
      });
    } else if (cat === "inventory_item" && parsedResult.inventoryData) {
      const d = parsedResult.inventoryData;
      StorageEngine.addInventoryItem({
        title: d.title || inputText,
        childId: d.childId || childrenList[0]?.id,
        status: (d.status as any) || "needs_replacement",
        category: (d.category as any) || "clothing",
        estimatedCost: d.estimatedCost,
        notes: d.notes,
      });
    } else if (cat === "schedule_update" && parsedResult.scheduleData) {
      const d = parsedResult.scheduleData;
      if (d.isSwapRequest) {
        StorageEngine.addSwapRequest({
          requestedByParentId: activeParentId,
          dateToSwap: d.date || new Date().toISOString().split("T")[0],
          note: inputText,
        });
      } else {
        StorageEngine.updateSchedule({
          date: d.date || new Date().toISOString().split("T")[0],
          primaryParentId: d.primaryParentId || (activeParentId === "parent1" ? "parent2" : "parent1"),
          hasHandoff: d.hasHandoff ?? true,
          handoffTime: d.handoffTime,
          handoffLocation: d.handoffLocation,
          notes: d.notes || inputText,
        });
      }
    } else if (cat === "task" && parsedResult.taskData) {
      const d = parsedResult.taskData;
      StorageEngine.addTask({
        title: d.title || inputText,
        childId: d.childId || childrenList[0]?.id,
        type: (d.type as any) || "pickup",
        time: d.time || "16:00",
        date: d.date || new Date().toISOString().split("T")[0],
        responsibleParentId: d.responsibleParentId || activeParentId,
        completed: false,
        notes: d.notes,
      });
    }

    onClose();
    setInputText("");
    setParsedResult(null);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-5 max-w-md w-full shadow-2xl flex flex-col gap-4 max-h-[90vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 text-white flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 leading-tight">AI Natural Language Assistant</h3>
              <p className="text-[11px] text-slate-400">Powered by Gemini 3.6 Flash</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleParseText} className="flex flex-col gap-3">
          <div className="relative">
            <textarea
              rows={3}
              required
              placeholder="Type or speak anything e.g. 'Bought new shoes for $50 for Emma' or 'Swapped Friday night with Mom'..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 pr-10 border border-slate-200 rounded-2xl text-xs focus:ring-2 focus:ring-indigo-500 outline-none resize-none"
            />

            {/* Mic button */}
            <button
              type="button"
              onClick={handleSpeechToggle}
              className={`absolute right-2.5 bottom-3.5 p-2 rounded-xl transition-all ${
                isListening
                  ? "bg-rose-500 text-white animate-pulse"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
              title="Voice Speech-to-text"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center justify-between gap-2">
            <button
              type="submit"
              disabled={loading || !inputText.trim()}
              className="w-full py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl text-xs font-bold shadow-xs hover:opacity-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Parsing with AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Parse Input</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Examples Chips */}
        {!parsedResult && !loading && (
          <div className="flex flex-col gap-1.5 pt-1 border-t border-slate-100">
            <span className="text-[11px] font-semibold text-slate-400">Try asking:</span>
            <div className="flex flex-wrap gap-1.5">
              {examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInputText(prompt)}
                  className="text-[11px] bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700 px-2.5 py-1 rounded-xl transition-all text-left"
                >
                  "{prompt}"
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Error message */}
        {errorMsg && (
          <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-200 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Structured Parsed Preview */}
        {parsedResult && (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-100 text-indigo-800">
                Category: {parsedResult.category}
              </span>
              <span className="text-[11px] text-slate-400">Confidence: {Math.round((parsedResult.confidence || 0.95) * 100)}%</span>
            </div>

            <p className="text-xs font-semibold text-slate-800 bg-white p-2.5 rounded-xl border border-slate-200">
              "{parsedResult.summary}"
            </p>

            <button
              onClick={handleApplyAction}
              className="w-full py-2.5 bg-emerald-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-700 transition-all flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Apply to App</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
