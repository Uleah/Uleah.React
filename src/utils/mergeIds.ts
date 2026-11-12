/** Join space-separated ID references (e.g. aria-describedby), skipping empties. */
export function mergeIds(...ids: (string | undefined | null | false)[]): string | undefined {
  const joined = ids.filter(Boolean).join(' ');
  return joined || undefined;
}
