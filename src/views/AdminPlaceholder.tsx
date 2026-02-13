/**
 * Placeholder for Screen 4: Admin Configuration. Reset orders for a fresh start.
 */
import { useState } from 'react';
import { Button } from '@tomlievens/design-system';
import { useOrders } from '../store/orders-context';

export function AdminPlaceholder() {
  const { resetOrders, isFirebase, firebaseError } = useOrders();
  const [resetting, setResetting] = useState(false);
  const [done, setDone] = useState(false);

  const handleReset = async () => {
    if (!window.confirm('Delete all orders and start fresh? This cannot be undone.')) return;
    setResetting(true);
    setDone(false);
    try {
      await resetOrders();
      setDone(true);
    } finally {
      setResetting(false);
    }
  };

  return (
    <section className="section" aria-labelledby="admin-heading">
      <h1 id="admin-heading" className="bar-orders__title" style={{ fontFamily: 'var(--font-family-heading)' }}>
        Admin
      </h1>
      <p className="empty-state" role="status">
        Admin screen – more options coming soon.
      </p>
      <div className="admin-reset">
        <h2 className="admin-reset__title" style={{ fontFamily: 'var(--font-family-heading)', fontSize: 'var(--font-size-md)' }}>
          Reset orders
        </h2>
        <p className="admin-reset__desc" style={{ fontSize: 'var(--font-size-sm)', color: 'var(--text-neutral-subtle)', marginBottom: 'var(--padding-default)' }}>
          {isFirebase
            ? 'Delete all orders in Firebase and clear the app. Use this to start with a fresh database.'
            : 'Clear all orders from local storage. Use this to start fresh.'}
        </p>
        <Button
          variant="secondary"
          destructive
          onClick={handleReset}
          state={resetting ? 'disabled' : 'default'}
        >
          {resetting ? 'Resetting…' : 'Reset all orders'}
        </Button>
        {done && <p role="status" style={{ marginTop: 'var(--padding-default)', fontSize: 'var(--font-size-sm)', color: 'var(--text-neutral-subtle)' }}>All orders cleared. You can create new orders from the Orders screen.</p>}
        {firebaseError && <p role="alert" style={{ marginTop: 'var(--padding-default)', fontSize: 'var(--font-size-sm)', color: 'var(--text-destructive-default)' }}>{firebaseError.message}</p>}
      </div>
    </section>
  );
}
