import { useState } from 'react';

import { Button, Card, Field } from '@/components/kit';
import { MenuPage } from '@/components/menu';
import { useT } from '@/lib/i18n';
import { useRoom } from '@/state/room';

export default function JoinWithId() {
  const t = useT();
  const { busy, joinRoom } = useRoom();
  const [code, setCode] = useState('');

  return (
    <MenuPage title={t('joinById')} hint={t('joinHint')}>
      <Card>
        <Field
          value={code}
          onChangeText={(s) => setCode(s.replace(/[^a-zA-Z0-9]/g, '').toUpperCase())}
          placeholder={t('roomIdPh')}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={6}
          style={{ letterSpacing: 4, fontWeight: '800', fontSize: 20, textAlign: 'center' }}
        />
        <Button title={t('join')} variant="gold" onPress={() => void joinRoom(code)} disabled={code.length !== 6} loading={busy} />
      </Card>
    </MenuPage>
  );
}
