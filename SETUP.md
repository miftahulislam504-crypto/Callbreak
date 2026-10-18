# Call Break app: setup

## 1. Firebase (new project, ফ্রি Spark plan)
1. https://console.firebase.google.com → **Add project** (Analytics লাগবে না)
2. **Build → Authentication → Sign-in method → Anonymous → Enable**
3. **Build → Firestore Database → Create database** (production mode), তারপর **Rules** ট্যাবে এই repo-র `firestore.rules` paste করে Publish
4. **Project settings → Your apps → Web (</>)** → app register করো → দেখানো config-এর মানগুলো `.env.local`-এ বসাও (`.env.example` কপি করে)

## 2. Server URL
`.env.local`-এ `EXPO_PUBLIC_SERVER_URL`:
- ডেভেলপমেন্ট, real ফোন (PC-র সাথে একই Wi-Fi): `ws://<PC-র IPv4>:2567` (Windows: `ipconfig`)
- Android emulator: `ws://10.0.2.2:2567`
- Render-এ deploy করার পর: `wss://<তোমার-service>.onrender.com` (server-এর `DEPLOY.md` দেখো)

Server লোকালি চালাও: `cd callbreak-server && npm run dev`
Firebase দিয়ে token যাচাই চালু করতে server-এ `FIREBASE_PROJECT_ID=<projectId>` সেট করো। না করলে server dev মোডে চলে।

## 3. ডেভেলপমেন্টে app চালানো
```
npm install
cp .env.example .env.local     # তারপর মানগুলো বসাও
npx expo start --android
```
`.env.local` বদলালে `expo start` আবার চালু করো (EXPO_PUBLIC_* build-time-এ বসে)।
Firebase keys খালি রাখলে app **local-guest মোডে** চলে (শুধু dev-মোড server-এর সাথে)।

## 4. বন্ধুদের জন্য APK বানানো (EAS, ফ্রি)

### Expo account
1. https://expo.dev/signup এ সাইনআপ করো, email verify করো
2. terminal-এ: `npx eas-cli@latest login`

### একবারের সেটআপ
```
npx eas-cli init
```
(এটা project-কে তোমার Expo account-এর সাথে জুড়ে `app.json`-এ projectId বসায়।)
`app.json`-এ `android.package` এখন `com.callbreak.app`। এটা বদলাতে চাইলে **প্রথম build-এর আগেই** বদলাও।

### env variable (APK-তে server URL আর Firebase config ঢোকানো)
EAS build তোমার `.env.local` পড়ে না, তাই এগুলো EAS-এ রাখতে হবে (`preview` environment):
```
npx eas-cli env:create --name EXPO_PUBLIC_SERVER_URL --value wss://<তোমার-service>.onrender.com --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_FIREBASE_API_KEY --value <apiKey> --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN --value <authDomain> --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_FIREBASE_PROJECT_ID --value <projectId> --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET --value <storageBucket> --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID --value <senderId> --environment preview --visibility plaintext
npx eas-cli env:create --name EXPO_PUBLIC_FIREBASE_APP_ID --value <appId> --environment preview --visibility plaintext
npx eas-cli env:list --environment preview
```
(Firebase web config গোপন কিছু না, `plaintext` দিলে সমস্যা নেই।)

### Build
```
npx eas-cli build -p android --profile preview
```
- ফ্রি plan-এ মাসে ১৫টা Android build, আর queue ধীর (কখনো ঘণ্টাখানেক অপেক্ষা)। ৪৫ মিনিটের বেশি লাগলে বাতিল হয়।
- শেষে একটা লিংক পাবে। ওই `.apk` ফাইল ফোনে নামিয়ে install করো। বন্ধুদের ওই লিংক বা ফাইল WhatsApp/Drive-এ পাঠাও। ফোনে "unknown sources থেকে install" অনুমতি দিতে হবে।
- URL বা Firebase config বদলালে env আপডেট করে নতুন build দিতে হবে।

## 5. ফোন ছাড়া দ্রুত যাচাই
```
cd callbreak-server && PORT=2599 npx tsx src/server.ts
cd callbreak-server && SERVER=ws://localhost:2599 npx tsx ../callbreak-app/scripts/smoke.ts
cd callbreak-server && CB_FAST=1 PORT=2599 npx tsx src/server.ts     # আলাদা terminal-এ, তারপর:
cd callbreak-server && SERVER=ws://localhost:2599 npx tsx ../callbreak-app/scripts/playthrough.ts
npm test
```

> Google login এখনো নেই। লাগলে EAS development build লাগবে (Expo Go-তে চলে না)।
