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
cd callbreak-server && CB_FAST=1 PORT=2599 npx tsx src/server.ts     # আলাদা terminal-এ (smoke আর playthrough দুটোর জন্যই CB_FAST=1 লাগে), তারপর:
cd callbreak-server && SERVER=ws://localhost:2599 npx tsx ../callbreak-app/scripts/smoke.ts
cd callbreak-server && SERVER=ws://localhost:2599 npx tsx ../callbreak-app/scripts/playthrough.ts
npm test
```

> Google login এখনো নেই। লাগলে EAS development build লাগবে (Expo Go-তে চলে না)।

## 6. ভয়েস চ্যাট (Agora)
- ভয়েস **নেটিভ মডিউল** (`react-native-agora`) ব্যবহার করে, তাই **Expo Go-তে চলবে না** এবং **ওয়েবে থাকবে না**। ওই দুই জায়গায় গেম আগের মতোই চলে, শুধু ভয়েস বন্ধ থাকে। ভয়েস চালাতে নতুন APK লাগবে: `npx eas-cli build -p android --profile preview`।
- `App ID` অ্যাপে বসাতে হয় না, সার্ভার (Render) থেকে আসে। Render-এ `AGORA_APP_ID` ও `AGORA_APP_CERTIFICATE` থাকতে হবে।
- প্রাইভেট রুমে ২ জন মানুষ বসলে ভয়েসে অটো-জয়েন হয়, **মাইক মিউট অবস্থায়**। প্রথমবার আনমিউট করলে মাইক পারমিশন চায়।
- অ্যাপ ৩০ সেকেন্ডের বেশি ব্যাকগ্রাউন্ডে থাকলে ভয়েস আপনাআপনি কেটে যায় (Agora মিনিট বাঁচাতে), ফিরলে আবার জোড়া লাগে।
- `app.json`-এ `CAMERA` পারমিশন ইচ্ছে করে ব্লক করা (Agora SDK নিজে এটা চায়, কিন্তু আমরা শুধু অডিও ব্যবহার করি)।
- টোকেনের মেয়াদ ১ ঘণ্টা। অ্যাপ মেয়াদ শেষের ৫ মিনিট আগে নিজে নতুন টোকেন চেয়ে SDK-কে দেয়, তাই লম্বা সেশনেও ভয়েস কাটে না। অ্যাপ সামনে না থাকলে রিনিউ চাওয়া হয় না।
- ভয়েসে কোনো সমস্যা হলে (ইন্টারনেট গেলে, সার্ভিস বন্ধ থাকলে, সেশন শেষ হলে) ছোট বার্তা দেখায় আর বাটন "আবার চেষ্টা" হয়। গেম কখনো আটকায় না। সার্ভারে `VOICE_ENABLED=0` থাকলে ভয়েস বাটনই থাকে না।
- শব্দ ডিফল্টে ফোনের স্পিকারে যায়; তারের হেডফোন বা ব্লুটুথ হেডসেট লাগালে নিজে সেখানে যায়। ব্লুটুথের জন্য Android 12+ এ প্রথম আনমিউটে "Nearby devices" পারমিশন চায় (না দিলেও ভয়েস চলে)। স্পিকারে মাইক চালু করলে প্রথমবার হেডফোনের পরামর্শ দেখায়।
- মাসিক Agora খরচ-পাহারা ও কিল-সুইচ: `docs/VOICE_OPS.md`। আসল ফোনে টেস্টের তালিকা: `docs/VOICE_QA.md`। Play Store Data safety: `docs/PLAY_DATA_SAFETY.md`।

## 7. Play Store রিলিজ বিল্ড
```
npx eas-cli build -p android --profile production
```
- `production` প্রোফাইল AAB বানায় এবং `CB_RELEASE=1` বসায়; `app.config.js` তখন `usesCleartextTraffic` বন্ধ করে (শুধু `wss://` চলে)। `preview` ও ডেভ বিল্ডে `ws://` চলে।
- `EXPO_PUBLIC_*` env-গুলো `production` environment-এও বসাতে হবে (উপরের `env:create` কমান্ড, `--environment production` দিয়ে)।
- version code নিজে বাড়ে (`autoIncrement`)।
