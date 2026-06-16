export type UserRole = 'buyer' | 'farmer';

export interface User {
  id: string;
  role: UserRole;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock?: number;
  image?: string;
  farmer?: string;
  description?: string;
  category?: string;
}

export interface Order {
  id: string;
  date: string;
  total: number;
  status: string;
  buyer?: string;
}

export interface CartItem extends Product {
  quantity: number;
}
