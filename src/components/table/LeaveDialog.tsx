import { Modal, View } from 'react-native';

import { PanelShine } from '@/components/frame';
import { Button } from '@/components/kit';
import { Text } from '@/components/text';
import { txt } from '@/constants/fonts';
import { CREAM, SCRIM } from '@/constants/palette';
import { PANEL_FRAME, TITLE_SHADOW } from '@/constants/ui';
import type { T } from '@/lib/i18n';

/** "Leave the game?" (our own dialog: react-native-web's Alert.alert ignores buttons). */
export function LeaveDialog({ visible, onStay, onLeave, t }: { visible: boolean; onStay: () => void; onLeave: () => void; t: T }) {
  return (
    <Modal visible={visible} transparent animationType="fade" supportedOrientations={['landscape', 'landscape-left', 'landscape-right']} onRequestClose={onStay}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: SCRIM }}>
        <View style={[PANEL_FRAME, { width: 340, maxWidth: '90%', padding: 18, gap: 12 }]}>
          <PanelShine />
          <Text style={[txt(20), { color: CREAM }, TITLE_SHADOW]}>{t('leaveConfirmTitle')}</Text>
          <Text style={[txt(13.5, false), { color: 'rgba(246,241,227,0.8)' }]}>{t('leaveConfirmBody')}</Text>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Button compact variant="secondary" title={t('stay')} onPress={onStay} />
            <Button compact variant="danger" title={t('leave')} onPress={onLeave} />
          </View>
        </View>
      </View>
    </Modal>
  );
}
