// The Colyseus SDK falls back to the Node `ws` package when there is no global WebSocket.
// React Native always has a global WebSocket, so `ws` (which needs Node's `stream`) is stubbed out.
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const upstream = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === 'ws') return { type: 'empty' };
  return (upstream ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
