/**
 * Type definitions for the OfficeSahayak tool registry.
 *
 * The platform is data-driven: adding a new tool later is a matter of adding
 * an entry to the registry (see `registry.ts`), not writing new plumbing.
 */

/** Stable identifiers for tool categories. */
export type CategoryId =
  | "documents"
  | "text"
  | "image"
  | "calculators"
  | "government"
  | "utilities";

/** Lifecycle status of a tool, controls badges and clickability. */
export type ToolStatus = "available" | "coming-soon";

export interface ToolCategory {
  /** Stable, URL-safe identifier used in routes: /tools/[category]. */
  id: CategoryId;
  /** Hindi display name. */
  name: string;
  /** Short Hindi description of the category. */
  description: string;
  /** Emoji/icon glyph used as a lightweight, dependency-free icon. */
  icon: string;
}

export interface Tool {
  /** Stable, URL-safe slug used in future routes: /tools/[category]/[slug]. */
  slug: string;
  /** Hindi display name. */
  name: string;
  /** Short Hindi description shown on cards. */
  description: string;
  /** Category this tool belongs to. */
  category: CategoryId;
  /** Emoji/icon glyph. */
  icon: string;
  /** Lifecycle status. */
  status: ToolStatus;
  /** Optional Hindi keywords to improve in-app search. */
  keywords?: string[];
}
