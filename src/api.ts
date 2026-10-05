import Constants from "expo-constants";
import { Platform } from "react-native";
import { Product, ProductInput, Movement, Dashboard } from "./types";
const hostUri = Constants.expoConfig?.hostUri;
const host = hostUri?.replace(/^https?:\/\//, "").split(":")[0];
export const API_URL =
  process.env.EXPO_PUBLIC_API_URL ||
  `http://${Platform.OS === "web" && typeof window !== "undefined" ? window.location.hostname : host || (Platform.OS === "android" ? "10.0.2.2" : "localhost")}:3000/api`;
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: { "Content-Type": "application/json", ...options?.headers },
      signal: controller.signal,
    });
    const body = await response.json();
    if (!response.ok) throw new Error(body.message || "La requête a échoué.");
    return body as T;
  } catch (e) {
    if (
      e instanceof Error &&
      (e.name === "AbortError" ||
        e.message.includes("fetch") ||
        e.message.includes("Network"))
    )
      throw new Error(
        "API inaccessible. Vérifiez le réseau et le serveur, puis réessayez.",
      );
    throw e;
  } finally {
    clearTimeout(timeout);
  }
}
export const api = {
  products: () => request<Product[]>("/products"),
  product: (id: number) => request<Product>(`/products/${id}`),
  save: (p: ProductInput, id?: number) =>
    request<Product>(id ? `/products/${id}` : "/products", {
      method: id ? "PUT" : "POST",
      body: JSON.stringify(p),
    }),
  move: (id: number, direction: "in" | "out", quantity: number) =>
    request<Product>(`/products/${id}/movements`, {
      method: "POST",
      body: JSON.stringify({ direction, quantity }),
    }),
  movements: (id: number) => request<Movement[]>(`/products/${id}/movements`),
  dashboard: () => request<Dashboard>("/dashboard"),
};
