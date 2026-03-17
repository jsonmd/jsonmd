/**
 * Estimate token count for a string.
 * Uses chars/4 approximation consistent with GPT/Claude tokenizers.
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
