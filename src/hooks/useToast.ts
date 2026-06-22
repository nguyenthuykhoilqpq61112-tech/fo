import { useState, useCallback, useEffect } from 'react';

type ToastType = 'success' | 'warning' | 'error' | 'info';

interface ToastOptions {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

// Global state for toasts
let toastsList: ToastOptions[] = [];
let listeners: ((toasts: ToastOptions[]) => void)[] = [];

const notifyListeners = () => {
  listeners.forEach(listener => listener(toastsList));
};

export const toast = {
  show: (message: string, type: ToastType = 'info', duration: number = 3500) => {
    const id = Math.random().toString(36).substring(2, 9);
    // limit to 4
    if (toastsList.length >= 4) {
      toastsList = toastsList.slice(1);
    }
    toastsList = [...toastsList, { id, message, type, duration }];
    notifyListeners();

    if (duration > 0) {
      setTimeout(() => {
        toast.dismiss(id);
      }, duration);
    }
  },
  success: (message: string, duration?: number) => toast.show(message, 'success', duration),
  error: (message: string, duration?: number) => toast.show(message, 'error', duration),
  warning: (message: string, duration?: number) => toast.show(message, 'warning', duration),
  info: (message: string, duration?: number) => toast.show(message, 'info', duration),
  dismiss: (id: string) => {
    toastsList = toastsList.filter(t => t.id !== id);
    notifyListeners();
  }
};

export const useToast = () => {
  const [toasts, setToasts] = useState<ToastOptions[]>(toastsList);

  useEffect(() => {
    const listener = (newToasts: ToastOptions[]) => {
      setToasts(newToasts);
    };
    listeners.push(listener);
    return () => {
      listeners = listeners.filter(l => l !== listener);
    };
  }, []);

  return { toasts, toast };
};
