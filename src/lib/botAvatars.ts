/** Bots are named after animals by the server; the app draws the matching animal as their avatar. */
const ANIMALS: Record<string, { emoji: string; bg: string }> = {
  Cat: { emoji: '🐱', bg: '#F76B15' },
  Dog: { emoji: '🐶', bg: '#B07A3B' },
  Snake: { emoji: '🐍', bg: '#30A46C' },
  Fox: { emoji: '🦊', bg: '#E5602D' },
  Panda: { emoji: '🐼', bg: '#5B6B73' },
  Lion: { emoji: '🦁', bg: '#D6A100' },
};

/** Unknown bot names (an older server's "Bot Rahim", "Bot 3") get a robot. */
export function botAvatar(name: string): { emoji: string; bg: string } {
  return ANIMALS[name] ?? { emoji: '🤖', bg: '#3E63DD' };
}
