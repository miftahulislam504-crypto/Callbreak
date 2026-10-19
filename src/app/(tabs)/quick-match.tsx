import { useState } from 'react';

import { Button, Card } from '@/components/kit';
import { MenuPage } from '@/components/menu';
import { TargetPicker } from '@/components/target-picker';
import { LIMITS } from '@/lib/env';
import { useT } from '@/lib/i18n';
import { useRoom } from '@/state/room';

export default function QuickMatch() {
  const t = useT();
  const { busy, quickMatch } = useRoom();
  const [target, setTarget] = useState<number>(LIMITS.defaultTarget);

  return (
    <MenuPage title={t('quickMatch')} hint={t('quickHint')}>
      <Card>
        <TargetPicker value={target} onChange={setTarget} />
        <Button title={t('findMatch')} variant="gold" onPress={() => void quickMatch(target)} loading={busy} />
      </Card>
    </MenuPage>
  );
}
