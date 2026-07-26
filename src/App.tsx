import React, { useState, useEffect } from "react";
import { Header } from "./components/Header";
import { CustodyScheduleView } from "./components/CustodyScheduleView";
import { DriversView } from "./components/DriversView";
import { KidsView } from "./components/KidsView";
import { PackingChecklist } from "./components/PackingChecklist";
import { MedicationTracker } from "./components/MedicationTracker";
import { SharedExpenses } from "./components/SharedExpenses";
import { InventoryTracker } from "./components/InventoryTracker";
import { CoParentChat } from "./components/CoParentChat";
import { AiInputModal } from "./components/AiInputModal";
import { PinModal } from "./components/PinModal";
import { AdminView } from "./components/AdminView";
import { StorageEngine, subscribeToStore } from "./data";
import {
  ParentProfile,
  Child,
  CustodySchedule,
  TaskOrPickup,
  PackingItem,
  Medication,
  Expense,
  InventoryItem,
  CustodySwapRequest,
  ChatMessage,
  ActivityLog,
  DriverProfile,
  DriverPickupTask,
} from "./types";
import { Calendar, Car, Sparkles, Package, Pill, DollarSign, ShoppingBag, MessageSquare, ShieldCheck } from "lucide-react";

export default function App() {
  type TabType = "schedule" | "drivers" | "kids" | "packing" | "medications" | "expenses" | "inventory" | "chat" | "admin";

  const [activeTab, setActiveTab] = useState<TabType>("schedule");
  const [activeParentId, setActiveParentId] = useState<string>("parent1"); // default to Mom
  const [selectedChildId, setSelectedChildId] = useState<string | "all">("all");
  const [isAiModalOpen, setIsAiModalOpen] = useState(false);

  // Lock and Passcode State
  const [isLocked, setIsLocked] = useState(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pendingTab, setPendingTab] = useState<TabType | null>(null);

  // Store state
  const [parents, setParents] = useState<ParentProfile[]>([]);
  const [childrenList, setChildrenList] = useState<Child[]>([]);
  const [schedules, setSchedules] = useState<CustodySchedule[]>([]);
  const [tasks, setTasks] = useState<TaskOrPickup[]>([]);
  const [packingItems, setPackingItems] = useState<PackingItem[]>([]);
  const [medications, setMedications] = useState<Medication[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [swaps, setSwaps] = useState<CustodySwapRequest[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [drivers, setDrivers] = useState<DriverProfile[]>([]);
  const [driverTasks, setDriverTasks] = useState<DriverPickupTask[]>([]);

  useEffect(() => {
    const updateFromStore = () => {
      setParents(StorageEngine.getParents());
      setChildrenList(StorageEngine.getChildren());
      setSchedules(StorageEngine.getSchedules());
      setTasks(StorageEngine.getTasks());
      setPackingItems(StorageEngine.getPackingItems());
      setMedications(StorageEngine.getMedications());
      setExpenses(StorageEngine.getExpenses());
      setInventory(StorageEngine.getInventory());
      setSwaps(StorageEngine.getSwaps());
      setChatMessages(StorageEngine.getMessages());
      setActivityLogs(StorageEngine.getLogs());
      setDrivers(StorageEngine.getDrivers());
      setDriverTasks(StorageEngine.getDriverTasks());
    };

    updateFromStore();
    return subscribeToStore(updateFromStore);
  }, []);

  // Tab switching with PIN protection
  const handleTabClick = (targetTab: TabType) => {
    if (activeTab === targetTab) return;

    // If app is currently locked or switching away from Kids/Drivers view when lock is active
    if (isLocked) {
      setPendingTab(targetTab);
      setIsPinModalOpen(true);
    } else {
      setActiveTab(targetTab);
    }
  };

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    setIsLocked(false);
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
  };

  const handleToggleLock = () => {
    if (isLocked) {
      // Prompt PIN to unlock
      setPendingTab(null);
      setIsPinModalOpen(true);
    } else {
      // Lock screen
      setIsLocked(true);
    }
  };

  const handleLockKidsMode = () => {
    setActiveTab("kids");
    setIsLocked(true);
  };

  const handleLockDriverMode = (driverId: string) => {
    setActiveTab("drivers");
    setIsLocked(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-indigo-500 selection:text-white" dir="rtl">
      {/* Top Header (or Locked Banner) */}
      {!isLocked ? (
        <Header
          parents={parents}
          activeParentId={activeParentId}
          onSelectParent={(id) => setActiveParentId(id)}
          childrenList={childrenList}
          selectedChildId={selectedChildId}
          onSelectChild={(id) => setSelectedChildId(id)}
          onOpenAiModal={() => setIsAiModalOpen(true)}
          onToggleLock={handleToggleLock}
          isLocked={isLocked}
        />
      ) : (
        <div className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between sticky top-0 z-50 border-b border-slate-800 shadow-md">
          <div className="flex items-center gap-2 text-xs font-black">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>מצב נעול מוגן: {activeTab === "kids" ? "מסך ילדים 🎈" : "מסך נהגים 🚘"}</span>
          </div>
          <button
            onClick={handleToggleLock}
            className="flex items-center gap-1 px-3 py-1 bg-amber-400 text-slate-950 rounded-xl text-xs font-black shadow-xs hover:bg-amber-300 transition-all active:scale-95"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>🔓 יציאה בקוד אדמין</span>
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-lg mx-auto w-full px-4 pt-4">
        {activeTab === "schedule" && (
          <CustodyScheduleView
            schedules={schedules}
            tasks={tasks}
            parents={parents}
            childrenList={childrenList}
            activeParentId={activeParentId}
            selectedChildId={selectedChildId}
            swaps={swaps}
          />
        )}

        {activeTab === "drivers" && (
          <DriversView
            drivers={drivers}
            driverTasks={driverTasks}
            childrenList={childrenList}
            parents={parents}
            activeParentId={activeParentId}
            onLockDriverMode={handleLockDriverMode}
            isLockedInDriverMode={isLocked}
          />
        )}

        {activeTab === "kids" && (
          <KidsView
            childrenList={childrenList}
            parents={parents}
            schedules={schedules}
            tasks={tasks}
            packingItems={packingItems}
            drivers={drivers}
            driverTasks={driverTasks}
            onLockKidsMode={handleLockKidsMode}
            isLockedInKidsMode={isLocked}
          />
        )}

        {activeTab === "packing" && (
          <PackingChecklist
            items={packingItems}
            childrenList={childrenList}
            parents={parents}
            selectedChildId={selectedChildId}
          />
        )}

        {activeTab === "medications" && (
          <MedicationTracker
            medications={medications}
            childrenList={childrenList}
            parents={parents}
            activeParentId={activeParentId}
            selectedChildId={selectedChildId}
          />
        )}

        {activeTab === "expenses" && (
          <SharedExpenses
            expenses={expenses}
            childrenList={childrenList}
            parents={parents}
            activeParentId={activeParentId}
            selectedChildId={selectedChildId}
          />
        )}

        {activeTab === "inventory" && (
          <InventoryTracker
            inventory={inventory}
            childrenList={childrenList}
            selectedChildId={selectedChildId}
          />
        )}

        {activeTab === "chat" && (
          <CoParentChat
            messages={chatMessages}
            logs={activityLogs}
            parents={parents}
            activeParentId={activeParentId}
          />
        )}

        {activeTab === "admin" && (
          <AdminView
            childrenList={childrenList}
            parents={parents}
            drivers={drivers}
          />
        )}
      </main>

      {/* AI Natural Language Processing Modal */}
      <AiInputModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        activeParentId={activeParentId}
        childrenList={childrenList}
        parents={parents}
      />

      {/* Passcode Protection Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingTab(null);
        }}
        onSuccess={handlePinSuccess}
        title={isLocked ? "אימות קוד PIN לשחרור נעילה" : "אימות קוד PIN לשינוי לשונית"}
        description="הזן קוד PIN בעל 4 ספרות לעבור לשונית (קוד ברירת מחדל: 1234)"
      />

      {/* Mobile-first Floating Navigation Bar */}
      {!isLocked ? (
        <nav className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200/80 z-40 px-1 py-1.5 shadow-lg">
          <div className="max-w-lg mx-auto flex items-center justify-between px-1">
            {/* Schedule */}
            <button
              onClick={() => handleTabClick("schedule")}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-2xl transition-all ${
                activeTab === "schedule"
                  ? "text-indigo-600 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <Calendar className="w-5 h-5" />
              <span className="text-[10px]">לו"ז</span>
            </button>

            {/* Drivers */}
            <button
              onClick={() => handleTabClick("drivers")}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-2xl transition-all relative ${
                activeTab === "drivers"
                  ? "text-orange-600 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <Car className="w-5 h-5" />
              <span className="text-[10px]">נהגים</span>
              {driverTasks.filter((t) => !t.completed).length > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-orange-500" />
              )}
            </button>

            {/* Kids Mode */}
            <button
              onClick={() => handleTabClick("kids")}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-2xl transition-all relative ${
                activeTab === "kids"
                  ? "text-purple-600 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <Sparkles className="w-5 h-5 text-purple-600" />
              <span className="text-[10px] font-bold text-purple-700">ילדים 🎈</span>
            </button>

            {/* Packing */}
            <button
              onClick={() => handleTabClick("packing")}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-2xl transition-all relative ${
                activeTab === "packing"
                  ? "text-emerald-600 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <Package className="w-5 h-5" />
              <span className="text-[10px]">תיקים</span>
              {packingItems.filter((i) => !i.isPacked).length > 0 && (
                <span className="absolute top-1 right-2 w-2 h-2 rounded-full bg-emerald-500" />
              )}
            </button>

            {/* Meds */}
            <button
              onClick={() => handleTabClick("medications")}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-2xl transition-all relative ${
                activeTab === "medications"
                  ? "text-rose-600 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <Pill className="w-5 h-5" />
              <span className="text-[10px]">תרופות</span>
            </button>

            {/* Expenses */}
            <button
              onClick={() => handleTabClick("expenses")}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-2xl transition-all ${
                activeTab === "expenses"
                  ? "text-blue-600 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <DollarSign className="w-5 h-5" />
              <span className="text-[10px]">הוצאות</span>
            </button>

            {/* Inventory */}
            <button
              onClick={() => handleTabClick("inventory")}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-2xl transition-all relative ${
                activeTab === "inventory"
                  ? "text-amber-600 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <ShoppingBag className="w-5 h-5" />
              <span className="text-[10px]">מידות</span>
            </button>

            {/* Chat */}
            <button
              onClick={() => handleTabClick("chat")}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-2xl transition-all ${
                activeTab === "chat"
                  ? "text-indigo-600 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <MessageSquare className="w-5 h-5" />
              <span className="text-[10px]">צ'אט</span>
            </button>

            {/* Admin */}
            <button
              onClick={() => handleTabClick("admin")}
              className={`flex flex-col items-center gap-0.5 p-1.5 rounded-2xl transition-all ${
                activeTab === "admin"
                  ? "text-indigo-950 font-bold scale-105"
                  : "text-slate-400 hover:text-slate-600 font-medium"
              }`}
            >
              <ShieldCheck className="w-5 h-5 text-indigo-700" />
              <span className="text-[10px] font-bold text-indigo-900">אדמין</span>
            </button>
          </div>
        </nav>
      ) : (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900/95 backdrop-blur-md text-white border-t border-slate-800 p-3 z-40 text-center flex items-center justify-between px-6 shadow-2xl">
          <span className="text-xs font-bold text-slate-300">🔒 תצוגת קיוסק נעולה להגנה על הפרטיות</span>
          <button
            onClick={handleToggleLock}
            className="px-3 py-1.5 bg-amber-400 text-slate-950 font-black rounded-xl text-xs shadow-xs hover:bg-amber-300"
          >
            יציאה בקוד אדמין 🔓
          </button>
        </div>
      )}
    </div>
  );
}
