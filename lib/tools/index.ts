/**
 * Public API for the OfficeSahayak tool registry.
 * This is the only file external code should import from `lib/tools/*`.
 */

import { categories } from "./categories";
import { tools } from "./registry";

export { categories } from "./categories";
export { tools } from "./registry";
export type { CategoryId, ToolStatus, ToolCategory, Tool } from "./types";

/**
 * Find a category by its ID.
 */
export function getCategoryById(id: string) {
  return categories.find((c) => c.id === id);
}

/**
 * Find a tool by its slug.
 */
export function getToolBySlug(slug: string) {
  return tools.find((t) => t.slug === slug);
}

/**
 * Get all tools in a specific category.
 */
export function getToolsByCategory(categoryId: string) {
  return tools.filter((t) => t.category === categoryId);
}

/**
 * Search tools by name, description, or keywords (case-insensitive).
 */
export function searchTools(query: string) {
  const lowerQuery = query.toLowerCase();
  return tools.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.keywords?.some((k) => k.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all available (non-coming-soon) tools.
 */
export function getAvailableTools() {
  return tools.filter((t) => t.status === "available");
}

/**
 * Get tools grouped by category.
 */
export function getToolsByCategories() {
  return categories.map((category) => ({
    category,
    tools: getToolsByCategory(category.id),
  }));
}
