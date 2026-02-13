/**
 * Toast – Figma DS Components 278:12664. Error/success/warning/info with icon, message, and bottom border that fills as countdown.
 * Auto-dismiss after duration; timer and progress pause on hover.
 */
import { useEffect, useRef, useState } from 'react';
import { X, CheckCircle2, AlertTriangle, Info } from 'lucide-react';
import './Toast.css';

export type ToastVariant = 'error' | 'success' | 'warning' | 'info';

export type ToastProps = {
  message: string;
  variant?: ToastVariant;
  durationMs?: number;
  onDismiss: () => void;
};

const TICK_MS = 50;

export function Toast({
  message,
  variant = 'error',
  durationMs = 5000,
  onDismiss,
}: ToastProps) {
  const [progress, setProgress] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const progressRef = useRef(0);

  const clearTimer = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    if (isHovered) {
      clearTimer();
      return;
    }
    const increment = (TICK_MS / durationMs) * 100;
    intervalRef.current = setInterval(() => {
      progressRef.current = Math.min(100, progressRef.current + increment);
      setProgress(progressRef.current);
      if (progressRef.current >= 100) {
        clearTimer();
        onDismiss();
      }
    }, TICK_MS);
    return clearTimer;
  }, [isHovered, durationMs, onDismiss]);

  const icon =
    variant === 'error' ? X : variant === 'success' ? CheckCircle2 : variant === 'warning' ? AlertTriangle : Info;

  const Icon = icon;

  return (
    <div
      className={`toast toast--${variant}`}
      role="alert"
      aria-live="assertive"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="toast__content">
        <div className="toast__icon-wrap">
          <Icon className="toast__icon" aria-hidden />
        </div>
        <p className="toast__message">{message}</p>
      </div>
      <div
        className="toast__progress"
        style={{ width: `${progress}%` }}
        aria-hidden
      />
    </div>
  );
}
