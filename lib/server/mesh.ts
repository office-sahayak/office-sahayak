/**
 * Server-only MeshAPI client wrapper.
 *
 * SECURITY:
 *  - A runtime guard throws if this module is ever executed in the browser,
 *    so the MeshAPI key can never reach the client.
 *  - The key is read from `process.env.MESH_API_KEY` at call time and is
 *    never logged, serialized, or returned to the client.
 *
 * SCOPE: The AI Office Assistant is NOT implemented in this phase. This file
 * only establishes the safe server-side calling pattern for future use.
 */

import type { Result } from "@/types";

// Fail loudly if this ever gets bundled into / executed on the client.
if (typeof window !== "undefined") {
  throw new Error("lib/server/mesh.ts must never be imported in the browser.");
}

const MESH_API_BASE_URL =
  process.env.MESH_API_BASE_URL ?? "https://api.mesh.example/v1";

/** Returns true if the server has a MeshAPI key configured. */
export function isMeshConfigured(): boolean {
  return Boolean(process.env.MESH_API_KEY);
}

/**
 * Low-level authenticated fetch to MeshAPI. Server-only.
 * The Authorization header is attached here and never exposed to the client.
 */
export async function meshFetch(
  path: string,
  init: RequestInit = {},
): Promise<Result<unknown>> {
  const apiKey = process.env.MESH_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "MeshAPI is not configured.",
      code: "MESH_NOT_CONFIGURED",
    };
  }

  try {
    const res = await fetch(`${MESH_API_BASE_URL}${path}`, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
        ...(init.headers ?? {}),
      },
      // Never cache authenticated AI calls.
      cache: "no-store",
    });

    if (!res.ok) {
      // Do not leak upstream body details or the key to callers.
      return {
        ok: false,
        error: `MeshAPI request failed with status ${res.status}.`,
        code: "MESH_UPSTREAM_ERROR",
      };
    }

    const data = (await res.json()) as unknown;
    return { ok: true, data };
  } catch {
    return {
      ok: false,
      error: "Could not reach MeshAPI.",
      code: "MESH_NETWORK_ERROR",
    };
  }
}
