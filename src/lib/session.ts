import type { Identity } from './gameClient';

type Provider = () => Promise<Identity>;
let provider: Provider | null = null;

/** AuthProvider registers how to build the current player's identity. */
export function setIdentityProvider(p: Provider | null): void {
  provider = p;
}

export async function getIdentity(): Promise<Identity> {
  if (!provider) throw Object.assign(new Error('not_signed_in'), { code: 'auth' });
  return provider();
}
