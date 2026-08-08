/**
 * Tiny className joiner. Filters out falsy values and joins with a space.
 * Intentionally dependency-free (no clsx/tailwind-merge) to keep the
 * bundle small, per project constraints.
 */
export type ClassValue = string | number | false | null | undefined;

export function cn(...values: ClassValue[]): string {
  return values.filter(Boolean).join(" ");
}
