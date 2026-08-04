import React, {
  createContext, useCallback, useContext, useMemo, useState, type ReactNode,
} from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert, { type AlertColor } from '@mui/material/Alert';
import Button from '@mui/material/Button';

interface ToastAction { label: string; onClick: () => void; }
interface ToastContexValue {
  showToast: (message: string, severity?: AlertColor, action?: ToastAction) => void;
}

const ToastContext = createContext<ToastContexValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [action, setAction] = useState<ToastAction | undefined>(undefined);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  // eslint-disable-next-line default-param-last
  const showToast = useCallback((msg: string, sev: AlertColor = 'info', act?: ToastAction) => {
    setMessage(msg);
    setSeverity(sev);
    setAction(act);
    setOpen(true);
  }, []);

  const handleClose = useCallback((_event: unknown, reason?: string) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  }, []);

  const value = useMemo(() => ({ showToast }), [showToast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <Snackbar open={open} autoHideDuration={7000} onClose={handleClose}>
        <Alert
          onClose={handleClose}
          severity={severity}
          sx={{ width: '100%' }}
          action={action && (
          <Button color="inherit" size="small" onClick={() => { action.onClick(); }}>
            {action.label}
          </Button>
          )}
        >
          {message}
        </Alert>
      </Snackbar>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}
