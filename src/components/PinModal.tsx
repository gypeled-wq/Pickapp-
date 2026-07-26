import React, { useState } from "react";
import { Lock, Unlock, KeyRound, Check, AlertCircle, Delete } from "lucide-react";
import { StorageEngine } from "../data";

interface PinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  title?: string;
  description?: string;
}

export const PinModal: React.FC<PinModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title = "אימות קוד גישה לנעילה",
  description = "הזן קוד PIN בעל 4 ספרות לעבור לשונית (קוד ברירת מחדל: 1234)",
}) => {
  const [inputPin, setInputPin] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState("");

  if (!isOpen) return null;

  const currentPin = StorageEngine.getPinCode() || "1234";

  const handleKeyPress = (num: string) => {
    setErrorMsg("");
    if (inputPin.length < 4) {
      const updated = inputPin + num;
      setInputPin(updated);
      if (updated.length === 4) {
        if (updated === currentPin) {
          setErrorMsg("");
          setInputPin("");
          onSuccess();
        } else {
          setErrorMsg("קוד שגוי, נסה שוב (ברירת מחדל: 1234)");
          setInputPin("");
        }
      }
    }
  };

  const handleDelete = () => {
    setInputPin((prev) => prev.slice(0, -1));
    setErrorMsg("");
  };

  const handleSaveNewPin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.length === 4) {
      StorageEngine.setPinCode(newPin);
      setIsChangingPin(false);
      setNewPin("");
      setErrorMsg("");
      alert("קוד ה-PIN עודכן בהצלחה!");
    } else {
      setErrorMsg("קוד חייב להכיל בדיוק 4 ספרות");
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-3xl p-6 w-full max-w-xs shadow-2xl border border-slate-100 text-center space-y-4 animate-in fade-in zoom-in-95 duration-150">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto text-xl shadow-xs">
          <Lock className="w-6 h-6 text-indigo-600" />
        </div>

        <div>
          <h3 className="text-base font-extrabold text-slate-800">{title}</h3>
          <p className="text-xs text-slate-500 mt-1">{description}</p>
        </div>

        {/* PIN Dots Display */}
        <div className="flex items-center justify-center gap-3 py-2">
          {[0, 1, 2, 3].map((idx) => {
            const filled = inputPin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full transition-all border ${
                  filled ? "bg-indigo-600 border-indigo-600 scale-110" : "bg-slate-100 border-slate-300"
                }`}
              />
            );
          })}
        </div>

        {errorMsg && (
          <p className="text-xs font-bold text-rose-600 bg-rose-50 p-2 rounded-xl border border-rose-100 flex items-center justify-center gap-1">
            <AlertCircle className="w-3.5 h-3.5" />
            {errorMsg}
          </p>
        )}

        {/* Keypad */}
        {!isChangingPin ? (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map((num) => (
              <button
                key={num}
                onClick={() => handleKeyPress(num)}
                className="h-12 rounded-2xl bg-slate-50 text-slate-800 text-lg font-bold hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all shadow-2xs"
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => setIsChangingPin(true)}
              className="h-12 rounded-2xl bg-slate-50 text-slate-400 hover:text-slate-600 text-xs font-semibold flex items-center justify-center"
              title="שנה קוד"
            >
              <KeyRound className="w-4 h-4" />
            </button>
            <button
              onClick={() => handleKeyPress("0")}
              className="h-12 rounded-2xl bg-slate-50 text-slate-800 text-lg font-bold hover:bg-indigo-50 hover:text-indigo-600 active:scale-95 transition-all shadow-2xs"
            >
              0
            </button>
            <button
              onClick={handleDelete}
              className="h-12 rounded-2xl bg-slate-50 text-slate-500 hover:text-rose-600 hover:bg-rose-50 flex items-center justify-center transition-all shadow-2xs"
            >
              <Delete className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <form onSubmit={handleSaveNewPin} className="space-y-3 text-xs pt-2">
            <p className="font-bold text-slate-700">הגדרת קוד PIN חדש (4 ספרות):</p>
            <input
              type="password"
              maxLength={4}
              placeholder="1234"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              className="w-full text-center text-lg font-bold tracking-widest p-2.5 rounded-xl border border-slate-200 bg-slate-50"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                className="flex-1 bg-indigo-600 text-white p-2 rounded-xl font-bold hover:bg-indigo-700"
              >
                שמור קוד
              </button>
              <button
                type="button"
                onClick={() => setIsChangingPin(false)}
                className="px-3 bg-slate-100 text-slate-600 p-2 rounded-xl font-semibold"
              >
                חזור
              </button>
            </div>
          </form>
        )}

        <div className="pt-2 border-t flex justify-center">
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-slate-600 font-semibold"
          >
            ביטול
          </button>
        </div>
      </div>
    </div>
  );
};
