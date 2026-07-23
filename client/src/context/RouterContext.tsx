import {
  createContext, useContext, useEffect, useState, type ReactNode,
} from 'react';

interface RouterContextValue {
  path: string;
  navigate: (to: string) => void;
}

export function RouterProvider() {
  const [path, setPath] = useState(window.location.pathname)
};

export function useRouter() {

}