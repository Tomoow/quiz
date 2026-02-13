/**
 * Menu item row: name, bonnetjes (voucher icon + amount), points badge, quantity stepper.
 * Design system: Badge (points), IconButton (minus/plus).
 */
import { Minus, Plus, Ticket } from 'lucide-react';
import { Badge, IconButton } from '@tomlievens/design-system';

export type MenuItemRowProps = {
  name: string;
  price: number;
  points: number;
  quantity: number;
  onIncrease: () => void;
  onDecrease: () => void;
  disabled?: boolean;
};

function formatBonnetjes(amount: number): string {
  return `${amount.toFixed(0)} bonnetjes`;
}

export function MenuItemRow({
  name,
  price,
  points,
  quantity,
  onIncrease,
  onDecrease,
  disabled = false,
}: MenuItemRowProps) {
  return (
    <div className="menu-item">
      <div className="menu-item__info">
        <span className="menu-item__label">{name}</span>
        <span className="menu-item__price">
          <Ticket className="menu-item__price-icon" aria-hidden />
          {formatBonnetjes(price)}
        </span>
        <Badge variant="warning" size="small" showIcon={false}>
          {points} pts
        </Badge>
      </div>
      <div className="stepper">
        <IconButton
          icon={Minus as Parameters<typeof IconButton>[0]['icon']}
          variant="default"
          aria-label={`Decrease quantity of ${name}`}
          onClick={onDecrease}
          state={quantity === 0 || disabled ? 'disabled' : 'default'}
        />
        <span className="stepper__value" aria-live="polite">
          {quantity}
        </span>
        <IconButton
          icon={Plus as Parameters<typeof IconButton>[0]['icon']}
          variant="default"
          aria-label={`Increase quantity of ${name}`}
          onClick={onIncrease}
          state={disabled ? 'disabled' : 'default'}
        />
      </div>
    </div>
  );
}
