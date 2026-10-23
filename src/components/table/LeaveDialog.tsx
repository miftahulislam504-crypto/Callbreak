import { Modal, Pressable, Text, View } from 'react-native';

import { CREAM } from '@/constants/palette';
import type { T } from '@/lib/i18n';

const chip = {
  paddingHorizontal: 12, height: 32, borderRadius: 16, alignItems: 'center' as const, justifyContent: 'center' as const,
  backgroundColor: 'rgba(20,12,4,0.62)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
};

/** "Leave the game?" (our own dialog: react-native-web's Alert.alert ignores buttons). */
export function LeaveDialog({ visible, onStay, onLeave, t }: { visible: boolean; onStay: () => void; onLeave: () => void; t: T }) {
  return (
    <Modal visible={visible} transparent animationType="fade" supportedOrientations={['landscape', 'landscape-left', 'landscape-right']} onRequestClose={onStay}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: 'rgba(0,0,0,0.55)' }}>
        <View style={{ width: 340, maxWidth: '90%', borderRadius: 18, padding: 18, gap: 12, backgroundColor: '#0B2F21', borderWidth: 2, borderColor: '#C99A2E' }}>
          <Text style={{ color: CREAM, fontSize: 18, fontWeight: '900' }}>{t('leaveConfirmTitle')}</Text>
          <Text style={{ color: 'rgba(246,241,227,0.8)', fontSize: 13.5 }}>{t('leaveConfirmBody')}</Text>
          <View style={{ flexDirection: 'row', gap: 10, justifyContent: 'flex-end' }}>
            <Pressable onPress={onStay} style={[chip, { height: 40, paddingHorizontal: 18 }]}>
              <Text style={{ color: CREAM, fontWeight: '800', fontSize: 14 }}>{t('stay')}</Text>
            </Pressable>
            <Pressable onPress={onLeave} style={[chip, { height: 40, paddingHorizontal: 18, backgroundColor: 'rgba(160,30,36,0.9)' }]}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 14 }}>{t('leave')}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
