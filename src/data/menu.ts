/**
 * Local menu items (drinks and food). Only orders are stored in Firebase.
 * Edit this file to change the venue menu. Used as fallback and to seed Firebase when empty.
 */
import type { MenuItem } from '../types';

export const MENU_ITEMS: MenuItem[] = [
  { id: 'drink-beer', name: 'Bier', category: 'drink', price: 6.5, points: 10 },
  { id: 'drink-wine', name: 'Wijn', category: 'drink', price: 8, points: 12 },
  { id: 'drink-soft', name: 'Frisdrank', category: 'drink', price: 3.5, points: 5 },
  { id: 'drink-cocktail', name: 'Cocktail', category: 'drink', price: 12, points: 20 },
  { id: 'food-nachos', name: "Nacho's", category: 'food', price: 8.5, points: 15 },
  { id: 'food-pizza', name: 'Pizzapunt', category: 'food', price: 5, points: 8 },
  { id: 'food-hotdog', name: 'Hotdog', category: 'food', price: 6, points: 10 },
];
