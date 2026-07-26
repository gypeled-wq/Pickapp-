/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  Child,
  ParentProfile,
  CustodySchedule,
  TaskOrPickup,
  PackingItem,
  Medication,
  Expense,
  InventoryItem,
  CustodySwapRequest,
  ActivityLog,
  ChatMessage,
  DriverProfile,
  DriverPickupTask,
  DEFAULT_PARENTS,
  DEFAULT_CHILDREN,
  DEFAULT_DRIVERS,
  DEFAULT_PIN,
} from "./types";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// Initial Mock Data
const INITIAL_CHILDREN: Child[] = DEFAULT_CHILDREN;

const INITIAL_PARENTS: ParentProfile[] = DEFAULT_PARENTS;

const INITIAL_DRIVERS: DriverProfile[] = DEFAULT_DRIVERS;

const INITIAL_DRIVER_TASKS: DriverPickupTask[] = [
  {
    id: "dtask_1",
    driverId: "driver1", // Grandpa Eli
    childId: "child1", // Emma
    type: "pickup",
    date: new Date().toISOString().split("T")[0],
    time: "16:00",
    location: "בית ספר יסודי - שער ראשי",
    destination: "חוג ספורט - מגרש קהילתי",
    completed: false,
    notes: "לתת לה בקבוק מים מהאוטו",
    assignedByParentId: "parent1",
  },
  {
    id: "dtask_2",
    driverId: "driver2", // Dana Babysitter
    childId: "child2", // Noah
    type: "pickup",
    date: new Date().toISOString().split("T")[0],
    time: "15:45",
    location: "גן חובה - רחוב האורנים",
    destination: "בית אבא (דוד)",
    completed: true,
    notes: "לוודא שיש לו את הכינור",
    assignedByParentId: "parent2",
  },
  {
    id: "dtask_3",
    driverId: "driver3", // Yosef Driver
    childId: "all",
    type: "dropoff",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    time: "08:00",
    location: "בית אמא (שרה)",
    destination: "מסגרות לימוד",
    completed: false,
    notes: "להוריד את אמה ראשונה בשער בית הספר",
    assignedByParentId: "parent1",
  },
];

// Generate 14 days of default custody schedules (Alternating Week Rotation)
function generateInitialSchedules(): CustodySchedule[] {
  const schedules: CustodySchedule[] = [];
  const today = new Date();
  
  for (let i = -3; i < 11; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    const dateStr = d.toISOString().split("T")[0];
    const dayOfWeek = d.getDay(); // 0 = Sun, 1 = Mon ... 6 = Sat
    
    // Rotation logic: Mon-Wed Mom, Thu-Sat Dad (alternating Sundays)
    let primaryParentId = "parent1"; // Mom
    if (dayOfWeek === 4 || dayOfWeek === 5 || dayOfWeek === 6) {
      primaryParentId = "parent2"; // Dad
    } else if (dayOfWeek === 0) {
      // Alternate Sunday based on week number
      const weekNum = Math.floor(d.getDate() / 7);
      primaryParentId = weekNum % 2 === 0 ? "parent1" : "parent2";
    }

    const hasHandoff = dayOfWeek === 4 || dayOfWeek === 0; // Handoff on Thu & Sun
    schedules.push({
      id: `sched_${dateStr}`,
      date: dateStr,
      primaryParentId,
      hasHandoff,
      handoffTime: hasHandoff ? "17:00" : undefined,
      handoffLocation: hasHandoff ? "School Gate & Park" : undefined,
      notes: hasHandoff ? "Bring transition backpack & medications" : undefined,
    });
  }
  return schedules;
}

const INITIAL_SCHEDULES = generateInitialSchedules();

