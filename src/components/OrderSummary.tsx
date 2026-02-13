/**
 * Order summary: item count, total price, total points for team, Send Order to Bar button.
 * Design system: Button. For Order Taking screen.
 */
import { Send } from 'lucide-react';
import { Button } from '@tomlievens/design-system';
import type { OrderItem } from '../types';

function formatPrice(dollars: number): string {
  return `$${dollars.toFixed(2)}`;
}

export type OrderSummaryProps = {
  items: OrderItem[];
  totalPrice: number;
  totalPoints: number;
  teamName: string | null;
  onSubmit: () => void;
  submitLabel?: string;
  disabled?: boolean;
};

export function OrderSummary({
  items,
  totalPrice,
  totalPoints,
  teamName,
  onSubmit,
  submitLabel = 'Send Order to Bar',
  disabled = false,
}: OrderSummaryProps) {
  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  if (itemCount === 0) {
    return (
      <p className="empty-state" role="status">
        Cart is empty. Add drinks or food above.
      </p>
    );
  }

  return (
    <section className="section order-summary" aria-labelledby="order-summary-heading">
      <h2 id="order-summary-heading" className="section__title">
        Order summary
      </h2>
      <p className="order-summary__line" role="status">
        {itemCount} {itemCount === 1 ? 'item' : 'items'}
      </p>
      <p className="order-summary__line order-summary__totals">
        {formatPrice(totalPrice)}
        {totalPoints > 0 && (
          <>
            {' · '}
            {totalPoints} {totalPoints === 1 ? 'point' : 'points'}
            {teamName && ` for ${teamName}`}
          </>
        )}
      </p>
      <div style={{ marginTop: 'var(--padding-default)' }}>
        <Button
          variant="primary"
          onClick={onSubmit}
          state={disabled ? 'disabled' : 'default'}
          showRightIcon
          iconRight={Send as Parameters<typeof Button>[0]['iconRight']}
        >
          {submitLabel}
        </Button>
      </div>
    </section>
  );
}
