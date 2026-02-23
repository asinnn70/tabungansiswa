export type StudentStatus = 'active' | 'inactive';

export interface Student {
  id: string;
  nis: string;
  name: string;
  class: string;
  parent_name: string;
  phone: string;
  photo_url?: string;
  status: StudentStatus;
  created_at: string;
}

export interface Account {
  id: string;
  student_id: string;
  account_number: string;
  initial_balance: number;
  current_balance: number;
  created_at: string;
}

export type TransactionType = 'deposit' | 'withdraw';

export interface Transaction {
  id: string;
  account_id: string;
  student_id: string;
  type: TransactionType;
  amount: number;
  method: string;
  note: string;
  status: 'pending' | 'completed' | 'rejected';
  date: string;
  created_by: string;
}

export interface DashboardStats {
  totalStudents: number;
  totalSavings: number;
  todayDeposits: number;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export type UserRole = 'admin' | 'student';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  student_id?: string; // Only for student role
}

export interface AuthResponse {
  user: User;
  token: string;
}
