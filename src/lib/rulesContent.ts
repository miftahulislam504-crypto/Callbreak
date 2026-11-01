// The "How to play" guide for the three games.
// The rules mirror the server's engine (callbreak-server: engine/game.ts, rules.ts, twentynine.ts, poker.ts), so if a
// rule changes there, change it here too. Cards in examples are written as rank + suit letter: "10H", "JS", "AD", "7C".
import type { GameId } from './types';

export type Block =
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'steps'; items: string[] }
  | { t: 'cards'; cards: string[]; caption?: string }
  /** One played trick: who played what, which play wins (index into `plays`), and why. */
  | { t: 'trick'; title: string; plays: { who: string; card: string }[]; winner: number; won: string; note: string }
  | { t: 'example'; title: string; lines: string[]; cards?: string[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'ranks'; rows: { name: string; desc: string; cards: string[] }[] }
  | { t: 'tip'; text: string }
  | { t: 'warn'; text: string };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Guide {
  id: GameId;
  name: string;
  tagline: string;
  /** The whole game in a few lines. */
  quick: string[];
  sections: Section[];
}

const callbreakGuide: Guide = {
  id: 'callbreak',
  name: 'Call Break',
  tagline: '4-player card game: win about as many tricks as you bid',
  quick: [
    '4 players, 13 cards each. Spades (♠) are always trump.',
    'Each round has 13 tricks. Win your bid, or a few more, and you score plus points.',
    'No bidding in round 1. From round 2 you bid 2 to 8.',
    'Win fewer tricks than you bid and you lose points. Win double your bid or more and you lose points too!',
  ],
  sections: [
    {
      id: 'words',
      title: 'A few words first',
      blocks: [
        {
          t: 'list',
          items: [
            'Trick: each of the four players puts down one card. The winner takes all four cards and leads the next trick.',
            'Suits: ♠ spades, ♥ hearts, ♦ diamonds, ♣ clubs.',
            'Lead: the first card of a trick. Its suit is the suit everyone must follow.',
            'Trump: spades beat every other suit. Even a ♠2 beats a ♥A.',
          ],
        },
        { t: 'cards', cards: ['2C', '7D', '10H', 'JS', 'QH', 'KC', 'AS'], caption: 'Card order, low to high: 2, 3 … 10, J, Q, K, A (ace is highest).' },
      ],
    },
    {
      id: 'deal',
      title: 'Starting a game',
      blocks: [
        {
          t: 'steps',
          items: [
            'The game starts with 4 players (the host can fill empty seats with bots).',
            'The 52 cards are dealt, 13 each. You get time to look at your cards; if everyone taps "Ready" it starts sooner.',
            'The player after the dealer bids first and leads the first trick. The dealer moves one seat every round.',
          ],
        },
        { t: 'warn', text: 'The cards are dealt again if anyone has no spade at all, or if all of someone’s cards are between 2 and 9.' },
      ],
    },
    {
      id: 'bid',
      title: 'Bidding',
      blocks: [
        { t: 'p', text: 'A bid is a promise: "I will win at least this many tricks this round."' },
        {
          t: 'list',
          items: [
            'Round 1: no bidding, just play. Every trick you win is 1 point.',
            'From round 2: starting with the player after the dealer, everyone bids a number from 2 to 8.',
          ],
        },
        {
          t: 'example',
          title: 'How to choose a bid',
          cards: ['AS', 'KS', '5S', 'AH', '9H', 'KD', '3D', '7C'],
          lines: [
            'Say these are your best cards.',
            '♠A, ♠K, ♥A and ♦K are big cards: you can hope for about 3 to 4 tricks from them.',
            'You may not get them all, so a safe bid is 3.',
          ],
        },
        { t: 'tip', text: 'As a beginner, bid between 2 and 4. A big bid is a big risk: if you miss it you lose the whole bid in points.' },
      ],
    },
    {
      id: 'play',
      title: 'Which card can you play',
      blocks: [
        {
          t: 'steps',
          items: [
            'The player who leads a trick can play any card.',
            'If you have the led suit you must follow it. If you can beat the highest card of that suit on the table, you must. If you cannot, play any card of that suit.',
            'If you have no card of the led suit, you must play a spade (cut). If someone already played a spade and you have a higher one, you must play it (over-trump).',
            'If you have neither the led suit nor a spade, play anything.',
          ],
        },
        { t: 'p', text: 'The trick is won by the highest spade if any spade was played, otherwise by the highest card of the led suit.' },
        {
          t: 'trick',
          title: 'Example 1: you must play higher',
          plays: [
            { who: 'Rahim', card: '5D' },
            { who: 'Karim', card: '9D' },
            { who: 'You', card: 'QD' },
            { who: 'Salma', card: 'AD' },
          ],
          winner: 3,
          won: 'Salma wins',
          note: 'You held ♦3 and ♦Q. The ♦9 was highest on the table, so you had to play the ♦Q that beats it, not the ♦3. In the end Salma’s ♦A beat everything.',
        },
        {
          t: 'trick',
          title: 'Example 2: cutting with a spade',
          plays: [
            { who: 'Rahim', card: 'KH' },
            { who: 'Karim', card: '5H' },
            { who: 'You', card: '2S' },
            { who: 'Salma', card: 'AH' },
          ],
          winner: 2,
          won: 'You win',
          note: 'Rahim led a heart. You had no hearts, so you had to play a spade. Even the smallest spade is trump, so your ♠2 beats the ♥A.',
        },
        {
          t: 'trick',
          title: 'Example 3: a spade over a spade',
          plays: [
            { who: 'Rahim', card: '4C' },
            { who: 'Karim', card: '6S' },
            { who: 'You', card: 'JS' },
            { who: 'Salma', card: 'KC' },
          ],
          winner: 2,
          won: 'You win',
          note: 'Karim cut first with the ♠6. You have no clubs and you hold a higher spade, the ♠J, so you had to play it. Nobody has a bigger spade, so the trick is yours.',
        },
      ],
    },
    {
      id: 'score',
      title: 'Scoring',
      blocks: [
        {
          t: 'list',
          items: [
            'Fewer tricks than your bid: minus. You lose as many points as your bid.',
            'From your bid up to just under double your bid: plus. You gain as many points as your bid. Extra tricks give no bonus.',
            'Double your bid or more: minus again!',
          ],
        },
        {
          t: 'table',
          head: ['Bid', 'Minus', 'Plus', 'Minus again'],
          rows: [
            ['2', '0–1 tricks', '2–3 tricks', '4+ tricks'],
            ['3', '0–2', '3–5', '6+'],
            ['4', '0–3', '4–7', '8+'],
            ['5', '0–4', '5–9', '10+'],
            ['6', '0–5', '6–11', '12+'],
            ['7', '0–6', '7–13', 'none'],
            ['8', '0–7', '8–13', 'none'],
          ],
        },
        { t: 'p', text: 'A bid of 7 or 8 cannot be doubled (there are only 13 tricks), so there you only lose by falling short.' },
        {
          t: 'example',
          title: 'One round, worked out',
          lines: ['Rahim: bid 3, won 4 tricks → +3', 'Karim: bid 4, won 3 tricks → −4 (fell short)', 'Salma: bid 3, won 6 tricks → −3 (doubled)', 'You: bid 2, won 2 tricks → +2'],
        },
        { t: 'tip', text: 'In round 1 there is no bid, so just win as many tricks as you can. Later, once your bid is safe, do not drift toward double: give tricks away where the rules let you.' },
      ],
    },
    {
      id: 'win',
      title: 'Who wins',
      blocks: [
        {
          t: 'list',
          items: [
            'Round scores keep adding up.',
            'The first player to reach the target score (set when the room is created, usually 49) while being alone on top wins.',
            'If several players are tied on top, the game goes on.',
            'There is a maximum number of rounds. When it is reached, the highest score wins.',
          ],
        },
      ],
    },
    {
      id: 'time',
      title: 'Time limits and auto-play',
      blocks: [
        {
          t: 'list',
          items: [
            'You get about 20 seconds to bid and about 30 seconds to play a card.',
            'When time runs out the server plays for you. After 2 timeouts in a row your seat goes on auto-play.',
            'If your connection drops, your seat is kept for 60 seconds. A bot plays for you in the meantime.',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: 'Tips for beginners',
      blocks: [
        {
          t: 'list',
          items: [
            'Lead with aces and kings; keep small cards for later.',
            'Remember who has run out of a suit. They may cut you with a spade.',
            'High spades (A, K, Q) are almost sure tricks. Do not waste spades on tiny cuts.',
            'Make your own bid first, then think about extra tricks.',
          ],
        },
      ],
    },
  ],
};

const twentyNineGuide: Guide = {
  id: 'twentynine',
  name: '29 (Twenty-nine)',
  tagline: '4 players in 2 teams: score points together with your partner',
  quick: [
    '4 players, 2 teams. Your partner sits straight across from you.',
    '32 cards (7 to A). Order: J > 9 > A > 10 > K > Q > 8 > 7.',
    'Card points: J = 3, 9 = 2, A = 1, 10 = 1, the rest 0. That is 28 in total, plus 1 for the last trick makes 29.',
    'The player who bids highest (the bidder) secretly picks trump. Their team must collect the points they bid.',
  ],
  sections: [
    {
      id: 'cards',
      title: 'Teams, cards and points',
      blocks: [
        { t: 'p', text: 'The two players facing each other are a team. The player across the table from you is your partner.' },
        { t: 'cards', cards: ['JS', '9S', 'AS', '10S', 'KS', 'QS', '8S', '7S'], caption: 'Strength order, highest to lowest. It is the same in all 4 suits.' },
        {
          t: 'table',
          head: ['Card', 'Strength', 'Points'],
          rows: [
            ['J (jack)', '1st', '3'],
            ['9', '2nd', '2'],
            ['A', '3rd', '1'],
            ['10', '4th', '1'],
            ['K, Q, 8, 7', '5th to 8th', '0'],
          ],
        },
        { t: 'warn', text: 'The ace is not the highest here! The jack is the highest, then the 9. Keep this order in your head.' },
      ],
    },
    {
      id: 'flow',
      title: 'Steps of a round',
      blocks: [
        {
          t: 'steps',
          items: [
            'Deal: everyone first gets 4 cards.',
            'Bidding: starting after the dealer, go around bidding or passing. A bid is 16 to 28 and means "my team will collect this many points".',
            'Choosing trump: the bidder looks at those 4 cards and secretly picks one suit as trump. Nobody is told.',
            'The other 4 cards are dealt to everyone. Now everyone holds 8.',
            'Play: 8 tricks are played. The player after the dealer leads the first, then whoever wins a trick leads the next.',
            'At the end of the round the score is worked out.',
          ],
        },
      ],
    },
    {
      id: 'bid',
      title: 'Bidding rules',
      blocks: [
        {
          t: 'list',
          items: [
            'You must bid higher than the current bid, or pass.',
            'Once you pass, you cannot bid again in that round.',
            'A bid of 28 ends the bidding at once: that player is the bidder.',
            'If everyone passes, the last player must bid at least 16.',
          ],
        },
        {
          t: 'example',
          title: 'Example',
          lines: [
            'Opponent 1 bids 16. Partner passes. Opponent 2 bids 18.',
            'You bid 20. Everyone else passes.',
            'You are the bidder and your team must collect at least 20 points. Now it is your turn to choose trump.',
          ],
        },
        { t: 'tip', text: 'If your first 4 cards include a J or a 9, you can bid with more confidence. A J and a 9 in the same suit make a great trump.' },
      ],
    },
    {
      id: 'play',
      title: 'Playing tricks and asking for trump',
      blocks: [
        {
          t: 'steps',
          items: [
            'If you have the led suit you must follow it. You do not have to beat the card on the table: a small card is fine.',
            'If you have no card of the led suit, you may ask "Show trump". The trump suit is then shown to everyone.',
            'After trump is shown, if you cannot follow suit and you hold trump, you must play trump (a cut). With no trump either, play anything.',
            'Before trump is shown, if you cannot follow suit you may play any card. That card never counts as trump, even if it is of the trump suit.',
          ],
        },
        { t: 'p', text: 'The trick is won by the strongest card of the led suit. But if someone played trump after it was shown, the highest trump wins. The winning team collects the points of the cards in the trick.' },
        {
          t: 'trick',
          title: 'Example 1: an ordinary trick',
          plays: [
            { who: 'Opponent 1', card: '8H' },
            { who: 'Partner', card: 'KH' },
            { who: 'Opponent 2', card: '9H' },
            { who: 'You', card: 'JH' },
          ],
          winner: 3,
          won: 'You win',
          note: 'The order is J > 9 > K > 8, so the ♥J wins. The trick held a J (3) and a 9 (2): 5 points for your team.',
        },
        {
          t: 'trick',
          title: 'Example 2: showing trump and cutting',
          plays: [
            { who: 'Opponent 1', card: 'AD' },
            { who: 'Partner', card: '10D' },
            { who: 'Opponent 2', card: 'QD' },
            { who: 'You', card: '7S' },
          ],
          winner: 3,
          won: 'You win',
          note: 'You had no diamonds, so you asked "Show trump". It turned out to be spades. You had to play your ♠7, and even a small trump beats every ♦. The trick held an A (1) and a 10 (1): 2 points.',
        },
      ],
    },
    {
      id: 'pair',
      title: 'The pair (K + Q)',
      blocks: [
        { t: 'p', text: 'After trump has been shown, if a player plays the K or Q of trump while still holding the other one of that suit, a "pair" is declared automatically. Only the first pair of a round counts.' },
        {
          t: 'list',
          items: [
            'Pair for the bidder’s team: the points they need go down by 4.',
            'Pair for the opponents: the points the bidder’s team needs go up by 4.',
          ],
        },
        { t: 'example', title: 'Example', lines: ['The bid was 18.', 'A pair for the bidder’s team: they need 14 points.', 'A pair for the opponents: they need 22 points.'] },
      ],
    },
    {
      id: 'score',
      title: 'Scoring and winning',
      blocks: [
        {
          t: 'list',
          items: [
            'The points of each trick go to the team that won it.',
            'The team that wins the last (8th) trick gets 1 extra point.',
            'At the end of the round, if the bidder’s team has at least the points it needs, it gets +1 game point. If not, −1.',
            'The other team’s game points do not change that round.',
            'A team wins when its game points reach the target (2, 3, 5 or 7, chosen when the room is created). If a team drops to minus the target, it loses and the other team wins.',
          ],
        },
        {
          t: 'example',
          title: 'Example',
          lines: ['Your team bid 18.', 'It collected 20 points in the round (including the last trick) → +1 game point.', 'Had it collected only 15 → −1 game point.'],
        },
        { t: 'tip', text: 'Throw point cards (J, 9, A, 10) onto a trick your partner is winning, so the points stay with your team. Avoid giving point cards to a trick the opponents will win.' },
      ],
    },
    {
      id: 'tips',
      title: 'Tips for beginners',
      blocks: [
        {
          t: 'list',
          items: [
            'Before bidding, remember you only see 4 cards; the other 4 are still to come. High bids are risky.',
            'When choosing trump, pick the suit where you have the most cards, or the J and the 9.',
            'If the opponents hold the bid and you cannot follow suit, ask for trump, then play accordingly.',
            'Watch which suit your partner leads and help them win.',
          ],
        },
      ],
    },
  ],
};

const pokerGuide: Guide = {
  id: 'poker',
  name: 'Poker (Texas Hold’em)',
  tagline: '2 to 6 players with play-money chips. Win everyone’s chips and be the last one left',
  quick: [
    'Everyone gets 2 secret cards. 5 shared cards are turned up on the table in stages.',
    'Your hand is the best 5 of your 2 cards plus the 5 on the table, 7 cards in all.',
    'There is betting at every stage. At the end the best hand (or the last player left) wins the pot.',
    'Whoever ends up with all the chips wins the game.',
  ],
  sections: [
    {
      id: 'goal',
      title: 'Goal and chips',
      blocks: [
        {
          t: 'list',
          items: [
            'Everyone starts with the same number of chips (500, 1000, 2000 or 5000, chosen when the room is created). The chips are play money, not real money.',
            'A player who runs out of chips is out.',
            'The last player holding chips wins. If several are still in after 120 hands, the biggest stack wins.',
          ],
        },
      ],
    },
    {
      id: 'blinds',
      title: 'Dealer button and blinds',
      blocks: [
        {
          t: 'list',
          items: [
            'The dealer button moves one seat every hand.',
            'The player after the button is the small blind (SB), the next one is the big blind (BB). They put in forced bets before seeing their cards, so there are always some chips in the pot.',
            'With only 2 players, the button is the small blind.',
          ],
        },
        { t: 'example', title: 'Example', lines: ['With 1000 chips the blinds start at 10/20 (SB 10, BB 20).', 'Every 8 hands the blinds go up: 10/20 → 15/30 → 25/50 → 50/100 …'] },
        { t: 'tip', text: 'The blinds keep rising, so sitting quietly slowly drains your chips. When you get a good hand, bet boldly.' },
      ],
    },
    {
      id: 'flow',
      title: 'Steps of one hand',
      blocks: [
        {
          t: 'steps',
          items: [
            'Preflop: everyone gets 2 secret cards. Betting starts with the player after the big blind.',
            'Flop: 3 shared cards are turned up. Another round of betting.',
            'Turn: 1 more shared card. Betting.',
            'River: the last shared card. The final betting round.',
            'Showdown: everyone who has not folded shows their cards. The best hand wins the pot.',
          ],
        },
        { t: 'p', text: 'If everyone else folds at any point, the last player wins the pot without showing cards.' },
      ],
    },
    {
      id: 'actions',
      title: 'Your actions',
      blocks: [
        {
          t: 'table',
          head: ['Action', 'Meaning'],
          rows: [
            ['Fold', 'Give up the hand. You pay nothing more, but you lose any claim to the pot.'],
            ['Check', 'If nobody has bet, pass without paying.'],
            ['Call', 'Put in as many chips as the current bet.'],
            ['Raise / Bet', 'Increase the bet. As much as you like, up to all your chips. At least as big as the last raise ("Min" button).'],
            ['All-in', 'Put in all your chips. If you are short, a call becomes an all-in.'],
          ],
        },
        {
          t: 'list',
          items: [
            'An all-in player stays in until the showdown. They can only win as much of the pot as they put in; the extra bets go into a separate "side pot".',
            '"Raise to 60" means your total bet on this round is 60. Others must match 60 to stay in.',
            'You have about 25 seconds. When time runs out you check if you can, otherwise you fold.',
          ],
        },
      ],
    },
    {
      id: 'ranks',
      title: 'Hand ranking (best to worst)',
      blocks: [
        {
          t: 'ranks',
          rows: [
            { name: '1. Straight flush', desc: '5 cards in a row, all of one suit. 10 J Q K A of one suit is the royal flush, the best hand of all.', cards: ['5S', '6S', '7S', '8S', '9S'] },
            { name: '2. Four of a kind', desc: '4 cards of the same rank.', cards: ['KS', 'KH', 'KD', 'KC', '3S'] },
            { name: '3. Full house', desc: '3 cards of one rank plus 2 cards of another rank.', cards: ['9S', '9H', '9D', '4C', '4S'] },
            { name: '4. Flush', desc: 'All 5 cards of the same suit, in any order.', cards: ['AH', '9H', '7H', '4H', '2H'] },
            { name: '5. Straight', desc: '5 ranks in a row, any suits. A-2-3-4-5 counts (ace low); 10-J-Q-K-A is the highest.', cards: ['5C', '6D', '7H', '8S', '9C'] },
            { name: '6. Three of a kind', desc: '3 cards of the same rank.', cards: ['8S', '8H', '8D', 'KC', '3S'] },
            { name: '7. Two pair', desc: 'Two different pairs.', cards: ['JS', 'JH', '4D', '4C', '9S'] },
            { name: '8. Pair', desc: 'Two cards of the same rank.', cards: ['10S', '10H', 'AD', '6C', '3S'] },
            { name: '9. High card', desc: 'If nothing matches, your highest card counts.', cards: ['AS', 'JD', '8C', '5H', '2S'] },
          ],
        },
        { t: 'p', text: 'With the same kind of hand, the higher cards win. If they are exactly equal, the pot is split.' },
      ],
    },
    {
      id: 'example',
      title: 'A whole hand, worked out',
      blocks: [
        { t: 'cards', cards: ['AS', 'KS'], caption: 'Your 2 secret cards' },
        { t: 'cards', cards: ['QS', 'JS', '3D', '9S', '2H'], caption: 'The 5 shared cards (flop: Q J 3, turn: 9, river: 2)' },
        {
          t: 'example',
          title: 'Who wins',
          lines: [
            'Your ♠A ♠K plus the ♠Q ♠J ♠9 on the table make 5 spades: a flush.',
            'Your opponent holds ♦10 and ♣8. With the Q J 9 on the table that is 8-9-10-J-Q, a straight.',
            'A flush beats a straight, so you win the pot.',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: 'Tips for beginners',
      blocks: [
        {
          t: 'list',
          items: [
            'Start with strong hands: big pairs (AA, KK, QQ), A-K, A-Q, and suited cards that are next to each other.',
            'Do not be afraid to fold weak cards. It saves chips.',
            'Sitting close to the button means you act later and see what others do first. That is an advantage.',
            'Think before going all-in: if you lose, you are out.',
          ],
        },
      ],
    },
  ],
};

export const GUIDES: Guide[] = [callbreakGuide, twentyNineGuide, pokerGuide];

/** Strings of the guide page itself. */
export const GUIDE_UI = { quick: 'The game in one minute', openAll: 'Open all', closeAll: 'Close all', wins: 'wins', example: 'Example' } as const;
