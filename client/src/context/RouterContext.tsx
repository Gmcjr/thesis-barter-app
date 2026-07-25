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

const ParamsContext = createContext<Record<string, string>>({});

export function useParams() {
  return useContext(ParamsContext);
}

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const paramNames: string[] = [];
  const regexStr = `^${pattern.replace(/:[a-zA-Z]+/g, (segment) => {
    paramNames.push(segment.slice(1));
    return '([^/]+)';
  }).replace(/\/$/, '')}/?$`;
  const match = path.match(new RegExp(regexStr));
  if (!match) return null;

  const params: Record<string, string> = {};
  paramNames.forEach((name, i) => { params[name] = decodeURIComponent(match[i + 1]); });
  return params;
}

export function Router({ routes, notFound: NotFound }: {
  routes: RouteDef[];
  notFound: ComponentType;
}) {
  const { path, navigate } = useRouter();
  const { user, loading } = useAuth();

  const { matchedRoute, params } = useMemo(() => {
    const found = routes
      .map((route) => ({ route, params: matchRoute(route.path, path) }))
      .find((entry) => entry.params !== null);

    return {
      matchedRoute: found?.route,
      params: found?.params ?? {},
    };
  }, [routes, path]);

  useEffect(() => {
    if (matchedRoute?.requiresAuth && !loading && !user) {
      navigate('/');
    }
  }, [matchedRoute, loading, user, navigate]);

  if (!matchedRoute) return <NotFound />;
  if (matchedRoute.requiresAuth) {
    if (loading) return null;
    if (!user) return null;
  }

  const Component = matchedRoute.component;
  return (
    <ParamsContext.Provider value={params}>
      <Component />
    </ParamsContext.Provider>
  );
}
