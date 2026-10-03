import { toast } from "sonner";
import { useAuthStore } from "../store/auth.store";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1";

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message = data?.message || data?.error || response.statusText;
    
    // Auto-toast errors for convenience unless it's a 401 (auth handled elsewhere typically)
    if (response.status !== 401) {
      toast.error(message || "An unexpected error occurred");
    }
    
    throw new ApiError(response.status, message, data);
  }

  // Our backend wraps responses in { success: true, data: ... }
  return data.data !== undefined ? data.data : data;
}

export const apiClient = {
  get: async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const { token } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    return handleResponse<T>(response);
  },

  post: async <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> => {
    const { token } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  put: async <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> => {
    const { token } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  patch: async <T>(endpoint: string, body?: any, options?: RequestInit): Promise<T> => {
    const { token } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    return handleResponse<T>(response);
  },

  delete: async <T>(endpoint: string, options?: RequestInit): Promise<T> => {
    const { token } = useAuthStore.getState();
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });
    return handleResponse<T>(response);
  }
};
