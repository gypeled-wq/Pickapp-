/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Driver, Pickup, ActivityLog, AlertNotification } from "./types";
import { collection, onSnapshot, doc, setDoc, deleteDoc, getDocs } from "firebase/firestore";
import { db } from "./firebase";

// מזהים קשיחים לנהגי המפתח ההתחלתיים
const PAPA_ID = "drv_papa";
const MAMA_ID = "drv_mama";
const GRANDMA_ID = "drv_shosh";
const ALON_ID = "drv_alon";
const MAAYAN_ID = "drv_maayan";

const INITIAL_DRIVERS: Driver[] = [
  {
    id: PAPA_ID,
    name: "ארז (אבא)",
    phone: "052-123-4567",
    vehicleInfo: "ניסאן קשקאי כחולה (מס׳ 33-444-55)",
    type: "permanent",
    reminderOptIn: true,
  },
  {
    id: MAMA_ID,
    name: "מיכל (אמא)",
    phone: "054-987-6543",
    vehicleInfo: "יונדאי איוניק אפורה (מס׳ 12-345-67)",
    type: "permanent",
    reminderOptIn: true,
  },
  {
    id: GRANDMA_ID,
    name: "סבתא שוש",
    phone: "050-555-5555",
    vehicleInfo: "טויוטה יאריס אדומה",
    type: "permanent",
    reminderOptIn: true,
  },
  {
    id: ALON_ID,
    name: "אלון (אד הוק)",
    phone: "053-444-4444",
    vehicleInfo: "מאזדה 3 שחורה",
    type: "guest",
    reminderOptIn: false,
  },
  {
    id: MAAYAN_ID,
    name: "מעיין (אמא של אפי)",
    phone: "058-777-7777",
    vehicleInfo: "קיה פיקנטו צהובה",
    type: "guest",
    reminderOptIn: true,
  },
];

const INITIAL_PICKUPS: Pickup[] = [
  // יום ראשון
  {
    id: "p_sun_itay",
    day: "ראשון",
    childName: "יובל",
    time: "13:30",
    driverId: MAMA_ID,
    status: "regular",
    notes: "איסוף משער בית הספר הראשי",
    completed: false,
  },
  {
    id: "p_sun_noa",
    day: "ראשון",
    childName: "אלון",
    time: "14:00",
    driverId: PAPA_ID,
    status: "regular",
    notes: "ישירות לחוג קפואירה. להביא חליפה!",
    completed: false,
  },
  {
    id: "p_sun_omer",
    day: "ראשון",
    childName: "בר",
    time: "16:30",
    driverId: GRANDMA_ID,
    status: "regular",
    notes: "מיקום: גן החלת חלומות. להביא קרקרים לנשנוש.",
    completed: false,
  },

  // יום שני
  {
    id: "p_mon_itay",
    day: "שני",
    childName: "יובל",
    time: "13:30",
    driverId: PAPA_ID,
    status: "regular",
    notes: "מועדונית אנגלית",
    completed: false,
  },
  {
    id: "p_mon_noa",
    day: "שני",
    childName: "אלון",
    time: "15:45",
    driverId: MAAYAN_ID,
    status: "urgent",
    notes: "קארפול חד-פעמי מתואם עם מעיין. חשוב לדייק!",
    completed: false,
  },
  {
    id: "p_mon_omer",
    day: "שני",
    childName: "בר",
    time: "16:30",
    driverId: MAMA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },

  // יום שלישי
  {
    id: "p_tue_itay",
    day: "שלישי",
    childName: "יובל",
    time: "13:30",
    driverId: GRANDMA_ID,
    status: "regular",
    notes: "איסוף כדורגל, להביא תיק כדורגל ובגדים להחלפה",
    completed: false,
  },
  {
    id: "p_tue_noa",
    day: "שלישי",
    childName: "אלון",
    time: "14:00",
    driverId: MAMA_ID,
    status: "regular",
    notes: "חוג ציור",
    completed: true,
  },
  {
    id: "p_tue_omer",
    day: "שלישי",
    childName: "בר",
    time: "16:30",
    driverId: PAPA_ID,
    status: "regular",
    notes: "",
    completed: true,
  },

  // יום רביעי
  {
    id: "p_wed_itay",
    day: "רביעי",
    childName: "יובל",
    time: "13:30",
    driverId: MAMA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },
  {
    id: "p_wed_noa",
    day: "רביעי",
    childName: "אלון",
    time: "14:00",
    driverId: ALON_ID,
    status: "urgent",
    notes: "איסוף דחוף בשל פגישת עבודה לא צפויה של ההורים",
    completed: false,
  },
  {
    id: "p_wed_omer",
    day: "רביעי",
    childName: "בר",
    time: "16:30",
    driverId: GRANDMA_ID,
    status: "regular",
    notes: "זמן איכות עם סבתא",
    completed: false,
  },

  // יום חמישי
  {
    id: "p_thu_itay",
    day: "חמישי",
    childName: "יובל",
    time: "13:30",
    driverId: PAPA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },
  {
    id: "p_thu_noa",
    day: "חמישי",
    childName: "אלון",
    time: "14:00",
    driverId: GRANDMA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },
  {
    id: "p_thu_omer",
    day: "חמישי",
    childName: "בר",
    time: "16:30",
    driverId: MAMA_ID,
    status: "regular",
    notes: "יום ארוך בגן",
    completed: false,
  },

  // יום שישי
  {
    id: "p_fri_itay",
    day: "שישי",
    childName: "יובל",
    time: "12:00",
    driverId: MAMA_ID,
    status: "regular",
    notes: "סופשבוע נעים!",
    completed: false,
  },
  {
    id: "p_fri_noa",
    day: "שישי",
    childName: "אלון",
    time: "12:00",
    driverId: PAPA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },
  {
    id: "p_fri_omer",
    day: "שישי",
    childName: "בר",
    time: "12:00",
    driverId: MAMA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },
];

