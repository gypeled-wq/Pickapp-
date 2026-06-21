/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Driver, Pickup, ActivityLog, AlertNotification } from "./types";

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
    childName: "איתי",
    time: "13:30",
    driverId: MAMA_ID,
    status: "regular",
    notes: "איסוף משער בית הספר הראשי",
    completed: false,
  },
  {
    id: "p_sun_noa",
    day: "ראשון",
    childName: "נועה",
    time: "14:00",
    driverId: PAPA_ID,
    status: "regular",
    notes: "ישירות לחוג קפואירה. להביא חליפה!",
    completed: false,
  },
  {
    id: "p_sun_omer",
    day: "ראשון",
    childName: "עומר",
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
    childName: "איתי",
    time: "13:30",
    driverId: PAPA_ID,
    status: "regular",
    notes: "מועדונית אנגלית",
    completed: false,
  },
  {
    id: "p_mon_noa",
    day: "שני",
    childName: "נועה",
    time: "15:45",
    driverId: MAAYAN_ID,
    status: "urgent",
    notes: "קארפול חד-פעמי מתואם עם מעיין. חשוב לדייק!",
    completed: false,
  },
  {
    id: "p_mon_omer",
    day: "שני",
    childName: "עומר",
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
    childName: "איתי",
    time: "13:30",
    driverId: GRANDMA_ID,
    status: "regular",
    notes: "איסוף כדורגל, להביא תיק כדורגל ובגדים להחלפה",
    completed: false,
  },
  {
    id: "p_tue_noa",
    day: "שלישי",
    childName: "נועה",
    time: "14:00",
    driverId: MAMA_ID,
    status: "regular",
    notes: "חוג ציור",
    completed: true,
  },
  {
    id: "p_tue_omer",
    day: "שלישי",
    childName: "עומר",
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
    childName: "איתי",
    time: "13:30",
    driverId: MAMA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },
  {
    id: "p_wed_noa",
    day: "רביעי",
    childName: "נועה",
    time: "14:00",
    driverId: ALON_ID,
    status: "urgent",
    notes: "איסוף דחוף בשל פגישת עבודה לא צפויה של ההורים",
    completed: false,
  },
  {
    id: "p_wed_omer",
    day: "רביעי",
    childName: "עומר",
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
    childName: "איתי",
    time: "13:30",
    driverId: PAPA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },
  {
    id: "p_thu_noa",
    day: "חמישי",
    childName: "נועה",
    time: "14:00",
    driverId: GRANDMA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },
  {
    id: "p_thu_omer",
    day: "חמישי",
    childName: "עומר",
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
    childName: "איתי",
    time: "12:00",
    driverId: MAMA_ID,
    status: "regular",
    notes: "סופשבוע נעים!",
    completed: false,
  },
  {
    id: "p_fri_noa",
    day: "שישי",
    childName: "נועה",
    time: "12:00",
    driverId: PAPA_ID,
    status: "regular",
    notes: "",
    completed: false,
  },
  {
    id: "p_fri_omer",
    day: "שישי",
    childName: "עומר",
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
    details: "נועדה נסיעת חרום של נועה ביום רביעי עם אלון.",
    userRole: "parent",
    childName: "נועה",
  },
];

const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: "alert_1",
    timestamp: "2026-06-21T10:30:00",
    title: "הוגדרה נסיעה דחופה",
    message: "הסעת חירום הוגדרה לנועה ביום רביעי בשעה 14:00 עם אלון",
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

