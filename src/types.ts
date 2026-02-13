/**
 * Domain models for Quiz Event PWA.
 * Designed to support: Order Taking, Bar Management, Team Ranking, Admin (later).
 */

/** Order status – bar screen will use in_progress/done; ranking aggregates by team. */
export type OrderStatus = 'new' | 'in_progress' | 'done';

/** Single line item in an order (snapshot of menu item at order time). */
export interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
  points: number;
}

/** Order persisted to Firebase. Bar queries chronologically; ranking aggregates points per team. */
export interface Order {
  id: string;
  tableId: string;
  /** Table number at order time (same source as tables list; editable in admin later). */
  tableNumber: string;
  teamName: string;
  items: OrderItem[];
  totalPrice: number;
  totalPoints: number;
  status: OrderStatus;
  createdAt: number;
}

/** Table/team – defined locally in src/data/tables.ts. Used for Select Table and ranking. */
export interface Table {
  id: string;
  tableNumber: string;
  teamName: string;
}

/** Menu item (drink or food) – defined locally in src/data/menu.ts. */
export interface MenuItem {
  id: string;
  name: string;
  category: 'drink' | 'food';
  price: number;
  points: number;
}