const INITIAL_LOGS: ActivityLog[] = [
  {
    id: "log_1",
    timestamp: "2026-06-21T08:00:00",
    action: "אתחול מערכת",
    details: "מערכת הסעות הילדים הופעלה בהצלחה לשבוע הנוכחי.",
    userRole: "system",
  },
  {
    id: "log_2",
    timestamp: "2026-06-21T09:15:00",
    action: "עדכון נהג",
    details: "הנהגת מעיין משויכת כעת לקבוצת 'נהגים אורחים'.",
    userRole: "parent",
  },
  {
    id: "log_3",
    timestamp: "2026-06-21T10:30:00",
    action: "הסעה דחופה",
    details: "נועדה נסיעת חרום של אלון ביום רביעי עם אלון.",
    userRole: "parent",
    childName: "אלון",
  },
];

const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: "alert_1",
    timestamp: "2026-06-21T10:30:00",
    title: "הוגדרה נסיעה דחופה",
    message: "הסעת חירום הוגדרה לאלון ביום רביעי בשעה 14:00 עם אלון",
    type: "urgent",
    read: false,
  },
  {
    id: "alert_2",
    timestamp: "2026-06-21T09:15:00",
    title: "נהג אורח נוסף לספרייה",
    message: "מעיין (אמא של אפי) נוספה לספריית הנהגים",
    type: "info",
    read: true,
  },
];

// מפתחות אחסון ל-LocalStorage לשחזור מהיר
const KEYS = {
  DRIVERS: "kid_sync_drivers_v1",
  PICKUPS: "kid_sync_pickups_v1",
  LOGS: "kid_sync_logs_v1",
  ALERTS: "kid_sync_alerts_v1",
  MASTER_PICKUPS: "kid_sync_master_pickups_v1",
};

// קורא נתונים או מאתחל בערכי ברירת מחדל
export function loadData<T>(key: string, initial: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) {
      localStorage.setItem(key, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error("Error loading localStorage key: " + key, err);
    return initial;
  }
}

