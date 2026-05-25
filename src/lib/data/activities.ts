import type { MontessoriArea } from "./demo";

export interface AgedActivity {
  id: string;
  title: string;
  area: MontessoriArea;
  description: string;
  duration: string;
  materials: string[];
  guidanceSource?: string;
  minAgeMonths: number;
  maxAgeMonths: number;
}

export const activityBank: AgedActivity[] = [
  // ── Language ─────────────────────────────────────────────────────────────────
  {
    id: "lang-1",
    title: "Object naming walk",
    area: "language",
    description: "Point to 10 things on your walk and pause. Let them observe and touch when safe — narrate everything slowly.",
    duration: "15–20 min",
    materials: [],
    guidanceSource: "CDC 12–18 month milestones",
    minAgeMonths: 9,
    maxAgeMonths: 24,
  },
  {
    id: "lang-2",
    title: "Picture book back-and-forth",
    area: "language",
    description: "Point to a picture, say the word, then wait. When they point back or babble, respond like it was a real sentence.",
    duration: "10–15 min",
    materials: ["simple picture book"],
    guidanceSource: "AAP reading guidance",
    minAgeMonths: 6,
    maxAgeMonths: 30,
  },
  {
    id: "lang-3",
    title: "Name that sound",
    area: "language",
    description: "Make animal sounds and pause for imitation. Start with easy ones — moo, baa, woof — and add new ones each session.",
    duration: "10 min",
    materials: [],
    minAgeMonths: 10,
    maxAgeMonths: 30,
  },
  {
    id: "lang-4",
    title: "Narrated daily routine",
    area: "language",
    description: "Talk through everything you do together — 'Now we wash hands, warm water, soap, rub rub rub.' Rich vocabulary comes from repetition.",
    duration: "All day",
    materials: [],
    guidanceSource: "CDC language development",
    minAgeMonths: 4,
    maxAgeMonths: 36,
  },
  {
    id: "lang-5",
    title: "Simple two-word instruction game",
    area: "language",
    description: "Give simple two-word instructions: 'get ball', 'find shoe'. Celebrate every attempt — the comprehension is ahead of the speech.",
    duration: "10–15 min",
    materials: [],
    guidanceSource: "CDC 18–24 month milestones",
    minAgeMonths: 15,
    maxAgeMonths: 36,
  },
  {
    id: "lang-6",
    title: "Storytelling with props",
    area: "language",
    description: "Use 3–4 small objects to tell a simple story together. Let them rearrange and retell in their own way.",
    duration: "15–20 min",
    materials: ["3–4 small familiar objects"],
    minAgeMonths: 30,
    maxAgeMonths: 72,
  },
  {
    id: "lang-7",
    title: "Rhyme and song time",
    area: "language",
    description: "Sing a favourite rhyme slowly — pause before the last word of each line and wait for them to fill it in.",
    duration: "10–15 min",
    materials: [],
    guidanceSource: "AAP early literacy guidance",
    minAgeMonths: 18,
    maxAgeMonths: 60,
  },

  // ── Sensory ──────────────────────────────────────────────────────────────────
  {
    id: "sens-1",
    title: "Sorting by color",
    area: "sensory",
    description: "3 bowls, 3 colors of blocks or balls. Demonstrate once then step back and let them explore.",
    duration: "15–20 min",
    materials: ["3 small bowls", "colored blocks or balls"],
    guidanceSource: "CDC 18–24 month milestones",
    minAgeMonths: 18,
    maxAgeMonths: 48,
  },
  {
    id: "sens-2",
    title: "Texture exploration bin",
    area: "sensory",
    description: "Fill a bin with rice, pasta, or sand. Bury a few small objects for finding. Provide cups and spoons for scooping.",
    duration: "20–30 min",
    materials: ["large bin", "rice or dry pasta", "small cups"],
    minAgeMonths: 12,
    maxAgeMonths: 48,
  },
  {
    id: "sens-3",
    title: "Paint with water on pavement",
    area: "sensory",
    description: "Give a thick paintbrush and a bucket of water. Let them paint the sidewalk, watch it dry, and repeat. No mess, full engagement.",
    duration: "20–30 min",
    materials: ["paintbrush", "small bucket of water"],
    minAgeMonths: 18,
    maxAgeMonths: 60,
  },
  {
    id: "sens-4",
    title: "Scented playdough",
    area: "sensory",
    description: "Homemade playdough with a drop of vanilla or lavender. Poke, roll, flatten — name what you're doing together.",
    duration: "20–30 min",
    materials: ["playdough (scented)"],
    minAgeMonths: 20,
    maxAgeMonths: 60,
  },
  {
    id: "sens-5",
    title: "Exploring temperature",
    area: "sensory",
    description: "Fill two bowls — one warm, one cool. Let them feel the difference with their hands. Name hot, warm, cool, cold.",
    duration: "10–15 min",
    materials: ["2 bowls", "warm and cool water"],
    guidanceSource: "Montessori sensorial curriculum",
    minAgeMonths: 12,
    maxAgeMonths: 36,
  },
  {
    id: "sens-6",
    title: "Nature treasure hunt",
    area: "sensory",
    description: "Go outside and find one leaf, one stone, one stick, one flower. Bring them home and lay them out to examine.",
    duration: "20–30 min",
    materials: ["small bag or basket"],
    minAgeMonths: 18,
    maxAgeMonths: 72,
  },

  // ── Movement ─────────────────────────────────────────────────────────────────
  {
    id: "move-1",
    title: "Rolling ball back and forth",
    area: "movement",
    description: "Sit facing each other and roll a ball back and forth. It's simple and builds coordination and turn-taking at the same time.",
    duration: "10–15 min",
    materials: ["soft ball"],
    guidanceSource: "CDC 12–15 month milestones",
    minAgeMonths: 10,
    maxAgeMonths: 30,
  },
  {
    id: "move-2",
    title: "Obstacle course crawl",
    area: "movement",
    description: "Arrange pillows, a tunnel, and low steps. Crawl through together. Narrate each move — under, over, through.",
    duration: "20–25 min",
    materials: ["pillows", "couch cushions", "tunnel (optional)"],
    minAgeMonths: 8,
    maxAgeMonths: 36,
  },
  {
    id: "move-3",
    title: "Dance and freeze",
    area: "movement",
    description: "Play music and dance together. Stop the music — everyone freezes. Giggle, then go again. Builds body control and attention.",
    duration: "10–15 min",
    materials: ["music"],
    minAgeMonths: 18,
    maxAgeMonths: 72,
  },
  {
    id: "move-4",
    title: "Stair practice",
    area: "movement",
    description: "Support them going up and down 3–4 steps. Go slowly — let them feel the weight shift with each step.",
    duration: "10 min",
    materials: [],
    guidanceSource: "CDC gross motor milestones",
    minAgeMonths: 13,
    maxAgeMonths: 24,
  },
  {
    id: "move-5",
    title: "Balloon keep-up",
    area: "movement",
    description: "Blow up a balloon and keep it off the ground — hands, feet, heads. The slowness of balloons makes this ideal for all skill levels.",
    duration: "15–20 min",
    materials: ["balloon"],
    minAgeMonths: 30,
    maxAgeMonths: 84,
  },
  {
    id: "move-6",
    title: "Jumping on a cushion",
    area: "movement",
    description: "Place a thick floor cushion and let them jump on, off, and around it. Count jumps together. Great for core strength.",
    duration: "15 min",
    materials: ["large floor cushion"],
    minAgeMonths: 22,
    maxAgeMonths: 48,
  },
  {
    id: "move-7",
    title: "Carry the basket",
    area: "movement",
    description: "Fill a small basket with light items and ask them to carry it from room to room. Builds purpose, control, and pride.",
    duration: "10 min",
    materials: ["small basket", "light items"],
    guidanceSource: "Montessori practical life",
    minAgeMonths: 18,
    maxAgeMonths: 48,
  },

  // ── Practical Life ───────────────────────────────────────────────────────────
  {
    id: "prac-1",
    title: "Pouring water station",
    area: "practical-life",
    description: "Two small containers at the water table or sink. Support self-directed pouring — resist correcting the spills.",
    duration: "20–30 min",
    materials: ["2 containers", "small cup", "towel nearby"],
    guidanceSource: "AAP early childhood guidance",
    minAgeMonths: 14,
    maxAgeMonths: 48,
  },
  {
    id: "prac-2",
    title: "Fruit washing",
    area: "practical-life",
    description: "Fill a bowl with water and let them wash apples or grapes. Real tools, real purpose — it matters to them more than you expect.",
    duration: "15 min",
    materials: ["bowl", "water", "fruit"],
    guidanceSource: "Montessori practical life",
    minAgeMonths: 18,
    maxAgeMonths: 60,
  },
  {
    id: "prac-3",
    title: "Folding cloths",
    area: "practical-life",
    description: "Give them a small cloth or washcloth. Demonstrate folding in half once. Let them try. Celebrate any fold.",
    duration: "10 min",
    materials: ["small cloths"],
    guidanceSource: "Montessori practical life",
    minAgeMonths: 24,
    maxAgeMonths: 72,
  },
  {
    id: "prac-4",
    title: "Sweeping with a small broom",
    area: "practical-life",
    description: "Give a child-size broom and a dustpan. Sweep a little pile together. The act of cleaning builds independence and agency.",
    duration: "10–15 min",
    materials: ["child-size broom", "dustpan"],
    guidanceSource: "Montessori practical life",
    minAgeMonths: 24,
    maxAgeMonths: 72,
  },
  {
    id: "prac-5",
    title: "Watering plants",
    area: "practical-life",
    description: "Fill a small watering can together. Water the plants slowly. Talk about how plants grow and why they need water.",
    duration: "10 min",
    materials: ["small watering can"],
    minAgeMonths: 20,
    maxAgeMonths: 84,
  },
  {
    id: "prac-6",
    title: "Sorting socks",
    area: "practical-life",
    description: "Dump a pile of paired socks and let them match. Start with 3 clearly different pairs. Celebrate matches warmly.",
    duration: "10–15 min",
    materials: ["6 socks (3 pairs, clearly different)"],
    minAgeMonths: 24,
    maxAgeMonths: 60,
  },

  // ── Creativity ───────────────────────────────────────────────────────────────
  {
    id: "crea-1",
    title: "Open-ended mark making",
    area: "creativity",
    description: "Large paper, thick crayons or washable markers. No direction — just let them mark. Comment on colors and shapes they make, not what it 'is'.",
    duration: "15–20 min",
    materials: ["large paper", "thick crayons or markers"],
    minAgeMonths: 16,
    maxAgeMonths: 72,
  },
  {
    id: "crea-2",
    title: "Collage from nature finds",
    area: "creativity",
    description: "Use leaves, petals, and twigs gathered outside. Glue stick and paper. Arrange freely — there's no wrong composition.",
    duration: "20–25 min",
    materials: ["paper", "glue stick", "nature finds"],
    minAgeMonths: 24,
    maxAgeMonths: 84,
  },
  {
    id: "crea-3",
    title: "Block tower freestyle",
    area: "creativity",
    description: "Just blocks, no goal. Let them build whatever shape comes to mind. Resist suggesting what to make. Ask 'what are you building?' only after.",
    duration: "20–30 min",
    materials: ["building blocks"],
    minAgeMonths: 12,
    maxAgeMonths: 60,
  },
  {
    id: "crea-4",
    title: "Puppet play",
    area: "creativity",
    description: "Two simple sock puppets — you take one, they take one. Have a conversation. Let the puppet say silly things and wait for their reaction.",
    duration: "15–20 min",
    materials: ["2 sock puppets or stuffed animals"],
    minAgeMonths: 18,
    maxAgeMonths: 60,
  },
  {
    id: "crea-5",
    title: "Torn paper mosaic",
    area: "creativity",
    description: "Tear colourful magazine pages or construction paper. Glue pieces onto a large sheet. Great for fine motor and visual composition.",
    duration: "20 min",
    materials: ["colourful paper", "glue stick", "large paper"],
    minAgeMonths: 24,
    maxAgeMonths: 72,
  },
  {
    id: "crea-6",
    title: "Drum and shake band",
    area: "creativity",
    description: "Pots, wooden spoons, and a container of dried pasta for shaking. Make a rhythm together — match their beat, then lead one for them to follow.",
    duration: "15 min",
    materials: ["pots", "wooden spoon", "dried pasta in container"],
    minAgeMonths: 12,
    maxAgeMonths: 48,
  },
];

function ageToMonths(birthDate?: string | null): number {
  if (!birthDate) return 18;
  const birth = new Date(birthDate);
  const now = new Date();
  return (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
}

function seededShuffle<T>(arr: T[], seed: number): T[] {
  const result = [...arr];
  let s = seed;
  for (let i = result.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = Math.abs(s) % (i + 1);
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function dailySeed(childId?: string | null): number {
  const str = new Date().toDateString() + (childId ?? "demo");
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export function getDailyActivities(
  birthDate?: string | null,
  childId?: string | null,
  count = 10
): AgedActivity[] {
  const ageMonths = ageToMonths(birthDate);
  const eligible = activityBank.filter(
    (a) => a.minAgeMonths <= ageMonths && a.maxAgeMonths >= ageMonths
  );
  const pool = eligible.length > 0 ? eligible : activityBank;
  const shuffled = seededShuffle(pool, dailySeed(childId));
  return shuffled.slice(0, count);
}
