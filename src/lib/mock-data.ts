import meme1 from "@/assets/meme-1.jpg";
import meme2 from "@/assets/meme-2.jpg";
import meme3 from "@/assets/meme-3.jpg";
import meme4 from "@/assets/meme-4.jpg";

export type Meme = {
  id: string;
  creator: string;
  wallet: string;
  verified: boolean;
  avatar: string;
  ago: string;
  image: string;
  caption: string;
  tags: string[];
  likes: number;
  comments: number;
  tips: number;
  remixes: number;
  remixable: boolean;
  parentId?: string;
};

const av = (seed: string) =>
  `https://api.dicebear.com/7.x/thumbs/svg?seed=${seed}&backgroundColor=a1ff3d,b794f6,fb7185,facc15`;

export const memes: Meme[] = [
  {
    id: "m1",
    creator: "@cryptojay",
    wallet: "0x4a3f...9c12",
    verified: true,
    avatar: av("cryptojay"),
    ago: "2h",
    image: meme1,
    caption: "real talk 🐸",
    tags: ["#celo", "#memes", "#defi"],
    likes: 1247,
    comments: 120,
    tips: 0.5,
    remixes: 34,
    remixable: true,
  },
  {
    id: "m2",
    creator: "@meme.lord",
    wallet: "0x8b21...44ee",
    verified: true,
    avatar: av("memelord"),
    ago: "5h",
    image: meme2,
    caption: "diamond paws only 💎",
    tags: ["#hodl", "#celo"],
    likes: 892,
    comments: 67,
    tips: 1.2,
    remixes: 21,
    remixable: true,
  },
  {
    id: "m3",
    creator: "@defi.chic",
    wallet: "0x12cd...77a0",
    verified: false,
    avatar: av("defichic"),
    ago: "8h",
    image: meme3,
    caption: "every. single. day.",
    tags: ["#gas", "#mood"],
    likes: 2103,
    comments: 244,
    tips: 2.1,
    remixes: 88,
    remixable: true,
  },
  {
    id: "m4",
    creator: "@queen.chain",
    wallet: "0xff09...3311",
    verified: false,
    avatar: av("queenchain"),
    ago: "12h",
    image: meme4,
    caption: "send help (or cUSD)",
    tags: ["#crypto", "#chaos"],
    likes: 540,
    comments: 41,
    tips: 0.3,
    remixes: 12,
    remixable: true,
  },
];

export const topCreators = [
  { name: "@meme.lord", avatar: av("memelord"), tips: "2.5K", verified: true },
  { name: "@cryptojay", avatar: av("cryptojay"), tips: "1.8K", verified: true },
  { name: "@defi.chic", avatar: av("defichic"), tips: "1.2K", verified: false },
  { name: "@queen.chain", avatar: av("queenchain"), tips: "980", verified: false },
];

export const reactions = [
  { emoji: "😂", label: "cooked" },
  { emoji: "🔥", label: "legendary" },
  { emoji: "💀", label: "dead" },
  { emoji: "🧠", label: "smart" },
  { emoji: "🐐", label: "goat" },
];

export const me = {
  wallet: "0x9f4a...12cd",
  username: "@you",
  avatar: av("you"),
  balance: 125,
  aiUsesLeft: 2,
  subscribed: false,
  purpleTick: false,
};