export function saveData<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("local-storage-sync", { detail: { key, data } }));
  } catch (err) {
    console.error("Error saving localStorage key: " + key, err);
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

// קאשים דינאמיים מקומיים המסונכרנים מול Firebase ומספקים שליפה מהירה
let currentDrivers: Driver[] = loadData(KEYS.DRIVERS, INITIAL_DRIVERS);
let currentPickups: Pickup[] = loadData(KEYS.PICKUPS, INITIAL_PICKUPS);
let currentLogs: ActivityLog[] = loadData(KEYS.LOGS, INITIAL_LOGS);
let currentAlerts: AlertNotification[] = loadData(KEYS.ALERTS, INITIAL_ALERTS);
let currentMasterPickups: Pickup[] = loadData(KEYS.MASTER_PICKUPS, INITIAL_PICKUPS);

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// פונקציית עזר לאתחול (seeding) של אוספים ריקים
async function syncOrSeedCollection<T extends { id: string }>(
  collectionName: string,
  currentLocalData: T[],
  defaultInitialData: T[]
) {
  try {
    const colRef = collection(db, collectionName);
    const snap = await getDocs(colRef);
    if (snap.empty) {
      console.log(`Seeding Firestore collection: ${collectionName}`);
      // אם יש מידע מקומי שכבר נשמר בדפדפן זה, נסנכרן אותו לענן כדי שלא ילך לאיבוד.
      // אחרת, נשתמש בנתוני ברירת המחדל ההתחלתיים של המערכת.
      const dataToSeed = currentLocalData && currentLocalData.length > 0 ? currentLocalData : defaultInitialData;
      for (const item of dataToSeed) {
        await setDoc(doc(db, collectionName, item.id), cleanForFirestore(item));
      }
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, collectionName);
  }
}

// אתחול הסנכרון והאזנות בזמן אמת
async function startFirebaseSync() {
  await syncOrSeedCollection("drivers", currentDrivers, INITIAL_DRIVERS);
  await syncOrSeedCollection("pickups", currentPickups, INITIAL_PICKUPS);
  await syncOrSeedCollection("logs", currentLogs, INITIAL_LOGS);
  await syncOrSeedCollection("alerts", currentAlerts, INITIAL_ALERTS);
  await syncOrSeedCollection("master_pickups", currentMasterPickups, INITIAL_PICKUPS);

  // האזנות בזמן אמת לעדכונים מכל מכשיר/דפדפן
  onSnapshot(collection(db, "drivers"), (snapshot) => {
    const list: Driver[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Driver);
    });
    currentDrivers = list;
    saveData(KEYS.DRIVERS, list);
    notifyAll();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "drivers");
  });

  onSnapshot(collection(db, "pickups"), (snapshot) => {
    const list: Pickup[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Pickup);
    });
    currentPickups = list;
    saveData(KEYS.PICKUPS, list);
    notifyAll();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "pickups");
  });

  onSnapshot(collection(db, "logs"), (snapshot) => {
    const list: ActivityLog[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as ActivityLog);
    });
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    currentLogs = list;
    saveData(KEYS.LOGS, list);
    notifyAll();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "logs");
  });

  onSnapshot(collection(db, "alerts"), (snapshot) => {
    const list: AlertNotification[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as AlertNotification);
    });
    list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    currentAlerts = list;
    saveData(KEYS.ALERTS, list);
    notifyAll();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "alerts");
  });

  onSnapshot(collection(db, "master_pickups"), (snapshot) => {
    const list: Pickup[] = [];
    snapshot.forEach((doc) => {
      list.push(doc.data() as Pickup);
    });
    currentMasterPickups = list;
    saveData(KEYS.MASTER_PICKUPS, list);
    notifyAll();
  }, (err) => {
    handleFirestoreError(err, OperationType.GET, "master_pickups");
  });
}

startFirebaseSync();