const INITIAL_TASKS: TaskOrPickup[] = [
  {
    id: "task_1",
    title: "Pickup Emma from Soccer Practice",
    childId: "child1",
    type: "pickup",
    time: "16:30",
    date: new Date().toISOString().split("T")[0],
    responsibleParentId: "parent1",
    location: "Oakwood Community Turf",
    completed: false,
    notes: "Remember sports bottle and cleats",
  },
  {
    id: "task_2",
    title: "Dropoff Noah at Violin Class",
    childId: "child2",
    type: "dropoff",
    time: "15:15",
    date: new Date().toISOString().split("T")[0],
    responsibleParentId: "parent1",
    location: "Harmony Music School",
    completed: true,
    notes: "Bring sheet music folder",
  },
  {
    id: "task_3",
    title: "Evening Handoff at School Gate",
    childId: "child1",
    type: "activity",
    time: "17:30",
    date: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    responsibleParentId: "parent2",
    location: "Main Gate",
    completed: false,
    notes: "Dad takes kids for weekend",
  },
];

const INITIAL_PACKING: PackingItem[] = [
  {
    id: "pack_1",
    title: "Soccer Cleats & Shin Guards",
    childId: "child1",
    neededForDate: new Date().toISOString().split("T")[0],
    isPacked: true,
    targetHomeId: "parent2",
    category: "sports",
  },
  {
    id: "pack_2",
    title: "Violin & Sheet Music Folder",
    childId: "child2",
    neededForDate: new Date().toISOString().split("T")[0],
    isPacked: false,
    targetHomeId: "parent1",
    category: "instrument",
  },
  {
    id: "pack_3",
    title: "Asthma Inhaler & Chamber",
    childId: "child2",
    neededForDate: new Date().toISOString().split("T")[0],
    isPacked: true,
    targetHomeId: "parent2",
    category: "other",
  },
  {
    id: "pack_4",
    title: "Math Homework Workbook",
    childId: "child1",
    neededForDate: new Date(Date.now() + 86400000).toISOString().split("T")[0],
    isPacked: false,
    targetHomeId: "parent2",
    category: "school",
  },
];

const INITIAL_MEDICATIONS: Medication[] = [
  {
    id: "med_1",
    childId: "child2",
    name: "Ventolin Inhaler",
    dosage: "2 puffs twice daily before sports",
    timeSchedule: "Morning 08:00 & Evening 18:00",
    notes: "Keep in backpack during transitions. Administer if coughing.",
    lastAdministered: new Date(Date.now() - 3600000 * 4).toISOString(),
    lastAdministeredBy: "parent1",
    handoffConfirmed: true,
  },
  {
    id: "med_2",
    childId: "child1",
    name: "Multivitamin Gummies",
    dosage: "1 gummy with breakfast",
    timeSchedule: "Daily with breakfast",
    notes: "Cherry flavor",
    lastAdministered: new Date(Date.now() - 3600000 * 24).toISOString(),
    lastAdministeredBy: "parent1",
    handoffConfirmed: true,
  },
];

const INITIAL_EXPENSES: Expense[] = [
  {
    id: "exp_1",
    title: "Emma's Fall Soccer Registration",
    amount: 140,
    paidByParentId: "parent1",
    date: new Date(Date.now() - 86400000 * 2).toISOString().split("T")[0],
    category: "activities",
    childId: "child1",
    splitRatio: 0.5,
    settled: false,
    notes: "Includes uniform kit",
  },
  {
    id: "exp_2",
    title: "Noah's Violin Lesson Books",
    amount: 45,
    paidByParentId: "parent2",
    date: new Date(Date.now() - 86400000 * 4).toISOString().split("T")[0],
    category: "school",
    childId: "child2",
    splitRatio: 0.5,
    settled: false,
    notes: "Suzuki Method Book 2",
  },
  {
    id: "exp_3",
    title: "Pediatric Orthodontist Checkup",
    amount: 90,
    paidByParentId: "parent1",
    date: new Date(Date.now() - 86400000 * 7).toISOString().split("T")[0],
    category: "medical",
    childId: "child1",
    splitRatio: 0.5,
    settled: true,
    notes: "Co-pay settled via Zelle",
  },
];

