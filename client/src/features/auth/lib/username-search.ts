export function normalizeUsernameSearch(input: string) {
  const query = input.trim().toLowerCase();
  return { query, valid: /^[a-z0-9_]{2,20}$/.test(query) };
}
