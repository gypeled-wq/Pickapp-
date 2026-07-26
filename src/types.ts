/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ParentProfile {
  id: string; // e.g., 'parent1' | 'parent2'
  name: string; // e.g., 'Mom (Sarah)' or 'Dad (David)'
  role: 'Mom' | 'Dad' | 'Co-Parent';
  color: string; // e.g., '#ec4899' or '#3b82f6'
  avatarUrl: string;
}

export interface Child {
  id: string;
  name: string;
  avatar: string; // emoji or image URL
  notes: string;
  clothingSize?: string;
  shoeSize?: string;
  birthdate?: string;
}

export interface CustodySchedule {
  id?: string;
  date: string; // 'YYYY-MM-DD'
  primaryParentId: string; // 'parent1' or 'parent2'
  hasHandoff: boolean;
  handoffTime?: string; // e.g., '17:00'
  handoffLocation?: string; // e.g., 'School Gate' or 'Mom\'s House'
  notes?: string;
}

export interface TaskOrPickup {
  id: string;
  title: string;
  childId: string;
  type: 'pickup' | 'dropoff' | 'activity';
  time: string; // e.g., '16:30'
  date: string; // 'YYYY-MM-DD'
  responsibleParentId: string;
  location?: string;
  completed: boolean;
  notes?: string;
}

export interface PackingItem {
  id: string;
  title: string;
  childId: string;
  neededForDate: string; // 'YYYY-MM-DD'
  isPacked: boolean;
  targetHomeId: string; // 'parent1' or 'parent2'
  category?: 'sports' | 'school' | 'clothing' | 'instrument' | 'other';
}

export interface Medication {
  id: string;
  childId: string;
  name: string;
  dosage: string;
  timeSchedule: string; // e.g., 'Twice daily with meals'
  notes: string;
  lastAdministered?: string; // ISO timestamp
  lastAdministeredBy?: string; // parent ID
  handoffConfirmed?: boolean;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  paidByParentId: string; // 'parent1' or 'parent2'
  date: string; // 'YYYY-MM-DD'
  category: 'medical' | 'school' | 'clothing' | 'activities' | 'other' | string;
  childId?: string;
  splitRatio?: number; // default 0.5 (50/50)
  settled?: boolean;
  receiptUrl?: string;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  title: string;
  childId: string;
  status: 'good' | 'needs_replacement' | 'replaced';
  notes?: string;
  category?: 'clothing' | 'shoes' | 'school_supplies' | 'gear' | 'other';
  estimatedCost?: number;
}

export interface CustodySwapRequest {
  id: string;
  requestedByParentId: string;
  dateToSwap: string;
  proposedSubstituteDate?: string;
  status: 'pending' | 'accepted' | 'declined';
  note?: string;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  userRole: string;
  childId?: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  text: string;
  timestamp: string;
  read: boolean;
  reported?: boolean;
}

export interface DriverProfile {
  id: string;
  name: string;
  relation: string; // e.g. 'Grandfather', 'Babysitter', 'Family Driver'
  phone: string;
  carInfo?: string; // e.g. 'Silver Toyota 12-345-67'
  avatar: string; // emoji or icon
}

export interface DriverPickupTask {
  id: string;
  driverId: string;
  childId: string; // 'child1' | 'child2' | 'all'
  type: 'pickup' | 'dropoff';
  date: string; // YYYY-MM-DD
  time: string; // e.g. '16:00'
  location: string; // e.g. 'Primary School'
  destination: string; // e.g. 'Mom\'s House' or 'Soccer Practice'
  completed: boolean;
  notes?: string;
  assignedByParentId?: string;
}

export const DEFAULT_PIN = "1234";

export const DEFAULT_DRIVERS: DriverProfile[] = [
  {
    id: "driver1",
    name: "Eli (סבא אלי)",
    relation: "Grandfather / סבא",
    phone: "050-1234567",
    carInfo: "White Mazda 3 (78-901-23)",
    avatar: "👴",
  },
  {
    id: "driver2",
    name: "Dana (דנה הבייביסיטר)",
    relation: "Babysitter / בייביסיטר",
    phone: "052-9876543",
    carInfo: "Red Hyundai i10 (45-678-90)",
    avatar: "👩‍🦰",
  },
  {
    id: "driver3",
    name: "Yosef (יוסף הנהג)",
    relation: "Family Driver / נהג",
    phone: "054-5551234",
    carInfo: "Black Skoda Octavia (11-222-33)",
    avatar: "🚘",
  },
];

export const DEFAULT_PARENTS: ParentProfile[] = [
  {
    id: "parent1",
    name: "Mom (Sarah)",
    role: "Mom",
    color: "bg-rose-500 text-white border-rose-600",
    avatarUrl: "👩‍👧",
  },
  {
    id: "parent2",
    name: "Dad (David)",
    role: "Dad",
    color: "bg-indigo-500 text-white border-indigo-600",
    avatarUrl: "👨‍👦",
  },
];

export const DEFAULT_CHILDREN: Child[] = [
  {
    id: "child1",
    name: "Emma",
    avatar: "👧",
    notes: "Allergic to peanuts. Soccer practice on Tue & Thu.",
    clothingSize: "8-9Y",
    shoeSize: "33 EU",
  },
  {
    id: "child2",
    name: "Noah",
    avatar: "👦",
    notes: "Takes Asthma inhaler before sports. Violin on Wed.",
    clothingSize: "6Y",
    shoeSize: "30 EU",
  },
];
