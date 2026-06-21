/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { Driver } from "../types";
import { StorageEngine, subscribeToStore } from "../data";
import { User, Phone, Car, Plus, Trash2, Check, Star, RefreshCcw, Bell, Shield, ShieldAlert, X } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function DriverLibrary() {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [isAdding, setIsAdding] = useState(false);

  // מצבי טופס
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [vehicleInfo, setVehicleInfo] = useState("");
  const [type, setType] = useState<"permanent" | "guest">("guest");
  const [reminderOptIn, setReminderOptIn] = useState(true);

  // שדה חיפוש
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setDrivers(StorageEngine.getDrivers());
    return subscribeToStore(() => {
      setDrivers(StorageEngine.getDrivers());
    });
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    StorageEngine.addDriver({
      name,
      phone,
      vehicleInfo,
      type,
      reminderOptIn,
    });

    // איפוס
    setName("");
    setPhone("");
    setVehicleInfo("");
    setType("guest");
    setReminderOptIn(true);
    setIsAdding(false);
  };

  const handleDelete = (id: string, name: string) => {
    if (confirm(`האם למחוק את הנהג/ת "${name}" מספריית הנהגים?`)) {
      StorageEngine.deleteDriver(id);
    }
  };

  const toggleReminder = (driver: Driver) => {
    StorageEngine.updateDriver({
      ...driver,
      reminderOptIn: !driver.reminderOptIn,
    });
    StorageEngine.addLog(
      "שינוי הגדרות תזכורת",
      `התראה שעה לפני שונתה ל-${!driver.reminderOptIn ? "פעיל" : "כבוי"} עבור ${driver.name}`,
      "parent"
    );
  };

  const filteredDrivers = drivers.filter(
    (d) =>
      d.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.phone.includes(searchQuery) ||
      d.vehicleInfo.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-[#E4E3E0] border-4 border-[#141414] tech-shadow p-6" id="driver_library_section">
      <div className="flex justify-between items-center mb-6 flex-row-reverse">
        <div>
          <h3 className="text-xl font-black text-[#141414] font-serif uppercase italic">ספריית נהגים ומלווים</h3>
          <p className="text-xs text-slate-700 mt-1 font-mono uppercase">נהגים קבועים ואורחים המורשים לאיסוף הילדים / DRIVERS</p>
        </div>
        {!isAdding && (
          <button
            onClick={() => setIsAdding(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 border-2 border-[#141414] bg-white hover:bg-[#141414] hover:text-white text-xs font-black transition-all cursor-pointer shadow-[2px_2px_0_0_#141414] flex-row-reverse"
            id="btn_add_driver_open"
          >
            <Plus className="w-4 h-4" />
            <span>הוספת נהג חדש</span>
          </button>
        )}
      </div>

      {/* אזור הוספת נהג חדש */}
      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-6 bg-white border-2 border-[#141414]"
            id="add_driver_form_panel"
          >
            <form onSubmit={handleSubmit} className="p-4 space-y-4 text-right">
              <div className="flex justify-between items-center mb-2 flex-row-reverse border-b-2 border-[#141414] pb-2">
                <span className="font-bold text-[#141414] text-sm">כרטיס נהג/ת חדש במערכת</span>
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="text-slate-700 hover:text-black p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">שם מלא *</label>
                  <input
                    type="text"
                    required
                    placeholder="למשל: דוד הנהג / נטלי אמא"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full text-sm px-3 py-2 border-2 border-[#141414] focus:outline-none bg-white placeholder-slate-500 text-right font-mono"
                    id="input_driver_name"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-800 block">מספר טלפון *</label>
                  <input
                    type="tel"
                    required
                    placeholder="למשל: 054-000-0000"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full text-sm px-3 py-2 border-2 border-[#141414] focus:outline-none bg-white placeholder-slate-500 text-left font-mono"
                    style={{ direction: "ltr" }}
                    id="input_driver_phone"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-800 block">פרטי הרכב (זיהוי קל לילד)</label>
                <input
                  type="text"
                  placeholder="למשל: קיה ספורטאז׳ שחורה, מס׳ רכב או סימן מזהה"
                  value={vehicleInfo}
                  onChange={(e) => setVehicleInfo(e.target.value)}
                  className="w-full text-sm px-3 py-2 border-2 border-[#141414] focus:outline-none bg-white placeholder-slate-500 text-right font-mono"
                  id="input_driver_vehicle"
                />
              </div>

              <div className="flex flex-wrap gap-6 items-center flex-row-reverse pt-2">
                {/* סווג נהג */}
                <div className="flex items-center gap-4 flex-row-reverse">
                  <span className="text-xs font-bold text-slate-700">סיווג הנהג:</span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800 flex-row-reverse">
                    <input
                      type="radio"
                      name="driver_type"
                      checked={type === "permanent"}
                      onChange={() => setType("permanent")}
                      className="text-black accent-black h-4 w-4"
                    />
                    <span>נהג קבוע (משפחה/צהרון)</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer text-xs font-bold text-slate-800 flex-row-reverse">
                    <input
                      type="radio"
                      name="driver_type"
                      checked={type === "guest"}
                      onChange={() => setType("guest")}
                      className="text-black accent-black h-4 w-4"
                    />
                    <span>נהג אורח (קארפול/מזדמן)</span>
                  </label>
                </div>

                {/* תזכורות אוטומטיות */}
                <div className="flex items-center gap-2 flex-row-reverse">
                  <input
                    type="checkbox"
                    id="opt_in_reminder"
                    checked={reminderOptIn}
                    onChange={(e) => setReminderOptIn(e.target.checked)}
                    className="rounded text-black accent-black h-4 w-4 border-[#141414]"
                  />
                  <label htmlFor="opt_in_reminder" className="text-xs font-bold text-slate-700 cursor-pointer user-select-none">
                    קבלת תזכורת אוטו׳ כשעה לפני האיסוף
                  </label>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  className="px-3.5 py-2 border-2 border-[#141414] bg-[#D1D0CC] hover:bg-slate-300 text-black text-xs font-black cursor-pointer transition-colors"
                >
                  ביטול / CANCEL
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 border-2 border-[#141414] bg-white text-[#141414] hover:bg-[#141414] hover:text-white text-xs font-black cursor-pointer transition-colors"
                  id="btn_submit_new_driver"
                >
                  שמור נהג בספרייה
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* שדה חיפוש נהג */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="חיפוש מהיר של נהג לפי שם, טלפון או פרטי רכב..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full text-xs px-3.5 py-2.5 border-2 border-[#141414] focus:outline-none bg-white placeholder-slate-500 text-right font-mono"
        />
      </div>

      {/* רשימת הנהגים */}
      <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
        {filteredDrivers.length === 0 ? (
          <div className="py-8 text-center text-slate-600 border-2 border-dashed border-[#141414] bg-white">
            <p className="text-xs font-bold">לא נמצאו נהגים התואמים את החיפוש</p>
          </div>
        ) : (
          filteredDrivers.map((driver) => (
            <div
              key={driver.id}
              className="p-3.5 border-2 border-[#141414] bg-white transition-all flex justify-between items-center gap-4 flex-row-reverse shadow-[2px_2px_0_0_#141414]"
            >
              <div className="flex items-start gap-3 flex-row-reverse text-right">
                <div className={`p-2.5 border border-[#141414] bg-[#D1D0CC] text-[#141414]`}>
                  <User className="w-5 h-5 animate-pulse-slow" />
                </div>
                <div>
                  <div className="flex items-center gap-3 flex-row-reverse">
                    <span className="font-bold text-slate-900 text-sm italic font-serif">{driver.name}</span>
                    <span
                      className={`text-[10px] px-2 py-0.5 border border-[#141414] font-mono font-bold ${
                        driver.type === "permanent"
                          ? "bg-[#141414] text-[#E4E3E0]"
                          : "bg-white text-[#141414]"
                      }`}
                    >
                      {driver.type === "permanent" ? "קבוע" : "אורח"}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1 mt-1">
                    <span className="text-xs text-slate-700 flex items-center gap-1 flex-row-reverse align-middle font-mono">
                      <Phone className="w-3.5 h-3.5" />
                      <a href={`tel:${driver.phone}`} className="hover:text-black ltr hover:underline font-bold">
                        {driver.phone}
                      </a>
                    </span>
                    {driver.vehicleInfo && (
                      <span className="text-xs text-slate-600 flex items-center gap-1 flex-row-reverse font-mono">
                        <Car className="w-3.5 h-3.5" />
                        <span>{driver.vehicleInfo}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* כפתורי ניהול */}
              <div className="flex items-center gap-2 flex-row-reverse">
                <button
                  onClick={() => toggleReminder(driver)}
                  className={`p-1.5 border transition-all cursor-pointer flex items-center gap-1 ${
                    driver.reminderOptIn
                      ? "bg-emerald-100 text-emerald-800 border-emerald-600 font-bold"
                      : "bg-[#D1D0CC] text-slate-600 border-[#141414]"
                  }`}
                  title={driver.reminderOptIn ? "תזכורת אוטומטית שעה לפני פעילה!" : "עדיין לא מוגדרת תזכורת"}
                >
                  <Bell className="w-4 h-4" />
                  <span className="text-[10px] font-mono uppercase hidden sm:inline">
                    {driver.reminderOptIn ? "REMIND: ON" : "REMIND: OFF"}
                  </span>
                </button>

                {/* הגנה על הורים קבועים ממחיקה מקרית */}
                {driver.id !== "drv_papa" && driver.id !== "drv_mama" ? (
                  <button
                    onClick={() => handleDelete(driver.id, driver.name)}
                    className="p-1.5 text-slate-600 hover:text-red-700 hover:bg-red-50 border border-transparent hover:border-[#141414] transition-colors cursor-pointer"
                    title="מחק נהג"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <span className="text-[10px] text-[#141414] bg-[#D1D0CC] border border-[#141414] px-1.5 py-0.5 font-bold whitespace-nowrap font-mono">
                    ADMIN
                  </span>
                )}
              </div>
            </div>
          )))}
      </div>
    </div>
  );
}
