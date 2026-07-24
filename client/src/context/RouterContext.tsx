import React, {
  createContext, useContext, useState, type ComponentType, type ReactNode,
} from 'react';

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
}

const RouterContext = createContext<RouterContextValue | undefined>(undefined);

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(window.location.pathname);

  const navigate = (to: string) => {
    if (to === window.location.pathname) return;
    setPath(to);
  };

  return (
    <RouterContext.Provider value={{ path, navigate }}>
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
};

export interface RouteDef {
  path: string;
  component: ComponentType;
  requiresAuth?: boolean;
}

function matchPath(pattern: string, path: string): boolean {
  const regex = `^${pattern.replace(/:[a-zA-Z]+/g, '([^/]+)').replace(/\/$/, '')}/$`;
  return new RegExp(regex).test(path);
}

export function Router({ routes, notFound: NotFound }: {
  routes: RouteDef[];
  notFound: ComponentType;
}) {
  const { path } = useRouter();
  const match = routes.find((r) => matchPath(r.path, path));

  if (!match) return <NotFound />;
  const Component = match.component;
  return <Component />;
}