import { useState } from 'react';
import { Switch, View } from 'react-native';

import { Text } from '@/components/text';
import { Button, Card, Field, Row } from '@/components/kit';
import { MenuPage } from '@/components/menu';
import { GameSwitch } from '@/components/GameSwitch';
import { SettingPicker } from '@/components/target-picker';
import { CREAM, GOLD, MUTED } from '@/constants/palette';
import { LIMITS } from '@/lib/env';
import { POKER_DEFAULT_CHIPS, TN_DEFAULT_TARGET } from '@/lib/games';
import { useT } from '@/lib/i18n';
import type { GameId } from '@/lib/types';
import { useGamePick } from '@/state/gamePick';
import { useRoom } from '@/state/room';

export default function NewRoom() {
  const t = useT();
  const { busy, createRoom } = useRoom();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const game = useGamePick((s) => s.game);
  const [settings, setSettings] = useState<Record<GameId, number>>({
    callbreak: LIMITS.defaultTarget,
    twentynine: TN_DEFAULT_TARGET,
    poker: POKER_DEFAULT_CHIPS,
  });
  const setting = settings[game];

  return (
    <MenuPage title={t('createRoom')} hint={t('createHint')}>
      <Card>
        <GameSwitch compact />
        <Field label={t('roomNameOpt')} value={roomName} onChangeText={setRoomName} maxLength={LIMITS.maxName} />
        <Row style={{ justifyContent: 'space-between' }}>
          <View style={{ flex: 1 }}>
            <Text style={{ color: CREAM, fontWeight: '800', fontSize: 14 }}>{t('privateRoom')}</Text>
            <Text style={{ color: MUTED, fontSize: 12 }}>{t('privateHint')}</Text>
          </View>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: 'rgba(255,255,255,0.18)', true: GOLD }}
            thumbColor="#fff"
          />
        </Row>
        <SettingPicker game={game} value={setting} onChange={(n) => setSettings((o) => ({ ...o, [game]: n }))} />
        <Button
          title={t('create')}
          variant="gold"
          onPress={() =>
            void createRoom({
              game,
              roomName: roomName.trim() || undefined,
              isPrivate,
              ...(game === 'poker' ? { startingChips: setting } : { targetScore: setting }),
            })
          }
          loading={busy}
        />
      </Card>
    </MenuPage>
  );
}
