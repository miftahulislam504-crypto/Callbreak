import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';

import { AVATAR_RATIO } from './profile';

/** The stored photo is tiny on purpose: it is sent to the other players and kept in the profile. */
const OUT_W = 96;
/** The server refuses anything over 16000 characters; stay under it. */
const MAX_CHARS = 15000;

export type PickResult = { ok: true; avatar: string } | { ok: false; reason: 'cancelled' | 'failed' };

/** Opens the gallery, lets the player crop, and returns a small JPEG data URI in the avatar's shape. */
export async function pickAvatar(): Promise<PickResult> {
  try {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 5], // = AVATAR_RATIO (Android crop UI; iOS may ignore it, so we crop again below)
      quality: 1,
    });
    const asset = res.canceled ? null : res.assets?.[0];
    if (!asset) return { ok: false, reason: 'cancelled' };

    // Centre-crop to the avatar ratio whatever the picker returned.
    const { width: w, height: h } = asset;
    let cw = w;
    let ch = Math.round(w / AVATAR_RATIO);
    if (ch > h) {
      ch = h;
      cw = Math.round(h * AVATAR_RATIO);
    }
    const crop = { originX: Math.floor((w - cw) / 2), originY: Math.floor((h - ch) / 2), width: cw, height: ch };

    const ref = await ImageManipulator.manipulate(asset.uri).crop(crop).resize({ width: OUT_W }).renderAsync();
    for (const compress of [0.65, 0.45, 0.3]) {
      const out = await ref.saveAsync({ format: SaveFormat.JPEG, compress, base64: true });
      if (!out.base64) break;
      const uri = `data:image/jpeg;base64,${out.base64}`;
      if (uri.length <= MAX_CHARS) return { ok: true, avatar: uri };
    }
    return { ok: false, reason: 'failed' };
  } catch {
    return { ok: false, reason: 'failed' };
  }
}
