/**
 * Optional shared-password gate. If VITE_APP_PASSWORD is set, users must enter it to see the app.
 * Unlock is stored in sessionStorage (per tab; cleared when tab closes).
 */
import { useState, useCallback, useEffect } from 'react';
import { Lock } from 'lucide-react';
import { Button, InputField } from '@tomlievens/design-system';
import './PasswordGate.css';

const STORAGE_KEY = 'quiz-pwa-unlocked';

export function PasswordGate({ children }: { children: React.ReactNode }) {
  const password = import.meta.env.VITE_APP_PASSWORD;
  const passwordHint = import.meta.env.VITE_APP_PASSWORD_HINT;
  const [unlocked, setUnlocked] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!password) {
      setUnlocked(true);
      return;
    }
    try {
      if (sessionStorage.getItem(STORAGE_KEY) === 'true') setUnlocked(true);
    } catch {
      // ignore
    }
  }, [password]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      setError('');
      if (!password) {
        setUnlocked(true);
        return;
      }
      if (value.trim() === password) {
        try {
          sessionStorage.setItem(STORAGE_KEY, 'true');
        } catch {
          // ignore
        }
        setUnlocked(true);
      } else {
        setError('Wrong password');
      }
    },
    [password, value]
  );

  if (!password) return <>{children}</>;
  if (unlocked) return <>{children}</>;

  return (
    <div className="password-gate">
      <div className="password-gate__icon-wrap" aria-hidden>
        <Lock className="password-gate__icon" />
      </div>
      <h1 className="password-gate__title">Quiz Event Orders</h1>
      <p className="password-gate__subtitle">Sign in to access the system.</p>
      <div className="password-gate__card">
        <form onSubmit={handleSubmit} className="password-gate__form">
          <InputField
            label="Password"
            type="password"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            errorMessage={error || undefined}
            placeholder="Enter your password"
            leftIcon={Lock as React.ComponentProps<typeof InputField>['leftIcon']}
          />
          <div className="password-gate__submit">
            <Button type="submit" variant="primary" state="default">
              Sign In
            </Button>
          </div>
        </form>
        <div className="password-gate__demo">
          <p className="password-gate__demo-label">Demo Credentials</p>
          <div className="password-gate__demo-box">
            <span className="password-gate__demo-text">
              Password: <strong className="password-gate__demo-value">{passwordHint ?? 'Ask your event organizer'}</strong>
            </span>
          </div>
        </div>
      </div>
      <p className="password-gate__copyright">© 2026 Quiz Event Orders. All rights reserved.</p>
    </div>
  );
}
