import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { Dashboard, Movement, Product, ProductInput } from './types';

const REQUEST_TIMEOUT_MS = 10_000;

function getServerHost(): string {
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return window.location.hostname;
  }

  const expoHost = Constants.expoConfig?.hostUri;
  if (expoHost) {
    return expoHost.replace(/^https?:\/\//, '').split(':')[0];
  }

  return Platform.OS === 'android' ? '10.0.2.2' : 'localhost';
}

export const API_URL = process.env.EXPO_PUBLIC_API_URL || `http://${getServerHost()}:3000/api`;

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { 'Content-Type': 'application/json', ...options?.headers },
      signal: controller.signal,
    });
    const body = await response.json();

    if (!response.ok) {
      throw new Error(body.message || 'The request could not be completed.');
    }

    return body as T;
  } catch (error) {
    if (error instanceof Error) {
      const timedOut = error.name === 'AbortError';
      const connectionFailed = error instanceof TypeError;

      if (timedOut || connectionFailed) {
        throw new Error('Cannot reach the server. Check your connection and try again.');
      }
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const api = {
  getProducts() {
    return request<Product[]>('/products');
  },

  getProduct(id: number) {
    return request<Product>(`/products/${id}`);
  },

  saveProduct(product: ProductInput, id?: number) {
    const path = id ? `/products/${id}` : '/products';
    return request<Product>(path, {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(product),
    });
  },

  recordMovement(id: number, direction: 'in' | 'out', quantity: number) {
    return request<Product>(`/products/${id}/movements`, {
      method: 'POST',
      body: JSON.stringify({ direction, quantity }),
    });
  },

  getMovements(id: number) {
    return request<Movement[]>(`/products/${id}/movements`);
  },

  getDashboard() {
    return request<Dashboard>('/dashboard');
  },
};
