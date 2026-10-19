import { useState } from 'react';
import { Switch, Text, View } from 'react-native';

import { Button, Card, Field, Row } from '@/components/kit';
import { MenuPage } from '@/components/menu';
import { TargetPicker } from '@/components/target-picker';
import { CREAM, GOLD, MUTED } from '@/constants/palette';
import { LIMITS } from '@/lib/env';
import { useT } from '@/lib/i18n';
import { useRoom } from '@/state/room';

export default function NewRoom() {
  const t = useT();
  const { busy, createRoom } = useRoom();
  const [roomName, setRoomName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [target, setTarget] = useState<number>(LIMITS.defaultTarget);

  return (
    <MenuPage title={t('createRoom')} hint={t('createHint')}>
      <Card>
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
        <TargetPicker value={target} onChange={setTarget} />
        <Button
          title={t('create')}
          variant="gold"
          onPress={() => void createRoom({ roomName: roomName.trim() || undefined, isPrivate, targetScore: target })}
          loading={busy}
        />
      </Card>
    </MenuPage>
  );
}
