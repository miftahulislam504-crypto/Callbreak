// The "How to play" guide for the three games, in Bengali and English.
// The rules mirror the server's engine (callbreak-server: engine/game.ts, rules.ts, twentynine.ts, poker.ts), so if a
// rule changes there, change it here too. Cards in examples are written as rank + suit letter: "10H", "JS", "AD", "7C".
import type { Lang } from './i18n';
import type { GameId } from './types';

export type Block =
  | { t: 'p'; text: string }
  | { t: 'list'; items: string[] }
  | { t: 'steps'; items: string[] }
  | { t: 'cards'; cards: string[]; caption?: string }
  /** One played trick: who played what, which play wins (index into `plays`), and why. */
  | { t: 'trick'; title: string; plays: { who: string; card: string }[]; winner: number; won: string; note: string }
  | { t: 'example'; title: string; lines: string[]; cards?: string[] }
  | { t: 'table'; head: string[]; rows: string[][] }
  | { t: 'ranks'; rows: { name: string; desc: string; cards: string[] }[] }
  | { t: 'tip'; text: string }
  | { t: 'warn'; text: string };

export interface Section {
  id: string;
  title: string;
  blocks: Block[];
}

export interface Guide {
  id: GameId;
  name: string;
  tagline: string;
  /** The whole game in a few lines. */
  quick: string[];
  sections: Section[];
}

/* ===================================================================================================================
 * বাংলা
 * ================================================================================================================ */