// מפתחות אחסון ל-LocalStorage
const KEYS = {
  DRIVERS: "kid_sync_drivers_v1",
  PICKUPS: "kid_sync_pickups_v1",
  LOGS: "kid_sync_logs_v1",
  ALERTS: "kid_sync_alerts_v1",
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
    // שליחת אירוע מותאם ידנית לעיוני טאב באותו חלון ברשת פנימית של React
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

// האזנה לאירועי סנכרון חיצוניים (בין טאבים) ופנימיים
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

// ---------------------------------------------
// מחלקה סינכרונית לניהול המחסן המדומה
// ---------------------------------------------
export const StorageEngine = {
  getDrivers(): Driver[] {
    return loadData(KEYS.DRIVERS, INITIAL_DRIVERS);
  },

  saveDrivers(drivers: Driver[]) {
    saveData(KEYS.DRIVERS, drivers);
    notifyAll();
  },

  getPickups(): Pickup[] {
    return loadData(KEYS.PICKUPS, INITIAL_PICKUPS);
  },

  savePickups(pickups: Pickup[]) {
    saveData(KEYS.PICKUPS, pickups);
    notifyAll();
  },

  getLogs(): ActivityLog[] {
    return loadData(KEYS.LOGS, INITIAL_LOGS);
  },

  saveLogs(logs: ActivityLog[]) {
    saveData(KEYS.LOGS, logs);
    notifyAll();
  },

  getAlerts(): AlertNotification[] {
    return loadData(KEYS.ALERTS, INITIAL_ALERTS);
  },

  saveAlerts(alerts: AlertNotification[]) {
    saveData(KEYS.ALERTS, alerts);
    notifyAll();
  },

  // הוספת לוג פעולה חדש
  addLog(action: string, details: string, userRole: "parent" | "child" | "system", childName?: string) {
    const logs = this.getLogs();
    const newLog: ActivityLog = {
      id: "log_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      action,
      details,
      userRole,
      childName,
    };
    this.saveLogs([newLog, ...logs]); // לוג חדש בראש הרשימה
  },

  // הוספת התראת הורים חדשה
  addAlert(title: string, message: string, type: "info" | "urgent" | "success" = "info") {
    const alerts = this.getAlerts();
    const newAlert: AlertNotification = {
      id: "alert_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      title,
      message,
      type,
      read: false,
    };
    this.saveAlerts([newAlert, ...alerts]);
  },

  // ניהול נהגים
  addDriver(driverData: Omit<Driver, "id">): Driver {
    const drivers = this.getDrivers();
    const newDriver: Driver = {
      ...driverData,
      id: "drv_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    };
    this.saveDrivers([...drivers, newDriver]);
    this.addLog("הוספת נהג", `התווסף נהג חדש: ${newDriver.name} (${newDriver.type === "permanent" ? "קבוע" : "אורח"})`, "parent");
    this.addAlert("נוסף נהג חדש", `הנהג/ת ${newDriver.name} נוספ/ה לספריית הנהגים.`, "info");
    return newDriver;
  },

  updateDriver(updated: Driver) {
    const drivers = this.getDrivers();
    const index = drivers.findIndex((d) => d.id === updated.id);
    if (index !== -1) {
      drivers[index] = updated;
      this.saveDrivers(drivers);
      this.addLog("עדכון נהג", `פרטי הנהג/ת ${updated.name} עודכנו במערכת.`, "parent");
    }
  },

  deleteDriver(id: string) {
    const drivers = this.getDrivers();
    const driver = drivers.find((d) => d.id === id);
    if (driver) {
      this.saveDrivers(drivers.filter((d) => d.id !== id));
      this.addLog("מחיקת נהג", `הנהג/ת ${driver.name} נמחק/ה מספריית הנהגים.`, "parent");
    }
  },

  // ניהול הסעות
  addPickup(pickupData: Omit<Pickup, "id">): Pickup {
    const pickups = this.getPickups();
    const newPickup: Pickup = {
      ...pickupData,
      id: "p_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
    };
    this.savePickups([...pickups, newPickup]);

    const driver = this.getDrivers().find((d) => d.id === newPickup.driverId);
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
    const pickups = this.getPickups();
    const index = pickups.findIndex((p) => p.id === updated.id);
    if (index !== -1) {
      const old = pickups[index];
      pickups[index] = updated;
      this.savePickups(pickups);

      const driver = this.getDrivers().find((d) => d.id === updated.driverId);
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
    const pickups = this.getPickups();
    const pickup = pickups.find((p) => p.id === id);
    if (pickup) {
      this.savePickups(pickups.filter((p) => p.id !== id));
      this.addLog("ביטול הסעה", `בוטלה ההסעה של ${pickup.childName} ביום ${pickup.day} בשעה ${pickup.time}`, "parent", pickup.childName);
      this.addAlert("ביטול הסעה", `בוטלה ההסעה של ${pickup.childName} ביום ${pickup.day} בשעה ${pickup.time}`, "urgent");
    }
  },

  togglePickupCompletion(id: string) {
    const pickups = this.getPickups();
    const index = pickups.findIndex((p) => p.id === id);
    if (index !== -1) {
      const p = pickups[index];
      p.completed = !p.completed;
      this.savePickups(pickups);
      const actionText = p.completed ? "הושלם בהצלחה" : "חזר לפעיל";
      this.addLog("עדכון סטטוס ביצוע", `האיסוף של ${p.childName} ביום ${p.day} סומן כ${actionText}`, p.completed ? "child" : "parent", p.childName);
      
      // הוספת התראת עדכון סטטוס
      this.addAlert(
        "עדכון סטטוס איסוף",
        `האיסוף של ${p.childName} ביום ${p.day} שונה לסטטוס: ${actionText}`,
        p.completed ? "success" : "info"
      );
    }
  },
};
