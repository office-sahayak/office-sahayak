/**
 * Shared, app-wide TypeScript types for OfficeSahayak.
 * Tool-specific types live in `lib/tools/types.ts`.
 */

/** Generic result envelope used by server helpers and API routes. */
export type Result<T> =
  | { ok: true; data: T }
  | { ok: false; error: string; code?: string };

/** Standard shape for API error responses. */
export interface ApiError {
  error: string;
  code?: string;
}
