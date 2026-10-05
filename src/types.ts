export type Product = {
  id: number;
  name: string;
  reference: string;
  description: string;
  category: string;
  quantity: number;
  threshold: number;
  updatedAt: string;
};

export type ProductInput = Omit<Product, 'id' | 'updatedAt'>;

export type Movement = {
  id: number;
  productId: number;
  direction: 'in' | 'out';
  quantity: number;
  createdAt: string;
};

export type Dashboard = {
  total: number;
  outOfStock: number;
  lowStock: number;
  units: number;
  categories: { category: string; count: number }[];
};

export type StackParams = {
  Home: undefined;
  Detail: { id: number };
  Form: { id?: number } | undefined;
};

export function stockStatus(product: Pick<Product, 'quantity' | 'threshold'>) {
  if (product.quantity === 0) {
    return 'out';
  }
  if (product.quantity <= product.threshold) {
    return 'low';
  }
  return 'normal';
}
