import type { SurfaceContainerTokens, radius } from '../theme';

declare module '@mui/material/styles' {
  interface Palette {
    accent: Palette['primary'];
    surface: { sunken: string; overlay: string; container: SurfaceContainerTokens };
    border: { subtle: string; default: string; strong: string };
    link: { main: string; hover: string };
  }
  interface PaletteOptions {
    accent?: PaletteOptions['primary'];
    surface?: { sunken: string; overlay: string; container: SurfaceContainerTokens };
    border?: { subtle: string; default: string; strong: string };
    link?: { main: string; hover: string };
  }
  interface Theme {
    radius: typeof radius;
  }
  interface ThemeOptions {
    radius?: typeof radius;
  }
}
