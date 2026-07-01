/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_AUTH_DISABLED?: string;
  readonly VITE_GOOGLE_MAPS_API_KEY?: string;
  readonly NEXT_PUBLIC_API_URL?: string;
  readonly NEXT_PUBLIC_AUTH_DISABLED?: string;
  readonly NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?: string;
}

interface Window {
  env?: {
    VITE_API_URL?: string;
    VITE_AUTH_DISABLED?: string;
    VITE_GOOGLE_MAPS_API_KEY?: string;
  };
}

