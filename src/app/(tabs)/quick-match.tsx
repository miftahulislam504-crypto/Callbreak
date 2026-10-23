import { useState } from 'react';

import { Button, Card } from '@/components/kit';
import { GameSwitch } from '@/components/GameSwitch';
import { MenuPage } from '@/components/menu';
import { SettingPicker } from '@/components/target-picker';
import { LIMITS } from '@/lib/env';
import { POKER_DEFAULT_CHIPS, TN_DEFAULT_TARGET } from '@/lib/games';
import { useT } from '@/lib/i18n';
import type { GameId } from '@/lib/types';
import { useGamePick } from '@/state/gamePick';
import { useRoom } from '@/state/room';

export default function QuickMatch() {
  const t = useT();
  const { busy, quickMatch } = useRoom();
  const game = useGamePick((s) => s.game);
  const [settings, setSettings] = useState<Record<GameId, number>>({
    callbreak: LIMITS.defaultTarget,
    twentynine: TN_DEFAULT_TARGET,
    poker: POKER_DEFAULT_CHIPS,
  });
  const setting = settings[game];

  return (
    <MenuPage title={t('quickMatch')} hint={t('quickHint')}>
      <Card>
        <GameSwitch compact />
        <SettingPicker game={game} value={setting} onChange={(n) => setSettings((o) => ({ ...o, [game]: n }))} />
        <Button title={t('findMatch')} variant="gold" onPress={() => void quickMatch(game, setting)} loading={busy} />
      </Card>
    </MenuPage>
  );
}
