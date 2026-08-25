export const revenueTrend = [
  { month: "Jan", revenue: 142000, subs: 18200 },
  { month: "Feb", revenue: 158000, subs: 19800 },
  { month: "Mar", revenue: 171000, subs: 21500 },
  { month: "Apr", revenue: 165000, subs: 22100 },
  { month: "May", revenue: 192000, subs: 24800 },
  { month: "Jun", revenue: 215000, subs: 27200 },
  { month: "Jul", revenue: 248000, subs: 30100 },
  { month: "Aug", revenue: 272000, subs: 33400 },
  { month: "Sep", revenue: 295000, subs: 36000 },
  { month: "Oct", revenue: 318000, subs: 38800 },
  { month: "Nov", revenue: 342000, subs: 41200 },
  { month: "Dec", revenue: 378000, subs: 44600 },
];

export const watchHours = [
  { day: "Mon", hours: 12400 },
  { day: "Tue", hours: 11800 },
  { day: "Wed", hours: 13200 },
  { day: "Thu", hours: 14100 },
  { day: "Fri", hours: 18900 },
  { day: "Sat", hours: 22400 },
  { day: "Sun", hours: 21200 },
];

export const deviceMix = [
  { name: "Mobile", value: 48 },
  { name: "Smart TV", value: 27 },
  { name: "Web", value: 16 },
  { name: "Tablet", value: 9 },
];

export const topContent = [
  { title: "Neon Shadows", type: "Movie", views: 1240320, hours: 89200, rating: 4.7 },
  { title: "Crown of Embers", type: "Series", views: 982140, hours: 142800, rating: 4.6 },
  { title: "Midnight Caravan", type: "Movie", views: 812900, hours: 61200, rating: 4.4 },
  { title: "Quantum Reverie", type: "Series", views: 742110, hours: 118400, rating: 4.5 },
  { title: "The Last Monsoon", type: "Movie", views: 612400, hours: 48200, rating: 4.3 },
  { title: "Echoes of Aria", type: "Series", views: 548300, hours: 96100, rating: 4.2 },
];

export const activities = [
  { id: 1, actor: "Aanya Sharma", action: "published movie", target: "Neon Shadows", time: "2m ago" },
  { id: 2, actor: "System", action: "encoded episode", target: "S2E04 — Crown of Embers", time: "8m ago" },
  { id: 3, actor: "Ravi Menon", action: "approved coupon", target: "SUMMER25", time: "23m ago" },
  { id: 4, actor: "System", action: "flagged review", target: "User #44219", time: "41m ago" },
  { id: 5, actor: "Priya Iyer", action: "updated banner", target: "Homepage Hero #2", time: "1h ago" },
  { id: 6, actor: "System", action: "retried payment", target: "INV-22841", time: "2h ago" },
];

const GENRES = ["Action", "Drama", "Sci-Fi", "Thriller", "Romance", "Comedy", "Documentary", "Horror"];
const LANGS = ["English", "Hindi", "Tamil", "Telugu", "Spanish", "Korean"];
const STATUSES = ["Published", "Draft", "Scheduled", "Archived"] as const;
const RATINGS = ["U", "U/A 7+", "U/A 13+", "U/A 16+", "A"];

export type MovieStatus = (typeof STATUSES)[number];
export interface Movie {
  id: string;
  title: string;
  genre: string;
  language: string;
  duration: number;
  releaseDate: string;
  rating: string;
  status: MovieStatus;
  views: number;
  thumb: string;
}

const TITLES = [
  "Neon Shadows", "Crown of Embers", "Midnight Caravan", "Quantum Reverie",
  "The Last Monsoon", "Echoes of Aria", "Glass Horizon", "Velvet Static",
  "Iron Lotus", "Paper Moons", "Saffron City", "Northern Drift",
  "Cipher of Souls", "The Tidal Court", "Marble Sky", "Hollow Crown",
  "Solar Heist", "Crimson Atlas", "Wires & Wonder", "Silent Cartograph",
];

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export const MOVIES: Movie[] = TITLES.map((t, i) => {
  const h = hash(t);
  return {
    id: `mov_${1000 + i}`,
    title: t,
    genre: GENRES[h % GENRES.length],
    language: LANGS[(h >> 3) % LANGS.length],
    duration: 80 + (h % 80),
    releaseDate: `2024-${String(((h % 12) + 1)).padStart(2, "0")}-${String(((h % 27) + 1)).padStart(2, "0")}`,
    rating: RATINGS[(h >> 5) % RATINGS.length],
    status: STATUSES[(h >> 7) % STATUSES.length],
    views: 50000 + ((h * 137) % 1500000),
    thumb: `https://picsum.photos/seed/${encodeURIComponent(t)}/200/120`,
  };
});