const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "inv_1",
    title: "New Soccer Cleats (Size 34 EU)",
    childId: "child1",
    status: "needs_replacement",
    category: "shoes",
    estimatedCost: 65,
    notes: "Current cleats are pinching toes. Size needed: 34 EU.",
  },
  {
    id: "inv_2",
    title: "Winter Waterproof Jacket (Size 8)",
    childId: "child2",
    status: "needs_replacement",
    category: "clothing",
    estimatedCost: 80,
    notes: "Zipper is broken on blue jacket.",
  },
  {
    id: "inv_3",
    title: "School Backpack with Padded Straps",
    childId: "child1",
    status: "good",
    category: "school_supplies",
    estimatedCost: 40,
    notes: "In good condition at Mom's house.",
  },
  {
    id: "inv_4",
    title: "Violin Shoulder Rest",
    childId: "child2",
    status: "replaced",
    category: "gear",
    estimatedCost: 25,
    notes: "Bought new Kun shoulder rest last week.",
  },
];

const INITIAL_SWAPS: CustodySwapRequest[] = [
  {
    id: "swap_1",
    requestedByParentId: "parent2",
    dateToSwap: new Date(Date.now() + 86400000 * 3).toISOString().split("T")[0],
    proposedSubstituteDate: new Date(Date.now() + 86400000 * 5).toISOString().split("T")[0],
    status: "pending",
    note: "Would like to swap Friday for Sunday so I can take kids to granddad's birthday.",
    createdAt: new Date().toISOString(),
  },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: "log_1",
    timestamp: new Date().toISOString(),
    action: "System Initialization",
    details: "NestFlow Co-Parenting Engine booted successfully.",
    userRole: "system",
  },
];

const KEYS = {
  CHILDREN: "nestflow_children_v1",
  PARENTS: "nestflow_parents_v1",
  SCHEDULES: "nestflow_schedules_v1",
  TASKS: "nestflow_tasks_v1",
  PACKING: "nestflow_packing_v1",
  MEDICATIONS: "nestflow_medications_v1",
  EXPENSES: "nestflow_expenses_v1",
  INVENTORY: "nestflow_inventory_v1",
  SWAPS: "nestflow_swaps_v1",
  LOGS: "nestflow_logs_v1",
  MESSAGES: "nestflow_messages_v1",
  DRIVERS: "nestflow_drivers_v1",
  DRIVER_TASKS: "nestflow_driver_tasks_v1",
  PIN_CODE: "nestflow_pin_code_v1",
};

