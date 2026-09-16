/// <reference types="vite/client" />

/**
 * Types for the environment variables this app reads.
 *
 * Declaring them explicitly means a typo like `import.meta.env.VITE_API_URL`
 * becomes a TypeScript error instead of a silent `undefined` at runtime.
 */
interface ImportMetaEnv {
  /** Base URL for API calls. Empty string in development (Vite proxies /api). */
  readonly VITE_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
