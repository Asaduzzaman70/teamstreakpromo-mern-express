/**
 * Escapes special regular expression characters in user-supplied search strings
 * to prevent Regular Expression Denial of Service (ReDoS) and unexpected query behavior.
 */
export const escapeRegex = (input: string): string => {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

