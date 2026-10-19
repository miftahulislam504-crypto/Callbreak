import { Text, View } from 'react-native';

import { Card } from '@/components/kit';
import { MenuPage } from '@/components/menu';
import { MUTED } from '@/constants/palette';
import { useT } from '@/lib/i18n';

// Intentionally empty for now: new options will be added here later.
export default function More() {
  const t = useT();
  return (
    <MenuPage title={t('moreTitle')}>
      <Card>
        <View style={{ alignItems: 'center', paddingVertical: 28, gap: 8 }}>
          <Text style={{ fontSize: 38, color: 'rgba(255,255,255,0.18)' }}>♠</Text>
          <Text style={{ color: MUTED, fontSize: 14, textAlign: 'center' }}>{t('comingSoon')}</Text>
        </View>
      </Card>
    </MenuPage>
  );
}
