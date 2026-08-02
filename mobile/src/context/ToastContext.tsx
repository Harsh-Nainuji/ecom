import { PropsWithChildren, createContext, useCallback, useContext, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';
import { S } from '../lib/theme';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastState {
  visible: boolean;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: PropsWithChildren) {
  const [toast, setToast] = useState<ToastState>({
    visible: false,
    message: '',
    type: 'success',
  });

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    setToast({ visible: true, message, type });
    setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, 3000);
  }, []);

  let Icon = CheckCircle2;
  let bg = '#10b981';
  const textCol = '#ffffff';

  if (toast.type === 'error') {
    Icon = AlertCircle;
    bg = '#ef4444';
  } else if (toast.type === 'info') {
    Icon = Info;
    bg = '#3b82f6';
  } else if (toast.type === 'warning') {
    Icon = AlertTriangle;
    bg = '#f59e0b';
  }

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast.visible && (
        <View style={styles.toastWrapper} pointerEvents="none">
          <View style={[styles.toastCard, { backgroundColor: bg }]}>
            <Icon size={18} color={textCol} strokeWidth={2.5} />
            <Text style={[styles.toastText, { color: textCol }]}>{toast.message}</Text>
          </View>
        </View>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    return {
      showToast: () => {},
    };
  }
  return ctx;
}

const styles = StyleSheet.create({
  toastWrapper: {
    position: 'absolute',
    top: 48,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 99999,
    paddingHorizontal: S.md,
  },
  toastCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
    maxWidth: 400,
  },
  toastText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
