import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface User {
  uid: string;
  email: string | null;
  name: string | null;
  photoURL: string | null;
  role: 'citizen' | 'volunteer' | 'ong' | 'admin' | 'civil_defense';
  status: 'active' | 'pending_approval' | 'rejected';
}
