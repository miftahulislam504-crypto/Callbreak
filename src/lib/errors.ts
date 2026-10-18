export interface AppError {
  code: string;
  message: string;
}

/** Turns whatever the Colyseus SDK / fetch throws into a small set of codes the UI can translate. */
export function toAppError(e: unknown): AppError {
  const message = e instanceof Error ? e.message : String(e);
  const m = message.toLowerCase();
  const code =
    typeof (e as { code?: unknown })?.code === 'string' ? ((e as { code: string }).code as string) : '';
  if (code === 'auth' || m.includes('invalid_token') || m.includes('not_signed_in')) return { code: 'auth', message };
  if (m.includes('not found') || m.includes('invalid_room') || m.includes('invalid room') || m.includes('4212')) {
    return { code: 'room_not_found', message };
  }
  if (m.includes('full') || m.includes('locked')) return { code: 'room_full', message };
  if (m.includes('network') || m.includes('fetch') || m.includes('timeout') || m.includes('econn') || m.includes('websocket') || m.includes('abort')) {
    return { code: 'network', message };
  }
  return { code: 'unknown', message };
}