const bnCallbreak: Guide = {
  id: 'callbreak',
  name: 'কল ব্রেক',
  tagline: '৪ জনের তাসের খেলা: যত হাত বিড করলে, ঠিক ততটা (বা একটু বেশি) হাত নাও',
  quick: [
    '৪ জন খেলোয়াড়, প্রত্যেকের ১৩টা কার্ড। স্পেড (♠) সবসময় ট্রাম্প (তুরুপ)।',
    'প্রতি রাউন্ডে ১৩টা হাত খেলা হয়। বিডের সমান বা একটু বেশি হাত নিতে পারলেই প্লাস পয়েন্ট।',
    'প্রথম রাউন্ডে বিড নেই। দ্বিতীয় রাউন্ড থেকে বিড ২ থেকে ৮।',
    'বিডের কম হাত নিলে মাইনাস। আবার বিডের ডাবল বা তার বেশি নিলেও মাইনাস!',
  ],
  sections: [
    {
      id: 'words',
      title: 'আগে কয়েকটা শব্দ জেনে নাও',
      blocks: [
        {
          t: 'list',
          items: [
            'হাত (ট্রিক): চারজন একটা করে কার্ড ফেললে এক হাত হয়। যে জেতে সে ওই ৪টা কার্ড তুলে নেয় এবং পরের হাত সে-ই শুরু করে।',
            'সুট: ♠ স্পেড, ♥ হার্ট, ♦ ডায়মন্ড, ♣ ক্লাব।',
            'লিড: হাতের প্রথম কার্ড যে ফেলে। তার কার্ডের সুটই ওই হাতের চলতি সুট।',
            'ট্রাম্প (তুরুপ): স্পেড অন্য সব সুটকে কাটে। একটা ছোট ♠2-ও ♥A-কে হারিয়ে দেয়।',
          ],
        },
        { t: 'cards', cards: ['2C', '7D', '10H', 'JS', 'QH', 'KC', 'AS'], caption: 'কার্ডের মান ছোট থেকে বড়: ২, ৩ … ১০, J, Q, K, A (A সবচেয়ে বড়)।' },
      ],
    },
    {
      id: 'deal',
      title: 'খেলা শুরু: কার্ড ভাগ',
      blocks: [
        {
          t: 'steps',
          items: [
            '৪ জন বসলে খেলা শুরু হয় (কম থাকলে হোস্ট বট বসিয়ে নিতে পারে)।',
            '৫২টা কার্ড থেকে প্রত্যেকে ১৩টা করে পায়। কার্ড দেখার জন্য সময় পাবে; সবাই "রেডি" চাপলে আগেই শুরু হয়ে যায়।',
            'ডিলারের পরের জন প্রথমে বিড করে এবং প্রথম হাত শুরু করে। প্রতি রাউন্ডে ডিলার একজন করে ঘুরে যায়।',
          ],
        },
        { t: 'warn', text: 'কারো হাতে একটাও স্পেড না থাকলে, অথবা কারো সব কার্ড ২ থেকে ৯-এর মধ্যে হলে কার্ড নতুন করে ভাগ হয়।' },
      ],
    },
    {
      id: 'bid',
      title: 'বিড (ডাক) দেওয়া',
      blocks: [
        { t: 'p', text: 'বিড মানে কথা দেওয়া: "এই রাউন্ডে আমি অন্তত এতগুলো হাত নেব।"' },
        {
          t: 'list',
          items: [
            'রাউন্ড ১: বিড নেই, সরাসরি খেলা। যে যত হাত নেয়, তত পয়েন্ট (১ হাত = ১ পয়েন্ট)।',
            'রাউন্ড ২ থেকে: ডিলারের পরের জন থেকে একে একে সবাই ২ থেকে ৮-এর মধ্যে বিড দেয়।',
          ],
        },
        {
          t: 'example',
          title: 'বিড কীভাবে ঠিক করবে',
          cards: ['AS', 'KS', '5S', 'AH', '9H', 'KD', '3D', '7C'],
          lines: [
            'ধরো এগুলো তোমার সেরা কার্ড।',
            '♠A, ♠K, ♥A, ♦K — এই বড় কার্ডগুলো থেকে প্রায় ৩-৪টা হাত পাওয়ার আশা করা যায়।',
            'সব হাত না-ও পেতে পারো, তাই নিরাপদ বিড ৩।',
          ],
        },
        { t: 'tip', text: 'নতুন হলে ২ থেকে ৪-এর মধ্যে বিড করো। বড় বিড মানে বড় ঝুঁকি, আর না পারলে পুরো বিডের সমান পয়েন্ট কাটা যায়।' },
      ],
    },
    {
      id: 'play',
      title: 'কোন কার্ড দেওয়া যাবে',
      blocks: [
        {
          t: 'steps',
          items: [
            'হাত যে শুরু করে (লিড), সে যেকোনো কার্ড ফেলতে পারে।',
            'চলতি সুটের কার্ড থাকলে সেই সুটই দিতে হবে। টেবিলে ওই সুটের সবচেয়ে বড় কার্ডটা হারাতে পারে এমন কার্ড থাকলে সেটাই দিতে হবে। না থাকলে ওই সুটের যেকোনো কার্ড দাও।',
            'চলতি সুট না থাকলে স্পেড দিতে হবে (কাটা)। টেবিলে আগেই কেউ স্পেড দিলে, তার চেয়ে বড় স্পেড থাকলে সেটাই দিতে হবে (ওভার-ট্রাম্প)।',
            'চলতি সুট আর স্পেড, দুটোই না থাকলে যেকোনো কার্ড দিতে পারো।',
          ],
        },
        { t: 'p', text: 'হাত জেতে: স্পেড পড়লে সবচেয়ে বড় স্পেড, না পড়লে চলতি সুটের সবচেয়ে বড় কার্ড।' },
        {
          t: 'trick',
          title: 'উদাহরণ ১: বড় কার্ড দিতেই হবে',
          plays: [
            { who: 'রহিম', card: '5D' },
            { who: 'করিম', card: '9D' },
            { who: 'তুমি', card: 'QD' },
            { who: 'সালমা', card: 'AD' },
          ],
          winner: 3,
          won: 'সালমা জেতে',
          note: 'তোমার হাতে ♦3 আর ♦Q ছিল। টেবিলে ♦9 সবার উপরে, তাই ♦9-কে হারাতে পারে এমন ♦Q-ই দিতে হয়েছে; ♦3 দেওয়া যেত না। শেষে সালমার ♦A সবাইকে হারাল।',
        },
        {
          t: 'trick',
          title: 'উদাহরণ ২: স্পেড দিয়ে কাটা',
          plays: [
            { who: 'রহিম', card: 'KH' },
            { who: 'করিম', card: '5H' },
            { who: 'তুমি', card: '2S' },
            { who: 'সালমা', card: 'AH' },
          ],
          winner: 2,
          won: 'তুমি জেতো',
          note: 'রহিম ♥ লিড করেছে। তোমার ♥ ছিল না, তাই স্পেড দিতে হলো। ♠2 সবচেয়ে ছোট স্পেড হলেও ট্রাম্প, তাই ♥A-কে হারিয়ে হাত তোমার।',
        },
        {
          t: 'trick',
          title: 'উদাহরণ ৩: স্পেডের উপর স্পেড',
          plays: [
            { who: 'রহিম', card: '4C' },
            { who: 'করিম', card: '6S' },
            { who: 'তুমি', card: 'JS' },
            { who: 'সালমা', card: 'KC' },
          ],
          winner: 2,
          won: 'তুমি জেতো',
          note: 'করিম আগে ♠6 দিয়ে কেটেছে। তোমার ♣ নেই, আর ♠6-এর চেয়ে বড় ♠J আছে, তাই ♠J-ই দিতে হলো। এর চেয়ে বড় স্পেড কারো কাছে না থাকলে হাত তোমার।',
        },
      ],
    },
    {
      id: 'score',
      title: 'স্কোর হিসাব',
      blocks: [
        {
          t: 'list',
          items: [
            'বিডের কম হাত নিলে: মাইনাস, অর্থাৎ বিডের সমান পয়েন্ট কাটা।',
            'বিড থেকে শুরু করে ডাবলের একটু নিচ পর্যন্ত হাত নিলে: প্লাস, অর্থাৎ বিডের সমান পয়েন্ট পাবে। বেশি হাত নিলে কোনো বোনাস নেই।',
            'বিডের ডাবল বা তার বেশি হাত নিলে: আবার মাইনাস!',
          ],
        },
        {
          t: 'table',
          head: ['বিড', 'মাইনাস', 'প্লাস', 'আবার মাইনাস'],
          rows: [
            ['২', '০–১ হাত', '২–৩ হাত', '৪+ হাত'],
            ['৩', '০–২', '৩–৫', '৬+'],
            ['৪', '০–৩', '৪–৭', '৮+'],
            ['৫', '০–৪', '৫–৯', '১০+'],
            ['৬', '০–৫', '৬–১১', '১২+'],
            ['৭', '০–৬', '৭–১৩', 'নেই'],
            ['৮', '০–৭', '৮–১৩', 'নেই'],
          ],
        },
        { t: 'p', text: 'বিড ৭ বা ৮ হলে ডাবল করা সম্ভব নয় (মোট হাত ১৩টা), তাই সেখানে শুধু কম নিলেই মাইনাস।' },
        {
          t: 'example',
          title: 'এক রাউন্ডের হিসাব',
          lines: ['রহিম: বিড ৩, নিল ৪ হাত → +৩', 'করিম: বিড ৪, নিল ৩ হাত → −৪ (কম নিয়েছে)', 'সালমা: বিড ৩, নিল ৬ হাত → −৩ (ডাবল হয়ে গেছে)', 'তুমি: বিড ২, নিল ২ হাত → +২'],
        },
        { t: 'tip', text: 'প্রথম রাউন্ডে বিড নেই, তাই বেশি হাত নেওয়াই লক্ষ্য। পরের রাউন্ডে বিড পূর্ণ হয়ে গেলে ডাবলের কাছে যেও না, নিয়ম মেনে যতটা পারো হাত ছেড়ে দাও।' },
      ],
    },
    {
      id: 'win',
      title: 'কে জেতে',
      blocks: [
        {
          t: 'list',
          items: [
            'সব রাউন্ডের স্কোর যোগ হতে থাকে।',
            'যে আগে টার্গেট স্কোরে (রুম বানানোর সময় ঠিক হয়, সাধারণত ৪৯) পৌঁছে একা সবার উপরে থাকে, সে-ই জেতে।',
            'উপরে একাধিক জনের স্কোর সমান হলে খেলা চলতে থাকে।',
            'রাউন্ডের একটা সর্বোচ্চ সীমা আছে। সীমা পার হলে যার স্কোর সবচেয়ে বেশি, সে জেতে।',
          ],
        },
      ],
    },
    {
      id: 'time',
      title: 'সময় ও অটো-প্লে',
      blocks: [
        {
          t: 'list',
          items: [
            'বিডের জন্য প্রায় ২০ সেকেন্ড, কার্ড খেলার জন্য প্রায় ৩০ সেকেন্ড সময় পাবে।',
            'সময় শেষ হলে সার্ভার তোমার হয়ে খেলে দেয়। পরপর ২ বার এমন হলে তোমার সিট অটো-প্লেতে চলে যায়।',
            'নেট চলে গেলে ৬০ সেকেন্ড তোমার সিট ধরে রাখা হয়। এর মধ্যে বট তোমার হয়ে খেলে।',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: 'নতুনদের জন্য টিপস',
      blocks: [
        {
          t: 'list',
          items: [
            'A আর K দিয়ে হাত শুরু করো; ছোট কার্ড পরে রাখো।',
            'কে কোন সুট শেষ করেছে মনে রাখো। তার উপর স্পেড কাটা আসতে পারে।',
            'স্পেডের বড় কার্ড (A, K, Q) প্রায় নিশ্চিত হাত। ছোট স্পেড দিয়ে অকারণে কেটো না।',
            'সবার আগে নিজের বিড পূর্ণ করো, তারপর বাড়তি হাতের কথা ভাবো।',
          ],
        },
      ],
    },
  ],
};

const bnTwentyNine: Guide = {
  id: 'twentynine',
  name: 'টোয়েন্টি-নাইন (২৯)',
  tagline: '৪ জনের দুই টিমের খেলা: পার্টনারের সাথে মিলে পয়েন্ট তোলো',
  quick: [
    '৪ জন, ২ টিম। তোমার পার্টনার তোমার ঠিক উল্টো দিকে বসে।',
    '৩২টা কার্ড (৭ থেকে A)। ক্রম: J > 9 > A > 10 > K > Q > 8 > 7।',
    'কার্ডের পয়েন্ট: J = ৩, 9 = ২, A = ১, 10 = ১, বাকিগুলো ০। সব মিলে ২৮, শেষ হাতের ১ যোগ করে ২৯।',
    'সবচেয়ে বড় ডাক যে দেয় (বিডার), সে গোপনে ট্রাম্প বাছে। তার টিমকে ডাকা পয়েন্ট তুলতে হবে।',
  ],
  sections: [
    {
      id: 'cards',
      title: 'টিম, কার্ড আর পয়েন্ট',
      blocks: [
        { t: 'p', text: 'টেবিলে মুখোমুখি বসা দুজন এক টিম। তোমার সামনের জনই তোমার পার্টনার।' },
        { t: 'cards', cards: ['JS', '9S', 'AS', '10S', 'KS', 'QS', '8S', '7S'], caption: 'শক্তির ক্রম, বড় থেকে ছোট। ৪টা সুটেই এই ক্রম এক।' },
        {
          t: 'table',
          head: ['কার্ড', 'শক্তি', 'পয়েন্ট'],
          rows: [
            ['J (জ্যাক)', '১ম', '৩'],
            ['9', '২য়', '২'],
            ['A', '৩য়', '১'],
            ['10', '৪র্থ', '১'],
            ['K, Q, 8, 7', '৫ম থেকে ৮ম', '০'],
          ],
        },
        { t: 'warn', text: 'এখানে A সবচেয়ে বড় নয়! J সবচেয়ে বড়, তার পরে 9। এই ক্রমটা মাথায় রাখো।' },
      ],
    },
    {
      id: 'flow',
      title: 'এক রাউন্ডের ধাপ',
      blocks: [
        {
          t: 'steps',
          items: [
            'কার্ড ভাগ: প্রথমে প্রত্যেকে ৪টা করে কার্ড পায়।',
            'বিড: ডিলারের পরের জন থেকে ঘুরে ঘুরে ডাক বা পাস। ডাক ১৬ থেকে ২৮। ডাক মানে "আমার টিম এতগুলো পয়েন্ট তুলবে"।',
            'ট্রাম্প বাছা: বিডার ওই ৪টা কার্ড দেখে গোপনে একটা সুট ট্রাম্প বাছে। কাউকে জানায় না।',
            'বাকি ৪টা করে কার্ড দেওয়া হয়। এখন সবার হাতে ৮টা।',
            'হাত খেলা: ৮টা হাত খেলা হয়। প্রথম হাত শুরু করে ডিলারের পরের জন, পরে যে হাত জেতে সে।',
            'রাউন্ড শেষে স্কোর হিসাব।',
          ],
        },
      ],
    },
    {
      id: 'bid',
      title: 'বিডিংয়ের নিয়ম',
      blocks: [
        {
          t: 'list',
          items: [
            'আগের ডাকের চেয়ে বেশি ডাকতে হবে, নইলে পাস।',
            'একবার পাস করলে ওই রাউন্ডে আর ডাকা যায় না।',
            '২৮ ডাকলে আর কেউ ডাকার সুযোগ পায় না, সাথে সাথে সে-ই বিডার।',
            'সবাই পাস করলে শেষ জনকে কমপক্ষে ১৬ ডাকতেই হয়।',
          ],
        },
        {
          t: 'example',
          title: 'উদাহরণ',
          lines: [
            'বিপক্ষ ১ ডাকল ১৬। পার্টনার পাস। বিপক্ষ ২ ডাকল ১৮।',
            'তুমি ২০ ডাকলে। বাকি সবাই পাস করল।',
            'তুমি বিডার, তোমার টিমকে কমপক্ষে ২০ পয়েন্ট তুলতে হবে। এখন ট্রাম্প বাছার পালা তোমার।',
          ],
        },
        { t: 'tip', text: 'প্রথম ৪টা কার্ডে J বা 9 থাকলে ডাকার সাহস পাবে। একই সুটে J আর 9 থাকলে সেটাই ট্রাম্প বানানো ভালো।' },
      ],
    },
    {
      id: 'play',
      title: 'হাত খেলা ও ট্রাম্প জানতে চাওয়া',
      blocks: [
        {
          t: 'steps',
          items: [
            'চলতি সুট থাকলে সেই সুটই দিতে হবে। এখানে বড় কার্ড দিয়ে হারানোর বাধ্যবাধকতা নেই, ছোট কার্ডও দেওয়া যায়।',
            'চলতি সুট না থাকলে তুমি "ট্রাম্প দেখাও" চাইতে পারো। তখন সবাইকে ট্রাম্প সুট দেখানো হয়।',
            'ট্রাম্প দেখানোর পর, চলতি সুট না থাকলে এবং ট্রাম্প থাকলে ট্রাম্প-ই দিতে হয় (কাটা)। ট্রাম্পও না থাকলে যেকোনো কার্ড।',
            'ট্রাম্প দেখানোর আগে চলতি সুট না থাকলে যেকোনো কার্ড ফেলা যায়। এই কার্ড কখনো ট্রাম্প হিসেবে কাটে না, সেটা ট্রাম্প সুটের কার্ড হলেও না।',
          ],
        },
        { t: 'p', text: 'হাত জেতে: চলতি সুটের সবচেয়ে শক্তিশালী কার্ড। কিন্তু ট্রাম্প দেখানোর পর কেউ ট্রাম্প দিলে সবচেয়ে বড় ট্রাম্প জেতে। হাতের কার্ডগুলোর পয়েন্ট বিজয়ী টিম পায়।' },
        {
          t: 'trick',
          title: 'উদাহরণ ১: সাধারণ হাত',
          plays: [
            { who: 'বিপক্ষ ১', card: '8H' },
            { who: 'পার্টনার', card: 'KH' },
            { who: 'বিপক্ষ ২', card: '9H' },
            { who: 'তুমি', card: 'JH' },
          ],
          winner: 3,
          won: 'তুমি জেতো',
          note: 'ক্রম J > 9 > K > 8, তাই ♥J জিতল। হাতে J (৩) আর 9 (২) ছিল, মোট ৫ পয়েন্ট তোমার টিমের।',
        },
        {
          t: 'trick',
          title: 'উদাহরণ ২: ট্রাম্প দেখিয়ে কাটা',
          plays: [
            { who: 'বিপক্ষ ১', card: 'AD' },
            { who: 'পার্টনার', card: '10D' },
            { who: 'বিপক্ষ ২', card: 'QD' },
            { who: 'তুমি', card: '7S' },
          ],
          winner: 3,
          won: 'তুমি জেতো',
          note: 'তোমার ♦ ছিল না, তাই "ট্রাম্প দেখাও" চাইলে। দেখা গেল ট্রাম্প ♠। তোমার ♠7 দিতে হলো, ছোট হলেও ট্রাম্প সব ♦-কে কাটে। হাতে A (১) আর 10 (১), মোট ২ পয়েন্ট।',
        },
      ],
    },
    {
      id: 'pair',
      title: 'জোড়া (K + Q)',
      blocks: [
        { t: 'p', text: 'ট্রাম্প দেখানো হয়ে যাওয়ার পর কেউ ট্রাম্প সুটের K বা Q ফেললে, আর ওই সুটের অন্যটা (Q বা K) তার হাতেই থাকলে "জোড়া" নিজে থেকেই ঘোষণা হয়ে যায়। প্রতি রাউন্ডে প্রথম জোড়াটাই ধরা হয়।' },
        {
          t: 'list',
          items: [
            'জোড়া বিডারের টিমের হলে: তাদের দরকারি পয়েন্ট ৪ কমে যায়।',
            'জোড়া বিপক্ষের হলে: বিডারের টিমের দরকারি পয়েন্ট ৪ বেড়ে যায়।',
          ],
        },
        { t: 'example', title: 'উদাহরণ', lines: ['বিড ১৮ ছিল।', 'বিডারের টিমের জোড়া হলে দরকার ১৪ পয়েন্ট।', 'বিপক্ষের জোড়া হলে দরকার ২২ পয়েন্ট।'] },
      ],
    },
    {
      id: 'score',
      title: 'স্কোর ও জেতা',
      blocks: [
        {
          t: 'list',
          items: [
            'প্রতি হাতের কার্ড-পয়েন্ট ওই হাতের বিজয়ী টিম পায়।',
            'শেষ (৮ম) হাত যে টিম জেতে, সে বাড়তি ১ পয়েন্ট পায়।',
            'রাউন্ড শেষে বিডারের টিমের পয়েন্ট দরকারি পয়েন্টের সমান বা বেশি হলে তারা +১ গেম পয়েন্ট পায়। না হলে −১।',
            'বিপক্ষ টিমের গেম পয়েন্ট ওই রাউন্ডে বদলায় না।',
            'কোনো টিমের গেম পয়েন্ট টার্গেটে (২, ৩, ৫ বা ৭, রুম বানানোর সময় ঠিক হয়) পৌঁছালে তারা জেতে। আবার −টার্গেটে নেমে গেলে তারা হারে, অন্য টিম জেতে।',
          ],
        },
        {
          t: 'example',
          title: 'উদাহরণ',
          lines: ['তোমার টিম ১৮ ডাকল।', 'রাউন্ডে তুলল ২০ পয়েন্ট (শেষ হাতের ১ সহ) → +১ গেম পয়েন্ট।', 'যদি তুলত ১৫ পয়েন্ট → −১ গেম পয়েন্ট।'],
        },
        { t: 'tip', text: 'পয়েন্টের কার্ড (J, 9, A, 10) পার্টনারের জেতা হাতে ফেলে দাও, তাহলে ওই পয়েন্ট নিজের টিমেই থাকবে। বিপক্ষের জেতা হাতে পয়েন্ট-কার্ড ফেলা এড়াও।' },
      ],
    },
    {
      id: 'tips',
      title: 'নতুনদের জন্য টিপস',
      blocks: [
        {
          t: 'list',
          items: [
            'ডাকার আগে মনে রাখো: তোমার কাছে শুধু প্রথম ৪টা কার্ড, বাকি ৪টা এখনো আসেনি। বড় ডাকে ঝুঁকি আছে।',
            'ট্রাম্প বাছার সময় যে সুটে বেশি কার্ড বা J আর 9 আছে, সেটা বাছো।',
            'বিপক্ষ বিডার হলে চলতি সুট না থাকলে ট্রাম্প জানতে চাও। পরে সেই অনুযায়ী খেলো।',
            'পার্টনার কোন সুট লিড করছে খেয়াল করো, তার জেতার চেষ্টায় সাহায্য করো।',
          ],
        },
      ],
    },
  ],
};

const bnPoker: Guide = {
  id: 'poker',
  name: 'পোকার (টেক্সাস হোল্ডেম)',
  tagline: '২ থেকে ৬ জন, নকল চিপ দিয়ে খেলা। সবার চিপ জিতে নিয়ে শেষ জন হও',
  quick: [
    'প্রত্যেকে ২টা গোপন কার্ড পায়। টেবিলের মাঝখানে ৫টা কমন কার্ড ধাপে ধাপে খোলে।',
    'নিজের ২টা আর টেবিলের ৫টা, এই ৭টা থেকে সেরা ৫টা দিয়ে তোমার হাত।',
    'প্রতি ধাপে বেট হয়। শেষে সেরা হাত (বা শেষ পর্যন্ত থাকা জন) পট জেতে।',
    'সব চিপ যার কাছে চলে আসে, সে-ই গেম জেতে।',
  ],
  sections: [
    {
      id: 'goal',
      title: 'লক্ষ্য ও চিপ',
      blocks: [
        {
          t: 'list',
          items: [
            'সবাই সমান চিপ নিয়ে শুরু করে (৫০০, ১০০০, ২০০০ বা ৫০০০, রুম বানানোর সময় ঠিক হয়)। চিপগুলো নকল, আসল টাকা নয়।',
            'কারো চিপ শেষ হয়ে গেলে সে বাদ।',
            'শেষ পর্যন্ত একজন চিপ রাখলে সে জেতে। ১২০ হাতের পরেও একাধিক জন থাকলে যার চিপ সবচেয়ে বেশি সে জেতে।',
          ],
        },
      ],
    },
    {
      id: 'blinds',
      title: 'ডিলার বাটন ও ব্লাইন্ড',
      blocks: [
        {
          t: 'list',
          items: [
            'ডিলার বাটন প্রতি হাতে একজন করে ঘুরে যায়।',
            'বাটনের পরের জন স্মল ব্লাইন্ড (SB), তার পরের জন বিগ ব্লাইন্ড (BB)। কার্ড দেখার আগেই তারা বাধ্যতামূলক বেট রাখে, যাতে পটে সবসময় কিছু চিপ থাকে।',
            'মাত্র ২ জন থাকলে বাটনই স্মল ব্লাইন্ড।',
          ],
        },
        { t: 'example', title: 'উদাহরণ', lines: ['১০০০ চিপে শুরু করলে ব্লাইন্ড হয় ১০/২০ (SB ১০, BB ২০)।', 'প্রতি ৮ হাত পর ব্লাইন্ড বাড়ে: ১০/২০ → ১৫/৩০ → ২৫/৫০ → ৫০/১০০ …'] },
        { t: 'tip', text: 'ব্লাইন্ড বাড়তে থাকে, তাই চুপচাপ বসে থাকলে চিপ আস্তে আস্তে কমে যাবে। ভালো হাত পেলে সাহস করে বেট করো।' },
      ],
    },
    {
      id: 'flow',
      title: 'এক হাতের ধাপ',
      blocks: [
        {
          t: 'steps',
          items: [
            'প্রিফ্লপ: প্রত্যেকে ২টা গোপন কার্ড পায়। বিগ ব্লাইন্ডের পরের জন থেকে বেটিং শুরু।',
            'ফ্লপ: টেবিলে ৩টা কমন কার্ড খোলে। আবার বেটিং।',
            'টার্ন: ১টা কমন কার্ড আসে। বেটিং।',
            'রিভার: শেষ ১টা কমন কার্ড। শেষ বেটিং।',
            'শোডাউন: যারা ফোল্ড করেনি, তারা কার্ড দেখায়। সেরা হাত পট পায়।',
          ],
        },
        { t: 'p', text: 'যেকোনো সময় সবাই ফোল্ড করলে বাকি একজন কার্ড না দেখিয়েই পট পেয়ে যায়।' },
      ],
    },
    {
      id: 'actions',
      title: 'তোমার অ্যাকশন',
      blocks: [
        {
          t: 'table',
          head: ['অ্যাকশন', 'মানে'],
          rows: [
            ['ফোল্ড', 'হাত ছেড়ে দেওয়া। আর চিপ দিতে হয় না, কিন্তু পটের দাবিও যায়।'],
            ['চেক', 'কেউ বেট না করে থাকলে কিছু না দিয়ে পাস করা।'],
            ['কল', 'চলতি বেটের সমান চিপ দেওয়া।'],
            ['রেইজ / বেট', 'বেট বাড়ানো। যত খুশি বাড়ানো যায়, সর্বোচ্চ তোমার সব চিপ। কমপক্ষে আগের রেইজের সমান বাড়াতে হয় ("মিন" বাটন)।'],
            ['অল-ইন', 'সব চিপ দিয়ে দেওয়া। চিপ কম থাকলে কলও অল-ইন হয়ে যায়।'],
          ],
        },
        {
          t: 'list',
          items: [
            'অল-ইন করা খেলোয়াড় শোডাউন পর্যন্ত হাতে থাকে। সে শুধু ততটুকু পট জিততে পারে, যতটা সে দিয়েছে। বাকি বেট আলাদা "সাইড পটে" যায়।',
            'রেইজ ৬০ মানে এই ধাপে তোমার মোট বেট ৬০ হবে। অন্যদের থাকতে হলে ৬০-এর সমান করতে হবে।',
            'সময় প্রায় ২৫ সেকেন্ড। সময় শেষ হলে চেক করা গেলে চেক হয়ে যায়, না গেলে ফোল্ড।',
          ],
        },
      ],
    },
    {
      id: 'ranks',
      title: 'হাতের ক্রম (সেরা থেকে নিচে)',
      blocks: [
        {
          t: 'ranks',
          rows: [
            { name: '১. স্ট্রেইট ফ্লাশ', desc: 'একই সুটের পরপর ৫টা কার্ড। 10 J Q K A একই সুটে হলে তাকে রয়্যাল ফ্লাশ বলে, এটাই সবার সেরা।', cards: ['5S', '6S', '7S', '8S', '9S'] },
            { name: '২. ফোর অফ আ কাইন্ড', desc: 'একই মানের ৪টা কার্ড।', cards: ['KS', 'KH', 'KD', 'KC', '3S'] },
            { name: '৩. ফুল হাউস', desc: 'একই মানের ৩টা, আর অন্য একই মানের ২টা।', cards: ['9S', '9H', '9D', '4C', '4S'] },
            { name: '৪. ফ্লাশ', desc: '৫টা কার্ডই একই সুটের, ক্রম যা-ই হোক।', cards: ['AH', '9H', '7H', '4H', '2H'] },
            { name: '৫. স্ট্রেইট', desc: 'পরপর ৫টা মান, সুট যেকোনো। A-2-3-4-5 চলে (A ছোট), 10-J-Q-K-A সবচেয়ে বড়।', cards: ['5C', '6D', '7H', '8S', '9C'] },
            { name: '৬. থ্রি অফ আ কাইন্ড', desc: 'একই মানের ৩টা কার্ড।', cards: ['8S', '8H', '8D', 'KC', '3S'] },
            { name: '৭. টু পেয়ার', desc: 'দুটো আলাদা জোড়া।', cards: ['JS', 'JH', '4D', '4C', '9S'] },
            { name: '৮. পেয়ার', desc: 'এক জোড়া একই মানের কার্ড।', cards: ['10S', '10H', 'AD', '6C', '3S'] },
            { name: '৯. হাই কার্ড', desc: 'কিছুই না মিললে সবচেয়ে বড় কার্ড গোনা হয়।', cards: ['AS', 'JD', '8C', '5H', '2S'] },
          ],
        },
        { t: 'p', text: 'একই ধরনের হাত হলে বড় মানের কার্ড যার, সে জেতে। পুরোপুরি সমান হলে পট সমান ভাগ হয়।' },
      ],
    },
    {
      id: 'example',
      title: 'একটা পুরো হাতের উদাহরণ',
      blocks: [
        { t: 'cards', cards: ['AS', 'KS'], caption: 'তোমার ২টা গোপন কার্ড' },
        { t: 'cards', cards: ['QS', 'JS', '3D', '9S', '2H'], caption: 'টেবিলের ৫টা কমন কার্ড (ফ্লপ: Q J 3, টার্ন: 9, রিভার: 2)' },
        {
          t: 'example',
          title: 'কে জিতল',
          lines: [
            'তোমার ♠A ♠K আর টেবিলের ♠Q ♠J ♠9 মিলে ৫টা স্পেড হলো, এটা ফ্লাশ।',
            'প্রতিপক্ষের হাতে ♦10 আর ♣8। টেবিলের Q J 9 মিলে তার 8-9-10-J-Q, মানে স্ট্রেইট হলো।',
            'ফ্লাশ স্ট্রেইটের চেয়ে বড়, তাই তুমি পট জিতলে।',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: 'নতুনদের জন্য টিপস',
      blocks: [
        {
          t: 'list',
          items: [
            'শুরুতে শক্ত হাতে খেলো: বড় জোড়া (AA, KK, QQ), A-K, A-Q, একই সুটের পাশাপাশি কার্ড।',
            'দুর্বল কার্ড হলে ফোল্ড করতে ভয় পেও না। এতে চিপ বাঁচে।',
            'বাটনের কাছাকাছি বসলে তুমি পরে অ্যাকশন করো, মানে অন্যদের চাল দেখে সিদ্ধান্ত নিতে পারো। এটা সুবিধা।',
            'অল-ইন করার আগে ভাবো: হারলে বাদ পড়ে যাবে।',
          ],
        },
      ],
    },
  ],
};

/* ===================================================================================================================
 * English
 * ================================================================================================================ */

const enCallbreak: Guide = {
  id: 'callbreak',
  name: 'Call Break',
  tagline: '4-player card game: win about as many tricks as you bid',
  quick: [
    '4 players, 13 cards each. Spades (♠) are always trump.',
    'Each round has 13 tricks. Win your bid, or a few more, and you score plus points.',
    'No bidding in round 1. From round 2 you bid 2 to 8.',
    'Win fewer tricks than you bid and you lose points. Win double your bid or more and you lose points too!',
  ],
  sections: [
    {
      id: 'words',
      title: 'A few words first',
      blocks: [
        {
          t: 'list',
          items: [
            'Trick: each of the four players puts down one card. The winner takes all four cards and leads the next trick.',
            'Suits: ♠ spades, ♥ hearts, ♦ diamonds, ♣ clubs.',
            'Lead: the first card of a trick. Its suit is the suit everyone must follow.',
            'Trump: spades beat every other suit. Even a ♠2 beats a ♥A.',
          ],
        },
        { t: 'cards', cards: ['2C', '7D', '10H', 'JS', 'QH', 'KC', 'AS'], caption: 'Card order, low to high: 2, 3 … 10, J, Q, K, A (ace is highest).' },
      ],
    },
    {
      id: 'deal',
      title: 'Starting a game',
      blocks: [
        {
          t: 'steps',
          items: [
            'The game starts with 4 players (the host can fill empty seats with bots).',
            'The 52 cards are dealt, 13 each. You get time to look at your cards; if everyone taps "Ready" it starts sooner.',
            'The player after the dealer bids first and leads the first trick. The dealer moves one seat every round.',
          ],
        },
        { t: 'warn', text: 'The cards are dealt again if anyone has no spade at all, or if all of someone’s cards are between 2 and 9.' },
      ],
    },
    {
      id: 'bid',
      title: 'Bidding',
      blocks: [
        { t: 'p', text: 'A bid is a promise: "I will win at least this many tricks this round."' },
        {
          t: 'list',
          items: [
            'Round 1: no bidding, just play. Every trick you win is 1 point.',
            'From round 2: starting with the player after the dealer, everyone bids a number from 2 to 8.',
          ],
        },
        {
          t: 'example',
          title: 'How to choose a bid',
          cards: ['AS', 'KS', '5S', 'AH', '9H', 'KD', '3D', '7C'],
          lines: [
            'Say these are your best cards.',
            '♠A, ♠K, ♥A and ♦K are big cards: you can hope for about 3 to 4 tricks from them.',
            'You may not get them all, so a safe bid is 3.',
          ],
        },
        { t: 'tip', text: 'As a beginner, bid between 2 and 4. A big bid is a big risk: if you miss it you lose the whole bid in points.' },
      ],
    },
    {
      id: 'play',
      title: 'Which card can you play',
      blocks: [
        {
          t: 'steps',
          items: [
            'The player who leads a trick can play any card.',
            'If you have the led suit you must follow it. If you can beat the highest card of that suit on the table, you must. If you cannot, play any card of that suit.',
            'If you have no card of the led suit, you must play a spade (cut). If someone already played a spade and you have a higher one, you must play it (over-trump).',
            'If you have neither the led suit nor a spade, play anything.',
          ],
        },
        { t: 'p', text: 'The trick is won by the highest spade if any spade was played, otherwise by the highest card of the led suit.' },
        {
          t: 'trick',
          title: 'Example 1: you must play higher',
          plays: [
            { who: 'Rahim', card: '5D' },
            { who: 'Karim', card: '9D' },
            { who: 'You', card: 'QD' },
            { who: 'Salma', card: 'AD' },
          ],
          winner: 3,
          won: 'Salma wins',
          note: 'You held ♦3 and ♦Q. The ♦9 was highest on the table, so you had to play the ♦Q that beats it, not the ♦3. In the end Salma’s ♦A beat everything.',
        },
        {
          t: 'trick',
          title: 'Example 2: cutting with a spade',
          plays: [
            { who: 'Rahim', card: 'KH' },
            { who: 'Karim', card: '5H' },
            { who: 'You', card: '2S' },
            { who: 'Salma', card: 'AH' },
          ],
          winner: 2,
          won: 'You win',
          note: 'Rahim led a heart. You had no hearts, so you had to play a spade. Even the smallest spade is trump, so your ♠2 beats the ♥A.',
        },
        {
          t: 'trick',
          title: 'Example 3: a spade over a spade',
          plays: [
            { who: 'Rahim', card: '4C' },
            { who: 'Karim', card: '6S' },
            { who: 'You', card: 'JS' },
            { who: 'Salma', card: 'KC' },
          ],
          winner: 2,
          won: 'You win',
          note: 'Karim cut first with the ♠6. You have no clubs and you hold a higher spade, the ♠J, so you had to play it. Nobody has a bigger spade, so the trick is yours.',
        },
      ],
    },
    {
      id: 'score',
      title: 'Scoring',
      blocks: [
        {
          t: 'list',
          items: [
            'Fewer tricks than your bid: minus. You lose as many points as your bid.',
            'From your bid up to just under double your bid: plus. You gain as many points as your bid. Extra tricks give no bonus.',
            'Double your bid or more: minus again!',
          ],
        },
        {
          t: 'table',
          head: ['Bid', 'Minus', 'Plus', 'Minus again'],
          rows: [
            ['2', '0–1 tricks', '2–3 tricks', '4+ tricks'],
            ['3', '0–2', '3–5', '6+'],
            ['4', '0–3', '4–7', '8+'],
            ['5', '0–4', '5–9', '10+'],
            ['6', '0–5', '6–11', '12+'],
            ['7', '0–6', '7–13', 'none'],
            ['8', '0–7', '8–13', 'none'],
          ],
        },
        { t: 'p', text: 'A bid of 7 or 8 cannot be doubled (there are only 13 tricks), so there you only lose by falling short.' },
        {
          t: 'example',
          title: 'One round, worked out',
          lines: ['Rahim: bid 3, won 4 tricks → +3', 'Karim: bid 4, won 3 tricks → −4 (fell short)', 'Salma: bid 3, won 6 tricks → −3 (doubled)', 'You: bid 2, won 2 tricks → +2'],
        },
        { t: 'tip', text: 'In round 1 there is no bid, so just win as many tricks as you can. Later, once your bid is safe, do not drift toward double: give tricks away where the rules let you.' },
      ],
    },
    {
      id: 'win',
      title: 'Who wins',
      blocks: [
        {
          t: 'list',
          items: [
            'Round scores keep adding up.',
            'The first player to reach the target score (set when the room is created, usually 49) while being alone on top wins.',
            'If several players are tied on top, the game goes on.',
            'There is a maximum number of rounds. When it is reached, the highest score wins.',
          ],
        },
      ],
    },
    {
      id: 'time',
      title: 'Time limits and auto-play',
      blocks: [
        {
          t: 'list',
          items: [
            'You get about 20 seconds to bid and about 30 seconds to play a card.',
            'When time runs out the server plays for you. After 2 timeouts in a row your seat goes on auto-play.',
            'If your connection drops, your seat is kept for 60 seconds. A bot plays for you in the meantime.',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: 'Tips for beginners',
      blocks: [
        {
          t: 'list',
          items: [
            'Lead with aces and kings; keep small cards for later.',
            'Remember who has run out of a suit. They may cut you with a spade.',
            'High spades (A, K, Q) are almost sure tricks. Do not waste spades on tiny cuts.',
            'Make your own bid first, then think about extra tricks.',
          ],
        },
      ],
    },
  ],
};

const enTwentyNine: Guide = {
  id: 'twentynine',
  name: '29 (Twenty-nine)',
  tagline: '4 players in 2 teams: score points together with your partner',
  quick: [
    '4 players, 2 teams. Your partner sits straight across from you.',
    '32 cards (7 to A). Order: J > 9 > A > 10 > K > Q > 8 > 7.',
    'Card points: J = 3, 9 = 2, A = 1, 10 = 1, the rest 0. That is 28 in total, plus 1 for the last trick makes 29.',
    'The player who bids highest (the bidder) secretly picks trump. Their team must collect the points they bid.',
  ],
  sections: [
    {
      id: 'cards',
      title: 'Teams, cards and points',
      blocks: [
        { t: 'p', text: 'The two players facing each other are a team. The player across the table from you is your partner.' },
        { t: 'cards', cards: ['JS', '9S', 'AS', '10S', 'KS', 'QS', '8S', '7S'], caption: 'Strength order, highest to lowest. It is the same in all 4 suits.' },
        {
          t: 'table',
          head: ['Card', 'Strength', 'Points'],
          rows: [
            ['J (jack)', '1st', '3'],
            ['9', '2nd', '2'],
            ['A', '3rd', '1'],
            ['10', '4th', '1'],
            ['K, Q, 8, 7', '5th to 8th', '0'],
          ],
        },
        { t: 'warn', text: 'The ace is not the highest here! The jack is the highest, then the 9. Keep this order in your head.' },
      ],
    },
    {
      id: 'flow',
      title: 'Steps of a round',
      blocks: [
        {
          t: 'steps',
          items: [
            'Deal: everyone first gets 4 cards.',
            'Bidding: starting after the dealer, go around bidding or passing. A bid is 16 to 28 and means "my team will collect this many points".',
            'Choosing trump: the bidder looks at those 4 cards and secretly picks one suit as trump. Nobody is told.',
            'The other 4 cards are dealt to everyone. Now everyone holds 8.',
            'Play: 8 tricks are played. The player after the dealer leads the first, then whoever wins a trick leads the next.',
            'At the end of the round the score is worked out.',
          ],
        },
      ],
    },
    {
      id: 'bid',
      title: 'Bidding rules',
      blocks: [
        {
          t: 'list',
          items: [
            'You must bid higher than the current bid, or pass.',
            'Once you pass, you cannot bid again in that round.',
            'A bid of 28 ends the bidding at once: that player is the bidder.',
            'If everyone passes, the last player must bid at least 16.',
          ],
        },
        {
          t: 'example',
          title: 'Example',
          lines: [
            'Opponent 1 bids 16. Partner passes. Opponent 2 bids 18.',
            'You bid 20. Everyone else passes.',
            'You are the bidder and your team must collect at least 20 points. Now it is your turn to choose trump.',
          ],
        },
        { t: 'tip', text: 'If your first 4 cards include a J or a 9, you can bid with more confidence. A J and a 9 in the same suit make a great trump.' },
      ],
    },
    {
      id: 'play',
      title: 'Playing tricks and asking for trump',
      blocks: [
        {
          t: 'steps',
          items: [
            'If you have the led suit you must follow it. You do not have to beat the card on the table: a small card is fine.',
            'If you have no card of the led suit, you may ask "Show trump". The trump suit is then shown to everyone.',
            'After trump is shown, if you cannot follow suit and you hold trump, you must play trump (a cut). With no trump either, play anything.',
            'Before trump is shown, if you cannot follow suit you may play any card. That card never counts as trump, even if it is of the trump suit.',
          ],
        },
        { t: 'p', text: 'The trick is won by the strongest card of the led suit. But if someone played trump after it was shown, the highest trump wins. The winning team collects the points of the cards in the trick.' },
        {
          t: 'trick',
          title: 'Example 1: an ordinary trick',
          plays: [
            { who: 'Opponent 1', card: '8H' },
            { who: 'Partner', card: 'KH' },
            { who: 'Opponent 2', card: '9H' },
            { who: 'You', card: 'JH' },
          ],
          winner: 3,
          won: 'You win',
          note: 'The order is J > 9 > K > 8, so the ♥J wins. The trick held a J (3) and a 9 (2): 5 points for your team.',
        },
        {
          t: 'trick',
          title: 'Example 2: showing trump and cutting',
          plays: [
            { who: 'Opponent 1', card: 'AD' },
            { who: 'Partner', card: '10D' },
            { who: 'Opponent 2', card: 'QD' },
            { who: 'You', card: '7S' },
          ],
          winner: 3,
          won: 'You win',
          note: 'You had no diamonds, so you asked "Show trump". It turned out to be spades. You had to play your ♠7, and even a small trump beats every ♦. The trick held an A (1) and a 10 (1): 2 points.',
        },
      ],
    },
    {
      id: 'pair',
      title: 'The pair (K + Q)',
      blocks: [
        { t: 'p', text: 'After trump has been shown, if a player plays the K or Q of trump while still holding the other one of that suit, a "pair" is declared automatically. Only the first pair of a round counts.' },
        {
          t: 'list',
          items: [
            'Pair for the bidder’s team: the points they need go down by 4.',
            'Pair for the opponents: the points the bidder’s team needs go up by 4.',
          ],
        },
        { t: 'example', title: 'Example', lines: ['The bid was 18.', 'A pair for the bidder’s team: they need 14 points.', 'A pair for the opponents: they need 22 points.'] },
      ],
    },
    {
      id: 'score',
      title: 'Scoring and winning',
      blocks: [
        {
          t: 'list',
          items: [
            'The points of each trick go to the team that won it.',
            'The team that wins the last (8th) trick gets 1 extra point.',
            'At the end of the round, if the bidder’s team has at least the points it needs, it gets +1 game point. If not, −1.',
            'The other team’s game points do not change that round.',
            'A team wins when its game points reach the target (2, 3, 5 or 7, chosen when the room is created). If a team drops to minus the target, it loses and the other team wins.',
          ],
        },
        {
          t: 'example',
          title: 'Example',
          lines: ['Your team bid 18.', 'It collected 20 points in the round (including the last trick) → +1 game point.', 'Had it collected only 15 → −1 game point.'],
        },
        { t: 'tip', text: 'Throw point cards (J, 9, A, 10) onto a trick your partner is winning, so the points stay with your team. Avoid giving point cards to a trick the opponents will win.' },
      ],
    },
    {
      id: 'tips',
      title: 'Tips for beginners',
      blocks: [
        {
          t: 'list',
          items: [
            'Before bidding, remember you only see 4 cards; the other 4 are still to come. High bids are risky.',
            'When choosing trump, pick the suit where you have the most cards, or the J and the 9.',
            'If the opponents hold the bid and you cannot follow suit, ask for trump, then play accordingly.',
            'Watch which suit your partner leads and help them win.',
          ],
        },
      ],
    },
  ],
};

const enPoker: Guide = {
  id: 'poker',
  name: 'Poker (Texas Hold’em)',
  tagline: '2 to 6 players with play-money chips. Win everyone’s chips and be the last one left',
  quick: [
    'Everyone gets 2 secret cards. 5 shared cards are turned up on the table in stages.',
    'Your hand is the best 5 of your 2 cards plus the 5 on the table, 7 cards in all.',
    'There is betting at every stage. At the end the best hand (or the last player left) wins the pot.',
    'Whoever ends up with all the chips wins the game.',
  ],
  sections: [
    {
      id: 'goal',
      title: 'Goal and chips',
      blocks: [
        {
          t: 'list',
          items: [
            'Everyone starts with the same number of chips (500, 1000, 2000 or 5000, chosen when the room is created). The chips are play money, not real money.',
            'A player who runs out of chips is out.',
            'The last player holding chips wins. If several are still in after 120 hands, the biggest stack wins.',
          ],
        },
      ],
    },
    {
      id: 'blinds',
      title: 'Dealer button and blinds',
      blocks: [
        {
          t: 'list',
          items: [
            'The dealer button moves one seat every hand.',
            'The player after the button is the small blind (SB), the next one is the big blind (BB). They put in forced bets before seeing their cards, so there are always some chips in the pot.',
            'With only 2 players, the button is the small blind.',
          ],
        },
        { t: 'example', title: 'Example', lines: ['With 1000 chips the blinds start at 10/20 (SB 10, BB 20).', 'Every 8 hands the blinds go up: 10/20 → 15/30 → 25/50 → 50/100 …'] },
        { t: 'tip', text: 'The blinds keep rising, so sitting quietly slowly drains your chips. When you get a good hand, bet boldly.' },
      ],
    },
    {
      id: 'flow',
      title: 'Steps of one hand',
      blocks: [
        {
          t: 'steps',
          items: [
            'Preflop: everyone gets 2 secret cards. Betting starts with the player after the big blind.',
            'Flop: 3 shared cards are turned up. Another round of betting.',
            'Turn: 1 more shared card. Betting.',
            'River: the last shared card. The final betting round.',
            'Showdown: everyone who has not folded shows their cards. The best hand wins the pot.',
          ],
        },
        { t: 'p', text: 'If everyone else folds at any point, the last player wins the pot without showing cards.' },
      ],
    },
    {
      id: 'actions',
      title: 'Your actions',
      blocks: [
        {
          t: 'table',
          head: ['Action', 'Meaning'],
          rows: [
            ['Fold', 'Give up the hand. You pay nothing more, but you lose any claim to the pot.'],
            ['Check', 'If nobody has bet, pass without paying.'],
            ['Call', 'Put in as many chips as the current bet.'],
            ['Raise / Bet', 'Increase the bet. As much as you like, up to all your chips. At least as big as the last raise ("Min" button).'],
            ['All-in', 'Put in all your chips. If you are short, a call becomes an all-in.'],
          ],
        },
        {
          t: 'list',
          items: [
            'An all-in player stays in until the showdown. They can only win as much of the pot as they put in; the extra bets go into a separate "side pot".',
            '"Raise to 60" means your total bet on this round is 60. Others must match 60 to stay in.',
            'You have about 25 seconds. When time runs out you check if you can, otherwise you fold.',
          ],
        },
      ],
    },
    {
      id: 'ranks',
      title: 'Hand ranking (best to worst)',
      blocks: [
        {
          t: 'ranks',
          rows: [
            { name: '1. Straight flush', desc: '5 cards in a row, all of one suit. 10 J Q K A of one suit is the royal flush, the best hand of all.', cards: ['5S', '6S', '7S', '8S', '9S'] },
            { name: '2. Four of a kind', desc: '4 cards of the same rank.', cards: ['KS', 'KH', 'KD', 'KC', '3S'] },
            { name: '3. Full house', desc: '3 cards of one rank plus 2 cards of another rank.', cards: ['9S', '9H', '9D', '4C', '4S'] },
            { name: '4. Flush', desc: 'All 5 cards of the same suit, in any order.', cards: ['AH', '9H', '7H', '4H', '2H'] },
            { name: '5. Straight', desc: '5 ranks in a row, any suits. A-2-3-4-5 counts (ace low); 10-J-Q-K-A is the highest.', cards: ['5C', '6D', '7H', '8S', '9C'] },
            { name: '6. Three of a kind', desc: '3 cards of the same rank.', cards: ['8S', '8H', '8D', 'KC', '3S'] },
            { name: '7. Two pair', desc: 'Two different pairs.', cards: ['JS', 'JH', '4D', '4C', '9S'] },
            { name: '8. Pair', desc: 'Two cards of the same rank.', cards: ['10S', '10H', 'AD', '6C', '3S'] },
            { name: '9. High card', desc: 'If nothing matches, your highest card counts.', cards: ['AS', 'JD', '8C', '5H', '2S'] },
          ],
        },
        { t: 'p', text: 'With the same kind of hand, the higher cards win. If they are exactly equal, the pot is split.' },
      ],
    },
    {
      id: 'example',
      title: 'A whole hand, worked out',
      blocks: [
        { t: 'cards', cards: ['AS', 'KS'], caption: 'Your 2 secret cards' },
        { t: 'cards', cards: ['QS', 'JS', '3D', '9S', '2H'], caption: 'The 5 shared cards (flop: Q J 3, turn: 9, river: 2)' },
        {
          t: 'example',
          title: 'Who wins',
          lines: [
            'Your ♠A ♠K plus the ♠Q ♠J ♠9 on the table make 5 spades: a flush.',
            'Your opponent holds ♦10 and ♣8. With the Q J 9 on the table that is 8-9-10-J-Q, a straight.',
            'A flush beats a straight, so you win the pot.',
          ],
        },
      ],
    },
    {
      id: 'tips',
      title: 'Tips for beginners',
      blocks: [
        {
          t: 'list',
          items: [
            'Start with strong hands: big pairs (AA, KK, QQ), A-K, A-Q, and suited cards that are next to each other.',
            'Do not be afraid to fold weak cards. It saves chips.',
            'Sitting close to the button means you act later and see what others do first. That is an advantage.',
            'Think before going all-in: if you lose, you are out.',
          ],
        },
      ],
    },
  ],
};

export const GUIDES: Record<Lang, Guide[]> = {
  bn: [bnCallbreak, bnTwentyNine, bnPoker],
  en: [enCallbreak, enTwentyNine, enPoker],
};

/** Strings of the guide page itself. */
export const GUIDE_UI: Record<Lang, { quick: string; openAll: string; closeAll: string; wins: string; example: string }> = {
  bn: { quick: '১ মিনিটে সারকথা', openAll: 'সব খোলো', closeAll: 'সব বন্ধ', wins: 'জেতে', example: 'উদাহরণ' },
  en: { quick: 'The game in one minute', openAll: 'Open all', closeAll: 'Close all', wins: 'wins', example: 'Example' },
};
