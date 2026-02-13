/**
 * App shell: design-system Header (logo | nav | account dropdown). Firebase: orders.
 */
import { useState, useRef, useEffect } from 'react';
import { Header, Toast } from '@tomlievens/design-system';
import type { HeaderNavItem } from '@tomlievens/design-system';
import { PlusSquare, ConciergeBell, Crown, Settings, LogOut } from 'lucide-react';
import { useOrders } from './store/orders-context';
import {
  TeamSelectionScreen,
  BarOrdersScreen,
  RankingScreen,
  AdminScreen,
} from './views';
import { OrderTakingScreen } from './views/OrderTakingScreen';
import type { Table } from './types';
import './App.css';

type AppScreen = 'orders' | 'bar' | 'ranking' | 'admin';
type OrderFlowStep = 'team-selection' | 'order';

const PASSWORD_STORAGE_KEY = 'quiz-pwa-unlocked';

export default function App() {
  const { firebaseError, clearFirebaseError } = useOrders();
  const [screen, setScreen] = useState<AppScreen>('orders');
  const [orderFlowStep, setOrderFlowStep] = useState<OrderFlowStep>('team-selection');
  const [selectedTableForOrder, setSelectedTableForOrder] = useState<Table | null>(null);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const headerWrapperRef = useRef<HTMLDivElement>(null);
  const accountDropdownRef = useRef<HTMLDivElement>(null);
  const isProtected = Boolean(import.meta.env.VITE_APP_PASSWORD);

  const handleLogout = () => {
    try {
      sessionStorage.removeItem(PASSWORD_STORAGE_KEY);
    } catch {
      // ignore
    }
    setAccountMenuOpen(false);
    window.location.reload();
  };

  useEffect(() => {
    if (!accountMenuOpen) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        headerWrapperRef.current?.contains(target) ||
        accountDropdownRef.current?.contains(target)
      ) {
        return;
      }
      setAccountMenuOpen(false);
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAccountMenuOpen(false);
    };
    document.addEventListener('click', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('click', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [accountMenuOpen]);

  const navItems: HeaderNavItem[] = [
    {
      id: 'orders',
      icon: PlusSquare as HeaderNavItem['icon'],
      label: 'Nieuwe bestelling',
      active: screen === 'orders',
      onClick: () => {
        setScreen('orders');
        setOrderFlowStep('team-selection');
        setSelectedTableForOrder(null);
      },
    },
    { id: 'bar', icon: ConciergeBell as HeaderNavItem['icon'], label: 'Bestellingen', active: screen === 'bar', onClick: () => setScreen('bar') },
    { id: 'ranking', icon: Crown as HeaderNavItem['icon'], label: 'Ranking', active: screen === 'ranking', onClick: () => setScreen('ranking') },
    { id: 'admin', icon: Settings as HeaderNavItem['icon'], label: 'Beheer', active: screen === 'admin', onClick: () => setScreen('admin') },
  ];

  const goToNewOrder = () => {
    setScreen('orders');
    setOrderFlowStep('team-selection');
    setSelectedTableForOrder(null);
  };

  const logo = (
    <button
      type="button"
      onClick={goToNewOrder}
      className="app__logo-btn"
      aria-label="Ga naar nieuwe bestelling"
    >
      <img
        src="/quiz-logo.png"
        alt=""
        className="app__logo-img"
        width={120}
        height={40}
      />
    </button>
  );

  const account = isProtected
    ? {
        onClick: () => setAccountMenuOpen((prev) => !prev),
        ariaLabel: 'Account',
        title: 'Account',
        subtitle: 'Medewerker',
      }
    : undefined;

  return (
    <>
      <div ref={headerWrapperRef} className="app__header-wrapper">
        <Header
          logo={logo}
          navItems={navItems}
          account={account}
        />
        {accountMenuOpen && isProtected && (
          <div
            ref={accountDropdownRef}
            className="app__account-dropdown"
            role="menu"
            aria-label="Account menu"
          >
            <button
              type="button"
              role="menuitem"
              className="app__account-dropdown-item app__account-dropdown-item--destructive"
              onClick={handleLogout}
            >
              <LogOut className="app__account-dropdown-icon" aria-hidden />
              Uitloggen
            </button>
          </div>
        )}
      </div>

      <div className="app__shell">
        <main className="app__main">
        {firebaseError && (
          <Toast
            message={firebaseError.message}
            variant="error"
            durationMs={5000}
            onDismiss={clearFirebaseError}
          />
        )}

        <div className="app__content">
          {screen === 'orders' && orderFlowStep === 'team-selection' && (
            <TeamSelectionScreen
              onSelectTable={(table) => {
                setSelectedTableForOrder(table);
                setOrderFlowStep('order');
              }}
            />
          )}
          {screen === 'orders' && orderFlowStep === 'order' && selectedTableForOrder && (
            <OrderTakingScreen
              initialTable={selectedTableForOrder}
              onBackToTeamSelection={() => {
                setOrderFlowStep('team-selection');
                setSelectedTableForOrder(null);
              }}
            />
          )}
          {screen === 'bar' && <BarOrdersScreen />}
          {screen === 'ranking' && <RankingScreen />}
          {screen === 'admin' && <AdminScreen />}
        </div>
        </main>
      </div>
    </>
  );
}