export function loadData<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error loading key ${key}:`, err);
    return initial;
  }
}

export function saveData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("local-storage-sync", { detail: { key, data } }));
  } catch (err) {
    console.error(`Error saving key ${key}:`, err);
  }
}

const listeners: Set<() => void> = new Set();

export function subscribeToStore(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function notifyAll() {
  listeners.forEach((l) => l());
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (Object.values(KEYS).includes(e.key || "")) {
      notifyAll();
    }
  });
  window.addEventListener("local-storage-sync", () => {
    notifyAll();
  });
}

// Current In-Memory Cache
let currentChildren: Child[] = loadData(KEYS.CHILDREN, INITIAL_CHILDREN);
let currentParents: ParentProfile[] = loadData(KEYS.PARENTS, INITIAL_PARENTS);
let currentSchedules: CustodySchedule[] = loadData(KEYS.SCHEDULES, INITIAL_SCHEDULES);
let currentTasks: TaskOrPickup[] = loadData(KEYS.TASKS, INITIAL_TASKS);
let currentPacking: PackingItem[] = loadData(KEYS.PACKING, INITIAL_PACKING);
let currentMedications: Medication[] = loadData(KEYS.MEDICATIONS, INITIAL_MEDICATIONS);
let currentExpenses: Expense[] = loadData(KEYS.EXPENSES, INITIAL_EXPENSES);
let currentInventory: InventoryItem[] = loadData(KEYS.INVENTORY, INITIAL_INVENTORY);
let currentSwaps: CustodySwapRequest[] = loadData(KEYS.SWAPS, INITIAL_SWAPS);
let currentLogs: ActivityLog[] = loadData(KEYS.LOGS, INITIAL_LOGS);
let currentMessages: ChatMessage[] = loadData(KEYS.MESSAGES, []);
let currentDrivers: DriverProfile[] = loadData(KEYS.DRIVERS, INITIAL_DRIVERS);
let currentDriverTasks: DriverPickupTask[] = loadData(KEYS.DRIVER_TASKS, INITIAL_DRIVER_TASKS);
let currentPinCode: string = loadData(KEYS.PIN_CODE, DEFAULT_PIN);

function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) return obj.map((item) => cleanForFirestore(item));
  if (typeof obj === "object") {
    const cleaned: any = {};
    for (const key of Object.keys(obj)) {
      const val = obj[key];
      if (val !== undefined) {
        cleaned[key] = cleanForFirestore(val);
      }
    }
    return cleaned;
  }
  return obj;
}

async function syncCollection<T extends { id?: string }>(colName: string, items: T[], defaultItems: T[]) {
  try {
    const colRef = collection(db, colName);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      const seedItems = items && items.length > 0 ? items : defaultItems;
      for (const item of seedItems) {
        const id = item.id || `doc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
        await setDoc(doc(db, colName, id), cleanForFirestore({ ...item, id }));
      }
    }
  } catch (err) {
    console.warn(`Firestore sync warning for ${colName}:`, err);
  }
}

