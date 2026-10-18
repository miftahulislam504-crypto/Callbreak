# Call Break app: Phase 2 setup

## 1. Firebase (new project)
1. https://console.firebase.google.com → **Add project** (Analytics লাগবে না)
2. **Build → Authentication → Sign-in method → Anonymous → Enable**
3. **Build → Firestore Database → Create database** (production mode), তারপর **Rules** ট্যাবে এই repo-র `firestore.rules` paste করে Publish
4. **Project settings → Your apps → Web (</>)** → app register করো → দেখানো config-এর মানগুলো `.env`-এ বসাও (`.env.example` কপি করে)

## 2. Server URL
`.env`-এ `EXPO_PUBLIC_SERVER_URL`:
- real ফোন (PC-র সাথে একই Wi-Fi): `ws://<PC-র IPv4>:2567` (Windows: `ipconfig`)
- Android emulator: `ws://10.0.2.2:2567`
- deploy করার পর: `wss://<তোমার-app>.fly.dev`

Server চালাও: `cd callbreak-server && npm run dev`
Firebase দিয়ে token যাচাই চালু করতে server-এ `FIREBASE_PROJECT_ID=<তোমার projectId>` সেট করো। না করলে server dev মোডে চলে (পরিচয় যাচাই হয় না)।

## 3. App চালানো
```
npm install
cp .env.example .env     # তারপর মানগুলো বসাও
npx expo start --android
```
`.env` বদলালে `expo start` আবার চালু করো (EXPO_PUBLIC_* build-time-এ বসে)।

Firebase keys খালি রাখলে app **local-guest মোডে** চলে। এতে Firebase ছাড়াই লবি/গেম টেস্ট করা যায় (শুধু dev-মোড server-এর সাথে)।

> Google login এই ধাপে নেই। পরে যোগ হলে EAS development build লাগবে (Expo Go-তে চলে না)।

## 4. দ্রুত যাচাই (ফোন ছাড়া)
```
cd callbreak-server && PORT=2599 npx tsx src/server.ts
cd callbreak-server && SERVER=ws://localhost:2599 npx tsx ../callbreak-app/scripts/smoke.ts
```
