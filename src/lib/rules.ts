/**
 * The first N rounds are played without bidding. Keep in sync with the server's CB_NO_BID_ROUNDS
 * (default 1): the server deals those rounds straight into play and scores them as tricks won.
 */
export const NO_BID_ROUNDS = 1;

export const isNoBidRound = (round: number): boolean => round <= NO_BID_ROUNDS;
