/**
 * Screen 2: Bar Order Management. Uses design system OrderCard. Item names from current menu (by itemId).
 */
import { useMemo, useState } from 'react';
import { SegmentedButtons, OrderCard as DSOrderCard, SearchField } from '@tomlievens/design-system';
import { Bell, Clock } from 'lucide-react';
import type { OrderCardState } from '@tomlievens/design-system';
import { useOrders } from '../store/orders-context';
import { useTables } from '../store/tables-context';
import { useMenu } from '../store/menu-context';
import type { Order, OrderItem, OrderStatus } from '../types';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import './BarOrdersScreen.css';

export type EditLine = { itemId: string; name: string; quantity: number; price: number; points: number };

/** Order time for design system OrderCard (e.g. "14:30"). */
function formatOrderTime(ms: number): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(ms));
}

/** Resolve display name for an order line (current menu name or snapshot). */
function getLineDisplayName(item: OrderItem, menuById: Map<string, { name: string }>): string {
  return menuById.get(item.itemId)?.name ?? item.name;
}

/** Map Firebase order status to design system OrderCard state. */
function orderStatusToCardState(status: OrderStatus): OrderCardState {
  if (status === 'new') return 'incoming';
  if (status === 'in_progress') return 'preparing';
  return 'done';
}

type BarOrderCardWrapperProps = {
  order: Order;
  tableNumber: string;
  menuById: Map<string, { name: string; price: number; points: number }>;
  isIncoming: boolean;
  isEditing: boolean;
  draftItems: EditLine[];
  onPreparingOrComplete: (orderId: string) => void;
  onUndoPreparing: (orderId: string) => void;
  onDelete: (order: Order) => void;
  onEditStart: (order: Order) => void;
  onEditCancel: () => void;
  onDraftChange: (items: EditLine[]) => void;
  onEditSave: (orderId: string, items: EditLine[]) => void;
};

function BarOrderCardWrapper({
  order,
  tableNumber,
  menuById,
  isIncoming,
  isEditing,
  draftItems,
  onPreparingOrComplete,
  onUndoPreparing,
  onDelete,
  onEditStart,
  onEditCancel,
  onDraftChange,
  onEditSave,
}: BarOrderCardWrapperProps) {
  const items = isEditing ? draftItems : order.items;
  const cardItems = items.map((item) => ({
    id: item.itemId,
    name: isEditing ? item.name : getLineDisplayName(item, menuById),
    quantity: item.quantity,
  }));

  const handleQuantityChange = (itemId: string, quantity: number) => {
    const idx = draftItems.findIndex((d) => d.itemId === itemId);
    if (idx < 0) return;
    const next = [...draftItems];
    if (quantity <= 0) {
      next.splice(idx, 1);
    } else {
      next[idx] = { ...next[idx], quantity };
    }
    onDraftChange(next);
  };

  const handleSave = () => {
    const toSave = draftItems.filter((l) => l.quantity > 0);
    if (toSave.length > 0) onEditSave(order.id, toSave);
  };

  return (
    <DSOrderCard
      state={orderStatusToCardState(order.status)}
      tableName={`Tafel ${tableNumber}`}
      subtitle={order.teamName}
      orderTime={formatOrderTime(order.createdAt)}
      orderCreatedAt={order.createdAt}
      items={cardItems}
      isEditing={isEditing}
      onStartPreparing={
        order.status === 'new' ? () => onPreparingOrComplete(order.id) : undefined
      }
      onMarkDone={
        order.status === 'in_progress' ? () => onPreparingOrComplete(order.id) : undefined
      }
      onUndoPreparing={
        order.status === 'in_progress' ? () => onUndoPreparing(order.id) : undefined
      }
      onEditClick={isIncoming ? () => onEditStart(order) : undefined}
      onDeleteClick={isIncoming ? () => onDelete(order) : undefined}
      onQuantityChange={handleQuantityChange}
      onSaveEdit={handleSave}
      onCancelEdit={onEditCancel}
    />
  );
}

type BarView = 'incoming' | 'finished';

