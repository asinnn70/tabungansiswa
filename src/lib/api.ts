import { Student, Transaction, ApiResponse, DashboardStats, AuthResponse } from '../types';

const GAS_API_URL = import.meta.env.VITE_GAS_API_URL;

if (!GAS_API_URL || GAS_API_URL.includes('YOUR_SCRIPT_ID')) {
  console.warn('PERINGATAN: VITE_GAS_API_URL belum dikonfigurasi. Silakan atur di Secrets panel AI Studio.');
}

async function request<T>(url: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    console.log(`API Request: ${url}`, options);
    
    // Check if fetch is available
    if (typeof fetch === 'undefined') {
      throw new Error('Fetch API is not available in this environment');
    }

    const response = await fetch(url, {
      ...options,
      mode: 'cors',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
        ...options?.headers,
      },
    });

    console.log(`API Response Status: ${response.status}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API Error Response:', errorText);
      throw new Error(`HTTP error! status: ${response.status}, body: ${errorText}`);
    }

    const data = await response.json();
    console.log('API Response Data:', data);
    return data;
  } catch (error: any) {
    console.error('API Request Error Details:', error);
    return {
      success: false,
      data: null as any,
      message: error.message || 'Terjadi kesalahan koneksi ke server'
    };
  }
}

export const studentApi = {
  getAll: async () => {
    return request<Student[]>(`${GAS_API_URL}?action=getStudents&_t=${Date.now()}`);
  },
  getById: async (id: string) => {
    return request<Student>(`${GAS_API_URL}?action=getStudent&id=${id}&_t=${Date.now()}`);
  },
  create: async (student: Omit<Student, 'id' | 'created_at'>) => {
    return request<Student>(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'createStudent',
        ...student,
      }),
    });
  },
  update: async (id: string, student: Partial<Student>) => {
    return request<Student>(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'updateStudent',
        id,
        ...student,
      }),
    });
  },
};

export const transactionApi = {
  getAll: async () => {
    return request<Transaction[]>(`${GAS_API_URL}?action=getTransactions&_t=${Date.now()}`);
  },
  deposit: async (data: { student_id: string; amount: number; method: string; note: string; status?: string; created_by?: string }) => {
    return request<Transaction>(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'deposit',
        ...data,
        // Add PascalCase variants for compatibility
        Status: data.status,
        StudentId: data.student_id,
        Amount: data.amount,
        Method: data.method,
        Note: data.note,
        CreatedBy: data.created_by
      }),
    });
  },
  withdraw: async (data: { student_id: string; amount: number; method: string; note: string }) => {
    return request<Transaction>(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'withdraw',
        ...data,
        // Add PascalCase variants for compatibility
        StudentId: data.student_id,
        Amount: data.amount,
        Method: data.method,
        Note: data.note
      }),
    });
  },
  getBalance: async (student_id: string) => {
    return request<{ balance: number }>(`${GAS_API_URL}?action=getBalance&student_id=${student_id}&_t=${Date.now()}`);
  },
  approve: async (id: string) => {
    return request<Transaction>(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'approveTransaction',
        id,
      }),
    });
  },
  reject: async (id: string) => {
    return request<Transaction>(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'rejectTransaction',
        id,
      }),
    });
  },
};

export const dashboardApi = {
  getStats: async () => {
    return request<DashboardStats>(`${GAS_API_URL}?action=getDashboardStats&_t=${Date.now()}`);
  },
};

export const authApi = {
  login: async (credentials: any) => {
    return request<AuthResponse>(GAS_API_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'login',
        ...credentials,
      }),
    });
  },
};