function cleanForFirestore(obj: any): any {
  if (obj === null || obj === undefined) {
    return null;
  }
  if (Array.isArray(obj)) {
    return obj.map(item => cleanForFirestore(item));
  }
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

// פונקציות לעדכון הנתונים ב-Firestore באופן אוטומטי (לשימוש גיבוי/העתקה מלאה)
async function syncDriversInFirestore(newDrivers: Driver[]) {
  try {
    const snap = await getDocs(collection(db, "drivers"));
    const existingIds = snap.docs.map(doc => doc.id);
    const newIds = newDrivers.map(d => d.id);

    for (const id of existingIds) {
      if (!newIds.includes(id)) {
        await deleteDoc(doc(db, "drivers", id));
      }
    }
    for (const d of newDrivers) {
      await setDoc(doc(db, "drivers", d.id), cleanForFirestore(d));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "drivers");
  }
}

async function syncPickupsInFirestore(newPickups: Pickup[]) {
  try {
    const snap = await getDocs(collection(db, "pickups"));
    const existingIds = snap.docs.map(doc => doc.id);
    const newIds = newPickups.map(p => p.id);

    for (const id of existingIds) {
      if (!newIds.includes(id)) {
        await deleteDoc(doc(db, "pickups", id));
      }
    }
    for (const p of newPickups) {
      await setDoc(doc(db, "pickups", p.id), cleanForFirestore(p));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "pickups");
  }
}

async function syncLogsInFirestore(newLogs: ActivityLog[]) {
  try {
    const snap = await getDocs(collection(db, "logs"));
    const existingIds = snap.docs.map(doc => doc.id);
    const newIds = newLogs.map(l => l.id);

    for (const id of existingIds) {
      if (!newIds.includes(id)) {
        await deleteDoc(doc(db, "logs", id));
      }
    }
    for (const l of newLogs) {
      await setDoc(doc(db, "logs", l.id), cleanForFirestore(l));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "logs");
  }
}

async function syncAlertsInFirestore(newAlerts: AlertNotification[]) {
  try {
    const snap = await getDocs(collection(db, "alerts"));
    const existingIds = snap.docs.map(doc => doc.id);
    const newIds = newAlerts.map(a => a.id);

    for (const id of existingIds) {
      if (!newIds.includes(id)) {
        await deleteDoc(doc(db, "alerts", id));
      }
    }
    for (const a of newAlerts) {
      await setDoc(doc(db, "alerts", a.id), cleanForFirestore(a));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "alerts");
  }
}

async function syncMasterPickupsInFirestore(newMasterPickups: Pickup[]) {
  try {
    const snap = await getDocs(collection(db, "master_pickups"));
    const existingIds = snap.docs.map(doc => doc.id);
    const newIds = newMasterPickups.map(p => p.id);

    for (const id of existingIds) {
      if (!newIds.includes(id)) {
        await deleteDoc(doc(db, "master_pickups", id));
      }
    }
    for (const p of newMasterPickups) {
      await setDoc(doc(db, "master_pickups", p.id), cleanForFirestore(p));
    }
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, "master_pickups");
  }
}

