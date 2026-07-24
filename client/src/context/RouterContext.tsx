import React, {
  createContext,
  useMemo,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
} from 'react';
import { useAuth } from './AuthContext';

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  useEffect(() => {
    const onPopState = () => setPath(window.location.pathname);
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string) => {
    if (to === window.location.pathname) return;
    window.history.pushState({}, '', to);
    setPath(to);
  }, []);

  const value = useMemo(() => ({ path, navigate }), [path, navigate]);

  return (
    <RouterContext.Provider value={value}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouter() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouter must be used within RouterProvider');
  return ctx;
}

interface LinkProps {
  to: string;
  children: ReactNode;
  className?: string;
  onClick?: () => void;
}

export function Link({
  to, children, className, onClick,
}: LinkProps) {
  const { navigate } = useRouter();
  return (
    <a
      href={to}
      className={className}
      onClick={(e) => {
        e.preventDefault();
        onClick?.();
        navigate(to);
      }}
    >
      {children}
    </a>
  );
}

export interface RouteDef {
  path: string;
  component: ComponentType;
  requiresAuth?: boolean;
}

function matchPath(pattern: string, path: string): boolean {
  const regex = `^${pattern.replace(/:[a-zA-Z]+/g, '([^/]+)').replace(/\/$/, '')}/?$`;
  return new RegExp(regex).test(path);
}

export function Router({ routes, notFound: NotFound }: {
  routes: RouteDef[];
  notFound: ComponentType;
}) {
  const { path, navigate } = useRouter();
  const { user, loading } = useAuth();
  const match = routes.find((r) => matchPath(r.path, path));

  useEffect(() => {
    if (match?.requiresAuth && !loading && !user) {
      navigate('/');
    }
  }, [match, loading, user, navigate]);

  if (!match) return <NotFound />;
  if (match.requiresAuth) {
    if (loading) return null;
    if (!user) return null;
  }

  const Component = match.component;
  return <Component />;
}
