/**
 * Screen 1: Order Taking (venue staff, mobile-first).
 * Uses design system OrderList, OrderListItem, OrderListSummary. "Make a selection" layout per screenshot.
 * When used after team selection: initialTable set, "Change table" with icon; else table dropdown.
 */
import React, { useState, useCallback, useMemo } from 'react';
import { Button, OrderList, OrderListItem, OrderListSummary } from '@tomlievens/design-system';
import { RotateCcw, Send, Ticket } from 'lucide-react';
import { useMenu } from '../store/menu-context';
import { useTables } from '../store/tables-context';
import { useOrders } from '../store/orders-context';
import { Toast } from '../components/Toast';
import { SearchableTableDropdown } from '../components/SearchableTableDropdown';
import type { OrderItem } from '../types';
import type { MenuItem, Table } from '../types';
import './OrderTakingScreen.css';

/** Placeholder image for menu items without image (design system OrderListItem requires imageSrc). */
const PLACEHOLDER_IMAGE =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48'%3E%3Crect fill='%23e5e7eb' width='48' height='48'/%3E%3C/svg%3E";

/** Format amount as bonnetjes (vouchers); amount stays numeric. */
function formatBonnetjes(amount: number): string {
  return `${amount.toFixed(0)} bonnetjes`;
}

type CartLine = { itemId: string; name: string; quantity: number; price: number; points: number };

export type OrderTakingScreenProps = {
  /** When set, table is fixed (from team selection); show "Change table" instead of dropdown. */
  initialTable?: Table | null;
  /** Called when user chooses to change table (back to team selection). */
  onBackToTeamSelection?: () => void;
};

