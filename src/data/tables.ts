/**
 * Single source of truth for teams and table numbers.
 * Used by: Order Taking (table dropdown), Bar Orders (table display), and when submitting orders.
 * Edit this file to change the venue; later this can be moved to Admin / Firebase.
 */
import type { Table } from '../types';

export const TABLES: Table[] = [
  { id: 'table-1', tableNumber: '1', teamName: 'Trivia Titans' },
  { id: 'table-2', tableNumber: '2', teamName: 'Quiz Masters' },
  { id: 'table-3', tableNumber: '3', teamName: 'Brain Trust' },
  { id: 'table-4', tableNumber: '4', teamName: 'The Think Tank' },
  { id: 'table-5', tableNumber: '5', teamName: 'Smart Cookies' },
  { id: 'table-6', tableNumber: '6', teamName: 'Quizzy Bees' },
  { id: 'table-7', tableNumber: '7', teamName: 'Fact Finders' },
  { id: 'table-8', tableNumber: '8', teamName: 'Know It Alls' },
];