async function startFirebaseSync() {
  await syncCollection("children", currentChildren, INITIAL_CHILDREN);
  await syncCollection("parents", currentParents, INITIAL_PARENTS);
  await syncCollection("schedules", currentSchedules, INITIAL_SCHEDULES);
  await syncCollection("tasks", currentTasks, INITIAL_TASKS);
  await syncCollection("packing", currentPacking, INITIAL_PACKING);
  await syncCollection("medications", currentMedications, INITIAL_MEDICATIONS);
  await syncCollection("expenses", currentExpenses, INITIAL_EXPENSES);
  await syncCollection("inventory", currentInventory, INITIAL_INVENTORY);
  await syncCollection("swaps", currentSwaps, INITIAL_SWAPS);
  await syncCollection("messages", currentMessages, []);
  await syncCollection("drivers", currentDrivers, INITIAL_DRIVERS);
  await syncCollection("driverTasks", currentDriverTasks, INITIAL_DRIVER_TASKS);

  // Real-time Firestore Listeners
  onSnapshot(collection(db, "schedules"), (snap) => {
    const list: CustodySchedule[] = [];
    snap.forEach((d) => list.push(d.data() as CustodySchedule));
    if (list.length > 0) {
      currentSchedules = list;
      saveData(KEYS.SCHEDULES, list);
      notifyAll();
    }
  }, (err) => console.warn("Firestore schedules snapshot error:", err));

  onSnapshot(collection(db, "tasks"), (snap) => {
    const list: TaskOrPickup[] = [];
    snap.forEach((d) => list.push(d.data() as TaskOrPickup));
    if (list.length > 0) {
      currentTasks = list;
      saveData(KEYS.TASKS, list);
      notifyAll();
    }
  }, (err) => console.warn("Firestore tasks snapshot error:", err));

  onSnapshot(collection(db, "packing"), (snap) => {
    const list: PackingItem[] = [];
    snap.forEach((d) => list.push(d.data() as PackingItem));
    if (list.length > 0) {
      currentPacking = list;
      saveData(KEYS.PACKING, list);
      notifyAll();
    }
  }, (err) => console.warn("Firestore packing snapshot error:", err));

  onSnapshot(collection(db, "medications"), (snap) => {
    const list: Medication[] = [];
    snap.forEach((d) => list.push(d.data() as Medication));
    if (list.length > 0) {
      currentMedications = list;
      saveData(KEYS.MEDICATIONS, list);
      notifyAll();
    }
  }, (err) => console.warn("Firestore medications snapshot error:", err));

  onSnapshot(collection(db, "expenses"), (snap) => {
    const list: Expense[] = [];
    snap.forEach((d) => list.push(d.data() as Expense));
    if (list.length > 0) {
      currentExpenses = list;
      saveData(KEYS.EXPENSES, list);
      notifyAll();
    }
  }, (err) => console.warn("Firestore expenses snapshot error:", err));

  onSnapshot(collection(db, "inventory"), (snap) => {
    const list: InventoryItem[] = [];
    snap.forEach((d) => list.push(d.data() as InventoryItem));
    if (list.length > 0) {
      currentInventory = list;
      saveData(KEYS.INVENTORY, list);
      notifyAll();
    }
  }, (err) => console.warn("Firestore inventory snapshot error:", err));

  onSnapshot(collection(db, "messages"), (snap) => {
    const list: ChatMessage[] = [];
    snap.forEach((d) => list.push(d.data() as ChatMessage));
    list.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    currentMessages = list;
    saveData(KEYS.MESSAGES, list);
    notifyAll();
  }, (err) => console.warn("Firestore messages snapshot error:", err));

  onSnapshot(collection(db, "drivers"), (snap) => {
    const list: DriverProfile[] = [];
    snap.forEach((d) => list.push(d.data() as DriverProfile));
    if (list.length > 0) {
      currentDrivers = list;
      saveData(KEYS.DRIVERS, list);
      notifyAll();
    }
  }, (err) => console.warn("Firestore drivers snapshot error:", err));

  onSnapshot(collection(db, "driverTasks"), (snap) => {
    const list: DriverPickupTask[] = [];
    snap.forEach((d) => list.push(d.data() as DriverPickupTask));
    if (list.length > 0) {
      currentDriverTasks = list;
      saveData(KEYS.DRIVER_TASKS, list);
      notifyAll();
    }
  }, (err) => console.warn("Firestore driverTasks snapshot error:", err));
}

startFirebaseSync();