export const OrderTakingScreen: React.FC<OrderTakingScreenProps> = (props) => {
  const { initialTable = null, onBackToTeamSelection } = props;
  const { menuItems, loading: menuLoading, error: menuError, clearError: clearMenuError } = useMenu();
  const { tables, loading: tablesLoading } = useTables();
  const { submitOrder, firebaseError, clearFirebaseError } = useOrders();

  const [selectedTable, setSelectedTable] = useState<Table | null>(initialTable ?? null);
  const isFromTeamSelection = initialTable != null && onBackToTeamSelection != null;
  const effectiveTable = isFromTeamSelection ? initialTable : selectedTable;
  const [cart, setCart] = useState<CartLine[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const { drinks: drinkItems, food: foodItems } = useMemo(() => {
    const d: MenuItem[] = [];
    const f: MenuItem[] = [];
    for (const item of menuItems) {
      if (item.category === 'drink') d.push(item);
      else f.push(item);
    }
    return { drinks: d, food: f };
  }, [menuItems]);

  const setQuantity = useCallback((item: MenuItem, value: number) => {
    const nextQty = Math.max(0, value);
    setCart((prev) => {
      if (nextQty === 0) {
        return prev.filter((c) => c.itemId !== item.id);
      }
      const line: CartLine = {
        itemId: item.id,
        name: item.name,
        quantity: nextQty,
        price: item.price,
        points: item.points,
      };
      const rest = prev.filter((c) => c.itemId !== item.id);
      return [...rest, line];
    });
  }, []);

  const orderItems: OrderItem[] = useMemo(
    () =>
      cart.map((c) => ({
        itemId: c.itemId,
        name: c.name,
        quantity: c.quantity,
        price: c.price,
        points: c.points,
      })),
    [cart]
  );
  const totalPrice = useMemo(() => cart.reduce((sum, c) => sum + c.quantity * c.price, 0), [cart]);
  const totalPoints = useMemo(() => cart.reduce((sum, c) => sum + c.quantity * c.points, 0), [cart]);

  const handleSubmit = useCallback(async () => {
    if (!effectiveTable || orderItems.length === 0) return;
    setSubmitting(true);
    setSuccessMessage(null);
    try {
      await submitOrder({
        tableId: effectiveTable.id,
        tableNumber: effectiveTable.tableNumber,
        teamName: effectiveTable.teamName,
        items: orderItems,
        totalPrice,
        totalPoints,
      });
      setSuccessMessage(`Bestelling verzonden voor ${effectiveTable.teamName} (Tafel ${effectiveTable.tableNumber})`);
      setCart([]);
    } catch {
      // Error shown via firebaseError toast
    } finally {
      setSubmitting(false);
    }
  }, [effectiveTable, orderItems, totalPrice, totalPoints, submitOrder]);

  const loading = menuLoading || tablesLoading;

  return (
    <>
      {!isFromTeamSelection && (
        <section className="section" aria-labelledby="select-table-heading">
          <h2 id="select-table-heading" className="section__title">
            Selecteer tafel
          </h2>
          {tablesLoading ? (
            <p className="empty-state" role="status">
              Tafels laden…
            </p>
          ) : (
            <SearchableTableDropdown
              label="Team of tafelnummer"
              tables={tables}
              value={selectedTable}
              onChange={setSelectedTable}
              placeholder="Zoek team of tafel"
            />
          )}
        </section>
      )}

      {menuError && (
        <Toast
          message={menuError.message}
          variant="error"
          durationMs={5000}
          onDismiss={clearMenuError}
        />
      )}

      {loading ? (
        <p className="empty-state" role="status">
          Menu laden…
        </p>
      ) : menuItems.length === 0 ? (
        <p className="empty-state" role="status">
          Geen menu-items. Voeg items toe in Firebase (menuItems-collectie).
        </p>
      ) : (
        <div className="order-taking">
          {!isFromTeamSelection && effectiveTable && (
            <p className="order-taking__for-table" role="status">
              Bestelling voor <strong>{effectiveTable.teamName}</strong> (Tafel {effectiveTable.tableNumber})
            </p>
          )}

          <h1 id="order-taking-heading" className="order-taking__title">
            Maak een keuze
          </h1>

          {isFromTeamSelection && effectiveTable && onBackToTeamSelection && (
            <div className="order-taking__header-row order-taking__header-row--below-title">
              <p className="order-taking__subtitle" role="status">
                Bestelling voor <strong>{effectiveTable.teamName}</strong> (Tafel {effectiveTable.tableNumber})
              </p>
              <Button
                variant="link"
                size="small"
                onClick={onBackToTeamSelection}
                showLeftIcon
                iconLeft={RotateCcw as React.ComponentProps<typeof Button>['iconLeft']}
              >
                Tafel wijzigen
              </Button>
            </div>
          )}

          <section className="order-taking__section" aria-labelledby="drinks-heading">
            <h2 id="drinks-heading" className="order-taking__section-title">
              Dranken
            </h2>
            {drinkItems.length === 0 ? (
              <p className="empty-state" role="status">
                Geen dranken in het menu.
              </p>
            ) : (
              <OrderList>
                {drinkItems.map((item) => {
                  const line = cart.find((c) => c.itemId === item.id);
                  const qty = line?.quantity ?? 0;
                  return (
                    <OrderListItem
                      key={item.id}
                      imageSrc={PLACEHOLDER_IMAGE}
                      imageAlt=""
                      title={item.name}
                      priceIcon={<Ticket />}
                      price={formatBonnetjes(item.price)}
                      points={`${item.points} pts`}
                      quantity={qty}
                      onQuantityChange={(value) => setQuantity(item, value)}
                    />
                  );
                })}
              </OrderList>
            )}
          </section>

          <section className="order-taking__section" aria-labelledby="food-heading">
            <h2 id="food-heading" className="order-taking__section-title">
              Eten
            </h2>
            {foodItems.length === 0 ? (
              <p className="empty-state" role="status">
                Geen eten in het menu.
              </p>
            ) : (
              <OrderList>
                {foodItems.map((item) => {
                  const line = cart.find((c) => c.itemId === item.id);
                  const qty = line?.quantity ?? 0;
                  return (
                    <OrderListItem
                      key={item.id}
                      imageSrc={PLACEHOLDER_IMAGE}
                      imageAlt=""
                      title={item.name}
                      priceIcon={<Ticket />}
                      price={formatBonnetjes(item.price)}
                      points={`${item.points} pts`}
                      quantity={qty}
                      onQuantityChange={(value) => setQuantity(item, value)}
                    />
                  );
                })}
              </OrderList>
            )}
          </section>

          <footer className="order-taking__footer">
            <OrderListSummary
              label="Totaal"
              totalPriceIcon={<Ticket />}
              totalPrice={formatBonnetjes(totalPrice)}
              totalPoints={`${totalPoints} pts`}
              itemCount={`${orderItems.reduce((s, i) => s + i.quantity, 0)} stuks`}
            />
            <Button
              variant="primary"
              onClick={handleSubmit}
              state={submitting || orderItems.length === 0 || !effectiveTable ? 'disabled' : 'default'}
              showRightIcon
              iconRight={Send as React.ComponentProps<typeof Button>['iconRight']}
              className="order-taking__confirm-btn"
            >
              {submitting ? 'Versturen…' : 'Bevestigen'}
            </Button>
          </footer>
        </div>
      )}

      {firebaseError && (
        <Toast
          message={firebaseError.message}
          variant="error"
          durationMs={5000}
          onDismiss={clearFirebaseError}
        />
      )}

      {successMessage && (
        <Toast
          message={successMessage}
          variant="success"
          durationMs={5000}
          onDismiss={() => setSuccessMessage(null)}
        />
      )}
    </>
  );
};