const FIRST = ["Aanya", "Rohan", "Priya", "Vikram", "Sara", "Arjun", "Meera", "Kabir", "Nisha", "Dev", "Ishita", "Aarav", "Tara", "Rahul", "Zara"];
const LAST = ["Sharma", "Menon", "Iyer", "Kapoor", "Khan", "Patel", "Reddy", "Bose", "Singh", "Verma"];
const PLANS = ["Basic", "Standard", "Premium", "Free Trial"] as const;
const COUNTRIES = ["IN", "US", "GB", "AE", "SG", "DE", "CA", "AU"];

export interface User {
  id: string;
  name: string;
  email: string;
  plan: (typeof PLANS)[number];
  country: string;
  devices: number;
  joined: string;
  status: "Active" | "Suspended" | "Banned";
  hours: number;
}

export const USERS: User[] = Array.from({ length: 28 }).map((_, i) => {
  const f = FIRST[i % FIRST.length];
  const l = LAST[(i * 3) % LAST.length];
  const h = hash(f + l + i);
  return {
    id: `usr_${20000 + i}`,
    name: `${f} ${l}`,
    email: `${f.toLowerCase()}.${l.toLowerCase()}@mail.com`,
    plan: PLANS[h % PLANS.length],
    country: COUNTRIES[h % COUNTRIES.length],
    devices: 1 + (h % 5),
    joined: `2024-${String(((h % 12) + 1)).padStart(2, "0")}-${String(((h % 27) + 1)).padStart(2, "0")}`,
    status: (["Active", "Active", "Active", "Suspended", "Banned"] as const)[h % 5],
    hours: 10 + (h % 480),
  };
});

export const TICKETS = [
  { id: "T-1042", subject: "Payment failed but card debited", user: "Aanya Sharma", priority: "High", status: "Open", updated: "5m ago" },
  { id: "T-1041", subject: "Cannot play in 4K on Smart TV", user: "Rohan Menon", priority: "Medium", status: "Pending", updated: "32m ago" },
  { id: "T-1040", subject: "Subtitles out of sync", user: "Priya Iyer", priority: "Low", status: "Open", updated: "1h ago" },
  { id: "T-1039", subject: "Account locked after travel", user: "Vikram Kapoor", priority: "High", status: "Resolved", updated: "3h ago" },
  { id: "T-1038", subject: "Refund request for duplicate charge", user: "Sara Khan", priority: "Medium", status: "Open", updated: "6h ago" },
];

export const COUPONS = [
  { code: "SUMMER25", discount: "25%", type: "Percentage", uses: 2840, cap: 5000, expires: "2026-08-31", status: "Active" },
  { code: "NEWUSER", discount: "₹199", type: "Flat", uses: 12410, cap: 50000, expires: "2026-12-31", status: "Active" },
  { code: "FAMILY10", discount: "10%", type: "Percentage", uses: 612, cap: 2000, expires: "2026-07-15", status: "Active" },
  { code: "RETURN50", discount: "50%", type: "Percentage", uses: 320, cap: 500, expires: "2026-06-30", status: "Paused" },
];

export const DEVICES = [
  { id: "d1", user: "Aanya Sharma", type: "Smart TV", model: "Samsung QN90B", lastActive: "2m ago", location: "Mumbai, IN" },
  { id: "d2", user: "Aanya Sharma", type: "Mobile", model: "iPhone 15", lastActive: "1h ago", location: "Mumbai, IN" },
  { id: "d3", user: "Rohan Menon", type: "Web", model: "Chrome / macOS", lastActive: "5m ago", location: "Bengaluru, IN" },
  { id: "d4", user: "Priya Iyer", type: "Tablet", model: "iPad Air", lastActive: "3h ago", location: "Chennai, IN" },
  { id: "d5", user: "Vikram Kapoor", type: "Smart TV", model: "LG OLED C3", lastActive: "12h ago", location: "Delhi, IN" },
];

export const AUDIT_LOGS = Array.from({ length: 14 }).map((_, i) => ({
  id: `log_${9000 + i}`,
  actor: ["Aanya Sharma", "Ravi Menon", "Priya Iyer", "System"][i % 4],
  action: ["updated.movie", "deleted.coupon", "suspended.user", "published.banner", "rotated.api_key"][i % 5],
  target: ["Neon Shadows", "SUMMER25", "usr_20013", "Hero #2", "settings"][i % 5],
  ip: `10.0.${i}.${(i * 13) % 255}`,
  time: `${i + 1}m ago`,
}));