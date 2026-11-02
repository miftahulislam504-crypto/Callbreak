import { router } from 'expo-router';

import { GameButton } from '@/components/gameui';
import { MenuPage } from '@/components/menu';
import { useT } from '@/lib/i18n';

// More options live here. For now: how your cards and table look.
export default function More() {
  const t = useT();
  return (
    <MenuPage title={t('moreTitle')}>
      <GameButton
        tone="green"
        icon="color-palette"
        title={t('customizeTitle')}
        hint={t('customizeHint')}
        style={{ height: 76 }}
        onPress={() => router.push('/customize')}
      />
    </MenuPage>
  );
}
