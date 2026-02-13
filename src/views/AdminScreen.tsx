/**
 * Admin screen: edit menu (drinks/food) and teams/tables. Reset orders.
 * Uses design system Card variant="editable" for each item.
 */
import { useState, useEffect } from 'react';
import { Button, Card } from '@tomlievens/design-system';
import { useMenu } from '../store/menu-context';
import { useTables } from '../store/tables-context';
import { useOrders } from '../store/orders-context';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { Toast } from '../components/Toast';
import type { MenuItem, Table } from '../types';
import './AdminScreen.css';

type DeleteTarget = { type: 'menu'; item: MenuItem } | { type: 'table'; table: Table };

export function AdminScreen() {
  const { menuItems, updateMenuItem, addMenuItem, deleteMenuItem } = useMenu();
  const { tables, updateTable, addTable, deleteTable } = useTables();
  const { resetOrders, isFirebase, firebaseError } = useOrders();

  const [resetting, setResetting] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [savedToastMessage, setSavedToastMessage] = useState<string | null>(null);

  const drinks = menuItems.filter((m) => m.category === 'drink');
  const food = menuItems.filter((m) => m.category === 'food');

  const handleReset = async () => {
    if (!window.confirm('Alle bestellingen verwijderen en opnieuw beginnen? Dit kan niet ongedaan worden gemaakt.')) return;
    setResetting(true);
    setResetDone(false);
    try {
      await resetOrders();
      setResetDone(true);
    } finally {
      setResetting(false);
    }
  };

  const handleAddDrink = () => {
    addMenuItem({ name: 'Nieuwe drank', category: 'drink', price: 0, points: 0 });
  };

  const handleAddFood = () => {
    addMenuItem({ name: 'Nieuw eten', category: 'food', price: 0, points: 0 });
  };

  const handleAddTeam = () => {
    addTable({ teamName: 'Nieuw team', tableNumber: '0' });
  };

  return (
    <section className="section admin" aria-labelledby="admin-heading">
      <h1 id="admin-heading" className="admin__title">
        Beheer
      </h1>

      {/* Reset orders */}
      <div className="admin-block">
        <h2 className="admin-block__title">Bestellingen resetten</h2>
        <p className="admin-block__desc">
          {isFirebase
            ? 'Verwijder alle bestellingen in Firebase en leeg de app. Gebruik dit om met een schone database te starten.'
            : 'Wis alle bestellingen uit de lokale opslag. Gebruik dit om opnieuw te starten.'}
        </p>
        <Button variant="secondary" destructive onClick={handleReset} state={resetting ? 'disabled' : 'default'}>
          {resetting ? 'Bezig met resetten…' : 'Alle bestellingen resetten'}
        </Button>
        {resetDone && <p className="admin-block__status" role="status">Alle bestellingen gewist.</p>}
        {firebaseError && <p className="admin-block__error" role="alert">{firebaseError.message}</p>}
      </div>

      {/* Menu: Drinks */}
      <div className="admin-block">
        <h2 className="admin-block__title">Dranken</h2>
        <p className="admin-block__desc">Bewerk bonnetjes en punten, of verwijder. Wijzigingen gelden voor nieuwe bestellingen.</p>
        <ul className="admin-card-list" aria-label="Dranken">
          {drinks.map((item) => (
            <li key={item.id} className="admin-card-list__item">
              <MenuCard
                item={item}
                onUpdate={updateMenuItem}
                onSaved={() => setSavedToastMessage('Opgeslagen')}
                onDeleteRequest={() => setDeleteTarget({ type: 'menu', item })}
              />
            </li>
          ))}
        </ul>
        <Button variant="secondary" onClick={handleAddDrink} state="default">
          Drank toevoegen
        </Button>
      </div>

      {/* Menu: Food */}
      <div className="admin-block">
        <h2 className="admin-block__title">Eten</h2>
        <p className="admin-block__desc">Bewerk bonnetjes en punten, of verwijder. Wijzigingen gelden voor nieuwe bestellingen.</p>
        <ul className="admin-card-list" aria-label="Eten">
          {food.map((item) => (
            <li key={item.id} className="admin-card-list__item">
              <MenuCard
                item={item}
                onUpdate={updateMenuItem}
                onSaved={() => setSavedToastMessage('Opgeslagen')}
                onDeleteRequest={() => setDeleteTarget({ type: 'menu', item })}
              />
            </li>
          ))}
        </ul>
        <Button variant="secondary" onClick={handleAddFood} state="default">
          Eten toevoegen
        </Button>
      </div>

      {/* Teams / Tables */}
      <div className="admin-block">
        <h2 className="admin-block__title">Teams en tafelnummers</h2>
        <p className="admin-block__desc">Bewerk teamnaam en tafelnummer, of verwijder. Wordt gebruikt op Bestelling- en Bar-schermen.</p>
        <ul className="admin-card-list" aria-label="Teams">
          {tables.map((table) => (
            <li key={table.id} className="admin-card-list__item">
              <TableCard
                table={table}
                onUpdate={updateTable}
                onSaved={() => setSavedToastMessage('Opgeslagen')}
                onDeleteRequest={() => setDeleteTarget({ type: 'table', table })}
              />
            </li>
          ))}
        </ul>
        <Button variant="secondary" onClick={handleAddTeam} state="default">
          Team toevoegen
        </Button>
      </div>

      {deleteTarget &&
        (deleteTarget.type === 'menu' ? (
          <ConfirmDeleteModal
            title="Menu-item verwijderen?"
            description={`Weet je zeker dat je "${deleteTarget.item.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
            confirmLabel="Verwijderen"
            onConfirm={async () => {
              await deleteMenuItem(deleteTarget.item.id);
              setDeleteTarget(null);
            }}
            onCancel={() => setDeleteTarget(null)}
          />
        ) : (
          <ConfirmDeleteModal
            title="Team verwijderen?"
            description={`Weet je zeker dat je team "${deleteTarget.table.teamName}" (Tafel ${deleteTarget.table.tableNumber}) wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`}
            confirmLabel="Verwijderen"
            onConfirm={async () => {
              await deleteTable(deleteTarget.table.id);
              setDeleteTarget(null);
            }}
            onCancel={() => setDeleteTarget(null)}
          />
        ))}
      {savedToastMessage && (
        <Toast
          message={savedToastMessage}
          variant="success"
          durationMs={3000}
          onDismiss={() => setSavedToastMessage(null)}
        />
      )}
    </section>
  );
}

function MenuCard({
  item,
  onUpdate,
  onSaved,
  onDeleteRequest,
}: {
  item: MenuItem;
  onUpdate: (id: string, data: Partial<Pick<MenuItem, 'name' | 'price' | 'points'>>) => void | Promise<void>;
  onSaved: () => void;
  onDeleteRequest: () => void;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.price));
  const [points, setPoints] = useState(String(item.points));
  const [isEditing, setIsEditing] = useState(false);
  const [, setSaving] = useState(false);

  useEffect(() => {
    setName(item.name);
    setPrice(String(item.price));
    setPoints(String(item.points));
  }, [item.name, item.price, item.points]);

  const handleSave = async () => {
    const trimmedName = name.trim();
    const priceNum = parseFloat(price);
    const pointsNum = parseInt(points, 10);
    if (!trimmedName) return;
    if (Number.isNaN(priceNum) || priceNum < 0) return;
    if (Number.isNaN(pointsNum) || pointsNum < 0) return;
    setSaving(true);
    try {
      await Promise.resolve(onUpdate(item.id, { name: trimmedName, price: priceNum, points: pointsNum }));
      onSaved();
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setName(item.name);
    setPrice(String(item.price));
    setPoints(String(item.points));
    setIsEditing(false);
  };

  return (
    <Card
      variant="editable"
      title={isEditing ? name : item.name}
      isEditing={isEditing}
      viewFields={[
        { id: 'price', label: 'Bonnetjes', value: `${Number(price).toFixed(0)} bonnetjes` },
        { id: 'points', label: 'Punten', value: `${points} pts` },
      ]}
      onEditClick={() => setIsEditing(true)}
      onDeleteClick={onDeleteRequest}
      editFields={[
        { id: 'name', label: 'Naam', value: name, required: true, onChange: (v) => setName(v) },
        { id: 'price', label: 'Bonnetjes', value: price, required: true, onChange: (v) => setPrice(v) },
        { id: 'points', label: 'Punten', value: points, required: true, onChange: (v) => setPoints(v) },
      ]}
      onSaveEdit={handleSave}
      onCancelEdit={handleCancel}
      className="admin-card"
    />
  );
}

function TableCard({
  table,
  onUpdate,
  onSaved,
  onDeleteRequest,
}: {
  table: Table;
  onUpdate: (id: string, data: Partial<Pick<Table, 'teamName' | 'tableNumber'>>) => void | Promise<void>;
  onSaved: () => void;
  onDeleteRequest: () => void;
}) {
  const [teamName, setTeamName] = useState(table.teamName);
  const [tableNumber, setTableNumber] = useState(table.tableNumber);
  const [isEditing, setIsEditing] = useState(false);
  const [, setSaving] = useState(false);

  useEffect(() => {
    setTeamName(table.teamName);
    setTableNumber(table.tableNumber);
  }, [table.teamName, table.tableNumber]);

  const handleSave = async () => {
    const trimmedName = teamName.trim();
    const trimmedNumber = tableNumber.trim();
    if (!trimmedName) return;
    setSaving(true);
    try {
      await Promise.resolve(
        onUpdate(table.id, { teamName: trimmedName, tableNumber: trimmedNumber || table.tableNumber })
      );
      onSaved();
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setTeamName(table.teamName);
    setTableNumber(table.tableNumber);
    setIsEditing(false);
  };

  return (
    <Card
      variant="editable"
      title={isEditing ? teamName : table.teamName}
      isEditing={isEditing}
      viewFields={[{ id: 'table', label: 'Tafelnummer', value: table.tableNumber }]}
      onEditClick={() => setIsEditing(true)}
      onDeleteClick={onDeleteRequest}
      editFields={[
        { id: 'teamName', label: 'Teamnaam', value: teamName, required: true, onChange: (v) => setTeamName(v) },
        { id: 'tableNumber', label: 'Tafelnummer', value: tableNumber, onChange: (v) => setTableNumber(v) },
      ]}
      onSaveEdit={handleSave}
      onCancelEdit={handleCancel}
      className="admin-card"
    />
  );
}
