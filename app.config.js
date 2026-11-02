// Dynamic part of the Expo config. app.json stays the source of truth; this only changes what must differ
// in a store release (CB_RELEASE=1, set by the `production` profile in eas.json).
//
// Release builds must not allow plain-text (ws:// / http://) traffic: the real server is wss:// on Render.
// Development and preview builds keep it, so a phone on the same Wi-Fi can reach a PC at ws://192.168.x.x:2567.
module.exports = ({ config }) => {
  if (process.env.CB_RELEASE !== '1') return config;
  return {
    ...config,
    plugins: (config.plugins ?? []).map((plugin) =>
      Array.isArray(plugin) && plugin[0] === 'expo-build-properties'
        ? [plugin[0], { ...plugin[1], android: { ...plugin[1]?.android, usesCleartextTraffic: false } }]
        : plugin,
    ),
  };
};
