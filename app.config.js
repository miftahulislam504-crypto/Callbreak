// Dynamic part of the Expo config. app.json stays the source of truth; this only changes what must differ
// per build profile (set via `env` in eas.json):
//
// - CB_RELEASE=1 (`production` profile): store release. Must not allow plain-text (ws:// / http://) traffic:
//   the real server is wss:// on Render. Development and preview builds keep it, so a phone on the same
//   Wi-Fi can reach a PC at ws://192.168.x.x:2567.
// - CB_ARM64_ONLY=1 (`preview` profile): test APK for modern phones only. Drops the 32-bit armeabi-v7a native
//   libs (Agora is big) so the APK is much smaller. Production keeps both ABIs, because the Play Store (AAB)
//   delivers only the matching one to each device and 32-bit phones still exist.
module.exports = ({ config }) => {
  const release = process.env.CB_RELEASE === '1';
  const arm64Only = process.env.CB_ARM64_ONLY === '1';
  if (!release && !arm64Only) return config;

  const androidOverrides = {};
  if (release) androidOverrides.usesCleartextTraffic = false;
  if (arm64Only) androidOverrides.buildArchs = ['arm64-v8a'];

  return {
    ...config,
    plugins: (config.plugins ?? []).map((plugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
        ? [plugin[0], { ...plugin[1], android: { ...plugin[1]?.android, ...androidOverrides } }]
        : plugin,
    ),
  };
};