// ---------------------------------------------
// מחלקה סינכרונית לניהול המחסן המדומה (מקושרת ל-Firestore בזמן אמת באופן אטומי)
// ---------------------------------------------
export const StorageEngine = {
  getDrivers(): Driver[] {
    return currentDrivers;
  },

  saveDrivers(drivers: Driver[]) {
    currentDrivers = drivers;
    saveData(KEYS.DRIVERS, drivers);
    notifyAll();
    syncDriversInFirestore(drivers);
  },

  getPickups(): Pickup[] {
    return currentPickups;
  },

  savePickups(pickups: Pickup[]) {
    currentPickups = pickups;
    saveData(KEYS.PICKUPS, pickups);
    notifyAll();
    syncPickupsInFirestore(pickups);
  },

  getMasterPickups(): Pickup[] {
    return currentMasterPickups;
  },

  saveMasterPickups(pickups: Pickup[]) {
    currentMasterPickups = pickups;
    saveData(KEYS.MASTER_PICKUPS, pickups);
    notifyAll();
    syncMasterPickupsInFirestore(pickups);
  },

  resetMasterPickupsToDefault() {
    this.saveMasterPickups(INITIAL_PICKUPS);
  },

  getLogs(): ActivityLog[] {
    return currentLogs;
  },

  saveLogs(logs: ActivityLog[]) {
    currentLogs = logs;
    saveData(KEYS.LOGS, logs);
    notifyAll();
    syncLogsInFirestore(logs);
  },

  getAlerts(): AlertNotification[] {
    return currentAlerts;
  },

  saveAlerts(alerts: AlertNotification[]) {
    currentAlerts = alerts;
    saveData(KEYS.ALERTS, alerts);
    notifyAll();
    syncAlertsInFirestore(alerts);
  },

  // הוספת לוג פעולה חדש באופן אטומי
  addLog(action: string, details: string, userRole: "parent" | "child" | "system", childName?: string) {
    const newLog: ActivityLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      action,
      details,
      userRole,
      childName,
    };
    currentLogs = [newLog, ...currentLogs];
    saveData(KEYS.LOGS, currentLogs);
    notifyAll();

    setDoc(doc(db, "logs", newLog.id), cleanForFirestore(newLog)).catch((err) => {
      console.error("Error writing log:", err);
    });
  },

  // הוספת התראת הורים חדשה באופן אטומי
  addAlert(title: string, message: string, type: "info" | "urgent" | "success" = "info") {
    const newAlert: AlertNotification = {
      id: "alert_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      read: false,
    };
    currentAlerts = [newAlert, ...currentAlerts];
    saveData(KEYS.ALERTS, currentAlerts);
    notifyAll();

    setDoc(doc(db, "alerts", newAlert.id), cleanForFirestore(newAlert)).catch((err) => {
      console.error("Error writing alert:", err);
    });
  },

  // ניהול נהגים - אטומי ומהיר
  addDriver(driverData: Omit<Driver, "id">): Driver {
    const newDriver: Driver = {
      ...driverData,
      id: "drv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    };
    currentDrivers = [...currentDrivers, newDriver];
    saveData(KEYS.DRIVERS, currentDrivers);
    notifyAll();

    setDoc(doc(db, "drivers", newDriver.id), cleanForFirestore(newDriver)).catch((err) => {
      console.error("Error writing driver:", err);
    });

    this.addLog("הוספת נהג", `התווסף נהג חדש: ${newDriver.name} (${newDriver.type === "permanent" ? "קבוע" : "אורח"})`, "parent");
    this.addAlert("נוסף נהג חדש", `הנהג/ת ${newDriver.name} נוספ/ה לספריית הנהגים.`, "info");
    return newDriver;
  },

  updateDriver(updated: Driver) {
    const index = currentDrivers.findIndex((d) => d.id === updated.id);
    if (index !== -1) {
      currentDrivers[index] = updated;
      saveData(KEYS.DRIVERS, currentDrivers);
      notifyAll();

      setDoc(doc(db, "drivers", updated.id), cleanForFirestore(updated)).catch((err) => {
        console.error("Error updating driver:", err);
      });

      this.addLog("עדכון נהג", `פרטי הנהג/ת ${updated.name} עודכנו במערכת.`, "parent");
    }
  },

  deleteDriver(id: string) {
    const driver = currentDrivers.find((d) => d.id === id);
    if (driver) {
      currentDrivers = currentDrivers.filter((d) => d.id !== id);
      saveData(KEYS.DRIVERS, currentDrivers);
      notifyAll();

      deleteDoc(doc(db, "drivers", id)).catch((err) => {
        console.error("Error deleting driver:", err);
      });

      this.addLog("מחיקת נהג", `הנהג/ת ${driver.name} נמחק/ה מספריית הנהגים.`, "parent");
    }
  },

  // ניהול הסעות - אטומי ומהיר
  addPickup(pickupData: Omit<Pickup, "id">): Pickup {
    const newPickup: Pickup = {
      ...pickupData,
      id: "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    };
    currentPickups = [...currentPickups, newPickup];
    saveData(KEYS.PICKUPS, currentPickups);
    notifyAll();

    setDoc(doc(db, "pickups", newPickup.id), cleanForFirestore(newPickup)).catch((err) => {
      console.error("Error adding pickup to Firestore:", err);
    });

    const driver = currentDrivers.find((d) => d.id === newPickup.driverId);
    const driverName = driver ? driver.name : "רכב לא ידוע";
    this.addLog(
      newPickup.status === "urgent" ? "הסעה דחופה" : "הוספת הסעה",
      `נוצר איסוף מעודכן עבור ${newPickup.childName} ביום ${newPickup.day} בשעה ${newPickup.time} עם ${driverName}`,
      "parent",
      newPickup.childName
    );

    this.addAlert(
      newPickup.status === "urgent" ? "איסוף דחוף הוגדר!" : "עודכן איסוף חדש",
      `עבור ${newPickup.childName} ביום ${newPickup.day} בשעה ${newPickup.time} בהובלת ${driverName}`,
      newPickup.status === "urgent" ? "urgent" : "success"
    );

    return newPickup;
  },

  updatePickup(updated: Pickup) {
    const index = currentPickups.findIndex((p) => p.id === updated.id);
    if (index !== -1) {
      currentPickups[index] = updated;
      saveData(KEYS.PICKUPS, currentPickups);
      notifyAll();

      setDoc(doc(db, "pickups", updated.id), cleanForFirestore(updated)).catch((err) => {
        console.error("Error updating pickup in Firestore:", err);
      });

      const driver = currentDrivers.find((d) => d.id === updated.driverId);
      const driverName = driver ? driver.name : "רכב לא ידוע";

      const logMsg = `האיסוף של ${updated.childName} ביום ${updated.day} עודכן לשעה ${updated.time} עם ${driverName}. ${updated.notes ? `הערות: ${updated.notes}` : ""}`;
      this.addLog("עדכון איסוף", logMsg, "parent", updated.childName);

      const alertTitle = updated.status === "urgent" ? "איסוף עודכן כדחוף!" : "פרטי איסוף עודכנו";
      this.addAlert(
        alertTitle,
        `הסעת ${updated.childName} ביום ${updated.day} בשעה ${updated.time} עודכנה עם ${driverName}`,
        updated.status === "urgent" ? "urgent" : "info"
      );
    }
  },

  deletePickup(id: string) {
    const pickup = currentPickups.find((p) => p.id === id);
    if (pickup) {
      currentPickups = currentPickups.filter((p) => p.id !== id);
      saveData(KEYS.PICKUPS, currentPickups);
      notifyAll();

      deleteDoc(doc(db, "pickups", id)).catch((err) => {
        console.error("Error deleting pickup from Firestore:", err);
      });

      this.addLog("ביטול הסעה", `בוטלה ההסעה של ${pickup.childName} ביום ${pickup.day} בשעה ${pickup.time}`, "parent", pickup.childName);
      this.addAlert("ביטול הסעה", `בוטלה ההסעה של ${pickup.childName} ביום ${pickup.day} בשעה ${pickup.time}`, "urgent");
    }
  },

  togglePickupCompletion(id: string, weekOffset: number = 0) {
    const index = currentPickups.findIndex((p) => p.id === id);
    if (index !== -1) {
      const orig = currentPickups[index];
      let p: Pickup;
      
      if (orig.isRecurring) {
        const completedWeeks = orig.completedWeeks || {};
        const previousState = completedWeeks[weekOffset] ?? (weekOffset === 0 ? orig.completed : false);
        const newState = !previousState;
        
        p = {
          ...orig,
          completedWeeks: {
            ...completedWeeks,
            [weekOffset]: newState,
          },
        };
        if (weekOffset === 0) {
          p.completed = newState;
        }
      } else {
        p = {
          ...orig,
          completed: !orig.completed,
        };
      }
      
      currentPickups[index] = p;
      saveData(KEYS.PICKUPS, currentPickups);
      notifyAll();

      setDoc(doc(db, "pickups", id), cleanForFirestore(p)).catch((err) => {
        console.error("Error toggling pickup completion in Firestore:", err);
      });

      const isCompleted = orig.isRecurring 
        ? (p.completedWeeks?.[weekOffset] ?? false)
        : p.completed;

      const actionText = isCompleted ? "הושלם בהצלחה" : "חזר לפעיל";
      const weekLabel = weekOffset === 0 ? "" : ` (שבוע ${weekOffset > 0 ? "+" : ""}${weekOffset})`;
      
      this.addLog("עדכון סטטוס ביצוע", `האיסוף של ${p.childName} ביום ${p.day}${weekLabel} סומן כ${actionText}`, isCompleted ? "child" : "parent", p.childName);
      
      this.addAlert(
        "עדכון סטטוס איסוף",
        `האיסוף של ${p.childName} ביום ${p.day}${weekLabel} שונה לסטטוס: ${actionText}`,
        isCompleted ? "success" : "info"
      );
    }
  },
};