export const StorageEngine = {
  // Children & Parents
  getChildren(): Child[] {
    return currentChildren;
  },
  getParents(): ParentProfile[] {
    return currentParents;
  },

  updateChild(child: Child) {
    const idx = currentChildren.findIndex((c) => c.id === child.id);
    if (idx !== -1) {
      currentChildren[idx] = child;
      saveData(KEYS.CHILDREN, currentChildren);
      notifyAll();
      setDoc(doc(db, "children", child.id), cleanForFirestore(child));
    }
  },

  // Schedules
  getSchedules(): CustodySchedule[] {
    return currentSchedules;
  },

  updateSchedule(schedule: CustodySchedule) {
    const id = schedule.id || `sched_${schedule.date}`;
    const fullSchedule = { ...schedule, id };
    const idx = currentSchedules.findIndex((s) => s.date === schedule.date);
    if (idx !== -1) {
      currentSchedules[idx] = fullSchedule;
    } else {
      currentSchedules.push(fullSchedule);
    }
    saveData(KEYS.SCHEDULES, currentSchedules);
    notifyAll();
    setDoc(doc(db, "schedules", id), cleanForFirestore(fullSchedule));
    this.addLog("Schedule Updated", `Custody for ${schedule.date} set to ${schedule.primaryParentId === 'parent1' ? 'Mom' : 'Dad'}`);
  },

  // Tasks
  getTasks(): TaskOrPickup[] {
    return currentTasks;
  },

  addTask(task: Omit<TaskOrPickup, "id">): TaskOrPickup {
    const newTask: TaskOrPickup = {
      ...task,
      id: "task_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    };
    currentTasks.unshift(newTask);
    saveData(KEYS.TASKS, currentTasks);
    notifyAll();
    setDoc(doc(db, "tasks", newTask.id), cleanForFirestore(newTask));
    this.addLog("Task Added", `Created task "${newTask.title}" for ${newTask.date}`);
    return newTask;
  },

  toggleTaskCompletion(id: string) {
    const idx = currentTasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      currentTasks[idx].completed = !currentTasks[idx].completed;
      saveData(KEYS.TASKS, currentTasks);
      notifyAll();
      setDoc(doc(db, "tasks", id), cleanForFirestore(currentTasks[idx]));
    }
  },

  deleteTask(id: string) {
    currentTasks = currentTasks.filter((t) => t.id !== id);
    saveData(KEYS.TASKS, currentTasks);
    notifyAll();
    deleteDoc(doc(db, "tasks", id));
  },

  // Packing Items
  getPackingItems(): PackingItem[] {
    return currentPacking;
  },

  addPackingItem(item: Omit<PackingItem, "id">): PackingItem {
    const newItem: PackingItem = {
      ...item,
      id: "pack_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    };
    currentPacking.unshift(newItem);
    saveData(KEYS.PACKING, currentPacking);
    notifyAll();
    setDoc(doc(db, "packing", newItem.id), cleanForFirestore(newItem));
    this.addLog("Packing Item Added", `Added "${newItem.title}" to packing list`);
    return newItem;
  },

  togglePackingItem(id: string) {
    const idx = currentPacking.findIndex((p) => p.id === id);
    if (idx !== -1) {
      currentPacking[idx].isPacked = !currentPacking[idx].isPacked;
      saveData(KEYS.PACKING, currentPacking);
      notifyAll();
      setDoc(doc(db, "packing", id), cleanForFirestore(currentPacking[idx]));
    }
  },

  deletePackingItem(id: string) {
    currentPacking = currentPacking.filter((p) => p.id !== id);
    saveData(KEYS.PACKING, currentPacking);
    notifyAll();
    deleteDoc(doc(db, "packing", id));
  },

  // Medications
  getMedications(): Medication[] {
    return currentMedications;
  },

  addMedication(med: Omit<Medication, "id">): Medication {
    const newMed: Medication = {
      ...med,
      id: "med_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    };
    currentMedications.unshift(newMed);
    saveData(KEYS.MEDICATIONS, currentMedications);
    notifyAll();
    setDoc(doc(db, "medications", newMed.id), cleanForFirestore(newMed));
    this.addLog("Medication Added", `Added medication schedule: "${newMed.name}"`);
    return newMed;
  },

  confirmMedicationAdministered(id: string, parentId: string) {
    const idx = currentMedications.findIndex((m) => m.id === id);
    if (idx !== -1) {
      currentMedications[idx] = {
        ...currentMedications[idx],
        lastAdministered: new Date().toISOString(),
        lastAdministeredBy: parentId,
        handoffConfirmed: true,
      };
      saveData(KEYS.MEDICATIONS, currentMedications);
      notifyAll();
      setDoc(doc(db, "medications", id), cleanForFirestore(currentMedications[idx]));
      this.addLog("Medication Administered", `Logged dose for ${currentMedications[idx].name}`);
    }
  },

  deleteMedication(id: string) {
    currentMedications = currentMedications.filter((m) => m.id !== id);
    saveData(KEYS.MEDICATIONS, currentMedications);
    notifyAll();
    deleteDoc(doc(db, "medications", id));
  },

  // Shared Expenses
  getExpenses(): Expense[] {
    return currentExpenses;
  },

  addExpense(expense: Omit<Expense, "id">): Expense {
    const newExp: Expense = {
      ...expense,
      id: "exp_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    };
    currentExpenses.unshift(newExp);
    saveData(KEYS.EXPENSES, currentExpenses);
    notifyAll();
    setDoc(doc(db, "expenses", newExp.id), cleanForFirestore(newExp));
    this.addLog("Expense Logged", `Logged $${newExp.amount} for "${newExp.title}"`);
    return newExp;
  },

  toggleExpenseSettled(id: string) {
    const idx = currentExpenses.findIndex((e) => e.id === id);
    if (idx !== -1) {
      currentExpenses[idx].settled = !currentExpenses[idx].settled;
      saveData(KEYS.EXPENSES, currentExpenses);
      notifyAll();
      setDoc(doc(db, "expenses", id), cleanForFirestore(currentExpenses[idx]));
      this.addLog("Expense Settled", `Marked expense "${currentExpenses[idx].title}" as ${currentExpenses[idx].settled ? "Settled" : "Unsettled"}`);
    }
  },

  deleteExpense(id: string) {
    currentExpenses = currentExpenses.filter((e) => e.id !== id);
    saveData(KEYS.EXPENSES, currentExpenses);
    notifyAll();
    deleteDoc(doc(db, "expenses", id));
  },

  // Inventory Tracker
  getInventory(): InventoryItem[] {
    return currentInventory;
  },

  addInventoryItem(item: Omit<InventoryItem, "id">): InventoryItem {
    const newInv: InventoryItem = {
      ...item,
      id: "inv_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    };
    currentInventory.unshift(newInv);
    saveData(KEYS.INVENTORY, currentInventory);
    notifyAll();
    setDoc(doc(db, "inventory", newInv.id), cleanForFirestore(newInv));
    this.addLog("Inventory Added", `Added "${newInv.title}" to kids inventory`);
    return newInv;
  },

  updateInventoryStatus(id: string, status: "good" | "needs_replacement" | "replaced") {
    const idx = currentInventory.findIndex((i) => i.id === id);
    if (idx !== -1) {
      currentInventory[idx].status = status;
      saveData(KEYS.INVENTORY, currentInventory);
      notifyAll();
      setDoc(doc(db, "inventory", id), cleanForFirestore(currentInventory[idx]));
      this.addLog("Inventory Updated", `Updated status of "${currentInventory[idx].title}" to ${status}`);
    }
  },

  deleteInventoryItem(id: string) {
    currentInventory = currentInventory.filter((i) => i.id !== id);
    saveData(KEYS.INVENTORY, currentInventory);
    notifyAll();
    deleteDoc(doc(db, "inventory", id));
  },

  // Custody Swap Requests
  getSwaps(): CustodySwapRequest[] {
    return currentSwaps;
  },

  addSwapRequest(req: Omit<CustodySwapRequest, "id" | "createdAt" | "status">): CustodySwapRequest {
    const newSwap: CustodySwapRequest = {
      ...req,
      id: "swap_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    currentSwaps.unshift(newSwap);
    saveData(KEYS.SWAPS, currentSwaps);
    notifyAll();
    setDoc(doc(db, "swaps", newSwap.id), cleanForFirestore(newSwap));
    this.addLog("Swap Requested", `Requested custody swap for date ${newSwap.dateToSwap}`);
    return newSwap;
  },

  respondToSwapRequest(id: string, status: "accepted" | "declined") {
    const idx = currentSwaps.findIndex((s) => s.id === id);
    if (idx !== -1) {
      currentSwaps[idx].status = status;
      if (status === "accepted") {
        // Swap custody on dateToSwap
        const swap = currentSwaps[idx];
        const existingSched = currentSchedules.find((s) => s.date === swap.dateToSwap);
        const currentPrimary = existingSched ? existingSched.primaryParentId : "parent1";
        const newPrimary = currentPrimary === "parent1" ? "parent2" : "parent1";
        this.updateSchedule({
          date: swap.dateToSwap,
          primaryParentId: newPrimary,
          hasHandoff: true,
          notes: "Schedule updated via accepted swap request",
        });
      }
      saveData(KEYS.SWAPS, currentSwaps);
      notifyAll();
      setDoc(doc(db, "swaps", id), cleanForFirestore(currentSwaps[idx]));
      this.addLog("Swap Request Handled", `Swap request ${id} was ${status}`);
    }
  },

  // Logs
  getLogs(): ActivityLog[] {
    return currentLogs;
  },

  addLog(action: string, details: string, userRole: string = "co-parent", childId?: string) {
    const newLog: ActivityLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString(),
      action,
      details,
      userRole,
      childId,
    };
    currentLogs.unshift(newLog);
    saveData(KEYS.LOGS, currentLogs);
    notifyAll();
  },

  // Messages
  getMessages(): ChatMessage[] {
    return currentMessages;
  },

  sendMessage(text: string, senderId: string, senderName: string, receiverId: string, receiverName: string) {
    if (!text.trim()) return;
    const newMsg: ChatMessage = {
      id: "msg_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
      senderId,
      senderName,
      receiverId,
      receiverName,
      text: text.trim(),
      timestamp: new Date().toISOString(),
      read: false,
    };
    currentMessages.push(newMsg);
    saveData(KEYS.MESSAGES, currentMessages);
    notifyAll();
    setDoc(doc(db, "messages", newMsg.id), cleanForFirestore(newMsg));
  },

  // Drivers
  getDrivers(): DriverProfile[] {
    return currentDrivers;
  },

  addDriver(driver: Omit<DriverProfile, "id">): DriverProfile {
    const newDriver: DriverProfile = {
      ...driver,
      id: "driver_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    };
    currentDrivers.push(newDriver);
    saveData(KEYS.DRIVERS, currentDrivers);
    notifyAll();
    setDoc(doc(db, "drivers", newDriver.id), cleanForFirestore(newDriver));
    this.addLog("Driver Added", `Added driver ${newDriver.name} (${newDriver.relation})`);
    return newDriver;
  },

  deleteDriver(id: string) {
    currentDrivers = currentDrivers.filter((d) => d.id !== id);
    saveData(KEYS.DRIVERS, currentDrivers);
    notifyAll();
    deleteDoc(doc(db, "drivers", id));
  },

  // Driver Tasks
  getDriverTasks(): DriverPickupTask[] {
    return currentDriverTasks;
  },

  addDriverTask(task: Omit<DriverPickupTask, "id">): DriverPickupTask {
    const newTask: DriverPickupTask = {
      ...task,
      id: "dtask_" + Date.now() + "_" + Math.random().toString(36).substring(2, 6),
    };
    currentDriverTasks.unshift(newTask);
    saveData(KEYS.DRIVER_TASKS, currentDriverTasks);
    notifyAll();
    setDoc(doc(db, "driverTasks", newTask.id), cleanForFirestore(newTask));
    this.addLog("Driver Task Added", `Assigned pickup to driver for ${newTask.date} at ${newTask.time}`);
    return newTask;
  },

  toggleDriverTask(id: string) {
    const idx = currentDriverTasks.findIndex((t) => t.id === id);
    if (idx !== -1) {
      currentDriverTasks[idx].completed = !currentDriverTasks[idx].completed;
      saveData(KEYS.DRIVER_TASKS, currentDriverTasks);
      notifyAll();
      setDoc(doc(db, "driverTasks", id), cleanForFirestore(currentDriverTasks[idx]));
    }
  },

  deleteDriverTask(id: string) {
    currentDriverTasks = currentDriverTasks.filter((t) => t.id !== id);
    saveData(KEYS.DRIVER_TASKS, currentDriverTasks);
    notifyAll();
    deleteDoc(doc(db, "driverTasks", id));
  },

  // PIN Protection
  getPinCode(): string {
    return currentPinCode || DEFAULT_PIN;
  },

  setPinCode(pin: string) {
    currentPinCode = pin;
    saveData(KEYS.PIN_CODE, pin);
    notifyAll();
  },
};