const BAR_SEGMENTS = [
  { value: 'incoming', label: 'Nieuw', icon: Bell },
  { value: 'finished', label: 'Afgerond', icon: Clock },
];

export function BarOrdersScreen() {
  const { orders, setOrderStatus, deleteOrder, updateOrder } = useOrders();
  const { tables } = useTables();
  const { menuItems } = useMenu();
  const [barView, setBarView] = useState<BarView>('incoming');
  const [finishedSearchQuery, setFinishedSearchQuery] = useState('');
  const [editingOrderId, setEditingOrderId] = useState<string | null>(null);
  const [editingDraft, setEditingDraft] = useState<EditLine[]>([]);
  const [deleteConfirmOrder, setDeleteConfirmOrder] = useState<Order | null>(null);

  const menuById = useMemo(() => {
    const map = new Map<string, { name: string; price: number; points: number }>();
    for (const m of menuItems) map.set(m.id, { name: m.name, price: m.price, points: m.points });
    return map;
  }, [menuItems]);

  /**
   * Lookups from current tables — same source as Order screen dropdown.
   * By teamName first so table number stays correct if admin renames.
   */
  const tableByTeamName = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tables) map.set(t.teamName, t.tableNumber);
    return map;
  }, [tables]);
  const tableById = useMemo(() => {
    const map = new Map<string, string>();
    for (const t of tables) map.set(t.id, t.tableNumber);
    return map;
  }, [tables]);

  /** Resolve table number: current config by team name (single source of truth), then by tableId, then stored. */
  const getTableNumber = (order: Order) =>
    tableByTeamName.get(order.teamName) ?? tableById.get(order.tableId) ?? order.tableNumber ?? '?';

  const incomingOrders = useMemo(
    () => [...orders].filter((o) => o.status === 'new' || o.status === 'in_progress').reverse(),
    [orders]
  );
  const finishedOrders = useMemo(
    () => [...orders].filter((o) => o.status === 'done').reverse(),
    [orders]
  );
  const finishedFiltered = useMemo(() => {
    if (!finishedSearchQuery.trim()) return finishedOrders;
    const q = finishedSearchQuery.trim().toLowerCase();
    return finishedOrders.filter((order) => {
      const tableNum =
        tableByTeamName.get(order.teamName) ?? tableById.get(order.tableId) ?? order.tableNumber ?? '?';
      const team = (order.teamName ?? '').toLowerCase();
      return team.includes(q) || String(tableNum).toLowerCase().includes(q);
    });
  }, [finishedOrders, finishedSearchQuery, tableByTeamName, tableById]);
  const list = barView === 'incoming' ? incomingOrders : finishedFiltered;

  const handlePreparingOrComplete = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    const next: OrderStatus = order.status === 'new' ? 'in_progress' : 'done';
    await setOrderStatus(orderId, next);
  };

  const handleUndoPreparing = async (orderId: string) => {
    await setOrderStatus(orderId, 'new');
  };

  const handleDeleteClick = (order: Order) => {
    setDeleteConfirmOrder(order);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmOrder) return;
    await deleteOrder(deleteConfirmOrder.id);
    setDeleteConfirmOrder(null);
  };

  const handleEditStart = (order: Order) => {
    setEditingOrderId(order.id);
    setEditingDraft(
      order.items.map((i) => {
        const m = menuById.get(i.itemId);
        return {
          itemId: i.itemId,
          name: m?.name ?? i.name,
          quantity: i.quantity,
          price: m?.price ?? i.price,
          points: m?.points ?? i.points,
        };
      })
    );
  };

  const handleEditCancel = () => {
    setEditingOrderId(null);
    setEditingDraft([]);
  };

  const handleEditSave = async (orderId: string, items: EditLine[]) => {
    const sanitized = items.map((i) => ({
      itemId: String(i.itemId ?? ''),
      name: String(i.name ?? ''),
      quantity: Number(i.quantity) || 0,
      price: Number(i.price) ?? 0,
      points: Number(i.points) ?? 0,
    }));
    const totalPrice = sanitized.reduce((sum, i) => sum + i.quantity * i.price, 0);
    const totalPoints = sanitized.reduce((sum, i) => sum + i.quantity * i.points, 0);
    await updateOrder(orderId, {
      items: sanitized,
      totalPrice,
      totalPoints,
    });
    setEditingOrderId(null);
    setEditingDraft([]);
  };

  return (
    <>
      <section className="section bar-orders" aria-labelledby="bar-orders-heading">
        <div className="bar-orders__header">
          <h1 id="bar-orders-heading" className="bar-orders__title">
            Bar-bestellingen
          </h1>
          <div className="bar-orders__sub-nav">
            <SegmentedButtons
              options={BAR_SEGMENTS as Parameters<typeof SegmentedButtons>[0]['options']}
              value={barView}
              onChange={(v) => setBarView(v as BarView)}
              aria-label="Nieuw of afgerond"
            />
          </div>
        </div>
        {barView === 'finished' && (
          <div className="bar-orders__search">
            <SearchField
              label="Zoeken"
              placeholder="Team of tafelnummer…"
              value={finishedSearchQuery}
              onChange={(e) => setFinishedSearchQuery(e.target.value)}
            />
          </div>
        )}
        <p className="bar-orders__subtitle" role="status">
          {list.length} {list.length === 1 ? 'bestelling' : 'bestellingen'}
          {barView === 'incoming' ? ' • Oudste eerst' : ''}
        </p>
        {list.length === 0 ? (
          <p className="empty-state" role="status">
            {barView === 'incoming'
              ? 'Geen binnenkomende bestellingen. Bestellingen verschijnen hier wanneer ze vanaf het bestelscherm worden verzonden.'
              : 'Nog geen afgeronde bestellingen.'}
          </p>
        ) : (
          <div className="bar-orders__list" role="list" aria-label={`${list.length} orders`}>
            <div className="bar-orders__timeline">
              <div className="bar-orders__timeline-track" aria-hidden />
              {list.map((order, index) => {
                const isLeft = index % 2 === 0;
                const card = (
                  <BarOrderCardWrapper
                    order={order}
                    tableNumber={getTableNumber(order)}
                    menuById={menuById}
                    isIncoming={barView === 'incoming'}
                    isEditing={editingOrderId === order.id}
                    draftItems={editingOrderId === order.id ? editingDraft : []}
                    onPreparingOrComplete={handlePreparingOrComplete}
                    onUndoPreparing={handleUndoPreparing}
                    onDelete={handleDeleteClick}
                    onEditStart={handleEditStart}
                    onEditCancel={handleEditCancel}
                    onDraftChange={setEditingDraft}
                    onEditSave={handleEditSave}
                  />
                );
                return (
                  <div
                    key={order.id}
                    className="bar-orders__timeline-row"
                    role="listitem"
                  >
                    <div className="bar-orders__timeline-side bar-orders__timeline-side--left">
                      {isLeft && (
                        <>
                          <div className="bar-orders__timeline-card-wrap">
                            {card}
                          </div>
                          <div className="bar-orders__timeline-connector" aria-hidden />
                        </>
                      )}
                    </div>
                    <div className="bar-orders__timeline-node" aria-hidden />
                    <div className="bar-orders__timeline-side bar-orders__timeline-side--right">
                      {!isLeft && (
                        <>
                          <div className="bar-orders__timeline-connector" aria-hidden />
                          <div className="bar-orders__timeline-card-wrap">
                            {card}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>
      {deleteConfirmOrder && (
        <ConfirmDeleteModal
          title="Bestelling verwijderen?"
          description={`Weet je zeker dat je deze bestelling wilt verwijderen? Tafel ${getTableNumber(deleteConfirmOrder)} • ${deleteConfirmOrder.teamName}. Dit kan niet ongedaan worden gemaakt.`}
          confirmLabel="Bestelling verwijderen"
          onConfirm={handleDeleteConfirm}
          onCancel={() => setDeleteConfirmOrder(null)}
        />
      )}
    </>
  );
}
