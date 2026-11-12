export type ClassValue = string | false | null | undefined;

/** Join truthy class names. Internal; intentionally tiny (no dependency). */
export function cx(...values: ClassValue[]): string {
  let out = '';
  for (const value of values) {
    if (value) out = out ? `${out} ${value}` : value;
  }
  return out;
}
