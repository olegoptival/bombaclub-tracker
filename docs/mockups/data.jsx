// data.jsx — realistic poker club fixture data
// 10 close friends, mixed nicknames; amounts in chips with two-decimals.

const CLUB = {
  name: "Late Night Felt",
  shortName: "LNF",
  memberCount: 11,
};

const ME = {
  id: "u1",
  name: "Yakir",
  nick: "Yakirsneh",
  clubGG: "yakir_lnf",
  isHost: true,
  balance: -138.59, // current period
};

const MEMBERS = [
  { id: "u1", name: "Yakir",     nick: "Yakirsneh",   clubGG: "yakir_lnf",   role: "host",   balance:  -138.59, sessions: 24, joined: "Mar 2024" },
  { id: "u2", name: "Don",       nick: "Don ron99",   clubGG: "donron99",    role: "player", balance:  +482.50, sessions: 22, joined: "Mar 2024" },
  { id: "u3", name: "Idan",      nick: "Idanbu3224",  clubGG: "idanbu_3224", role: "player", balance: -1170.25, sessions: 21, joined: "Mar 2024" },
  { id: "u4", name: "Roi",       nick: "Roi K.",      clubGG: "roik",        role: "player", balance:  +734.10, sessions: 19, joined: "Apr 2024" },
  { id: "u5", name: "Maor",      nick: "Maor82",      clubGG: "maor82",      role: "player", balance:   -64.20, sessions: 18, joined: "Apr 2024" },
  { id: "u6", name: "Tomer",     nick: "TomTom",      clubGG: "tomtom_pkr",  role: "player", balance:  +228.00, sessions: 17, joined: "May 2024" },
  { id: "u7", name: "Shahar",    nick: "Shaks",       clubGG: "shaks_lnf",   role: "player", balance:  -312.75, sessions: 15, joined: "Jun 2024" },
  { id: "u8", name: "Ariel",     nick: "Ari",         clubGG: "arielx",      role: "player", balance:   +78.30, sessions: 13, joined: "Jul 2024" },
  { id: "u9", name: "Ofir",      nick: "OfirBets",    clubGG: "ofir_b",      role: "player", balance:   -42.40, sessions: 12, joined: "Aug 2024" },
  { id: "u10",name: "Nadav",     nick: "Nadavski",    clubGG: "nadavski",    role: "player", balance:  +205.60, sessions: 11, joined: "Sep 2024" },
  { id: "u11",name: "Eitan",     nick: "Eitan_p",     clubGG: "eitan_p",     role: "player", balance:    +0.00, sessions:  4, joined: "Feb 2025" },
];

const memberById = (id) => MEMBERS.find(m => m.id === id);

// Sessions — newest first.
const SESSIONS = [
  {
    id: "s24",
    title: "Bomba NLH",
    type: "online",
    date: "May 2",
    dateLong: "Fri, May 2 · 22:14",
    status: "ended",
    game: "NLH 6-max",
    blinds: "1/2",
    buyin: "100–400",
    players: 6,
    myPnL: +138.59,
    pot: 2480,
    note: "Yesterday at Bomba",
  },
  {
    id: "s23",
    title: "Live @ Don's",
    type: "offline",
    date: "Apr 30",
    dateLong: "Wed, Apr 30 · 19:30",
    status: "ended",
    game: "PLO 6-max",
    blinds: "1/2",
    buyin: "200 set",
    players: 7,
    myPnL: -84.00,
    pot: 1900,
  },
  {
    id: "s22",
    title: "Tuesday grind",
    type: "online",
    date: "Apr 29",
    dateLong: "Tue, Apr 29 · 21:02",
    status: "ended",
    game: "NLH 9-max",
    blinds: "0.5/1",
    buyin: "50–200",
    players: 8,
    myPnL: +42.10,
    pot: 1340,
  },
  {
    id: "s21",
    title: "Late session",
    type: "online",
    date: "Apr 27",
    dateLong: "Sun, Apr 27 · 23:48",
    status: "disputed",
    game: "NLH 6-max",
    blinds: "1/2",
    buyin: "100–400",
    players: 5,
    myPnL: -267.40,
    pot: 1840,
  },
  {
    id: "s20",
    title: "Live @ Idan's",
    type: "offline",
    date: "Apr 25",
    dateLong: "Fri, Apr 25 · 20:00",
    status: "ended",
    game: "NLH 8-max",
    blinds: "1/2",
    buyin: "200 set",
    players: 8,
    myPnL: +96.00,
    pot: 2200,
  },
  {
    id: "s19", title: "Bomba NLH", type: "online", date: "Apr 23",
    status: "ended", players: 6, myPnL: -188.50, pot: 1620,
  },
  {
    id: "s18", title: "Tuesday grind", type: "online", date: "Apr 22",
    status: "ended", players: 7, myPnL: +12.40, pot: 1450,
  },
  {
    id: "s17", title: "Live @ Roi's", type: "offline", date: "Apr 18",
    status: "ended", players: 6, myPnL: -52.00, pot: 1200,
  },
  {
    id: "s16", title: "Bomba NLH", type: "online", date: "Apr 16",
    status: "ended", players: 6, myPnL: +204.30, pot: 2100,
  },
  {
    id: "s15", title: "Late session", type: "online", date: "Apr 14",
    status: "ended", players: 5, myPnL: -38.70, pot: 1310,
  },
];

// Last 10 sessions sparkline data — cumulative P&L for the dashboard chart.
// Most recent on the right.
const SPARK = (() => {
  const recent = [...SESSIONS].slice(0, 10).reverse();
  let cum = -278; // starting cumulative balance going into this window
  return recent.map((s, i) => {
    cum += s.myPnL || 0;
    return { i, label: s.date, value: Number(cum.toFixed(2)), pnl: s.myPnL };
  });
})();

// Recent activity feed
const ACTIVITY = [
  { id: "a1", actor: "Don ron99",   verb: "won",   amount:  +230, where: "Online NLH bomba", when: "yesterday" },
  { id: "a2", actor: "Idanbu3224",  verb: "lost",  amount:  -412, where: "Live @ Don's",      when: "2 days ago" },
  { id: "a3", actor: "Roi K.",      verb: "won",   amount:  +318, where: "Tuesday grind",    when: "3 days ago" },
  { id: "a4", actor: "Yakirsneh",   verb: "joined", amount: null, where: "Late session",     when: "5 days ago" },
];

// OCR — wizard step 2 fixture
const OCR_SHOTS = [
  {
    id: "o1",
    file: "table-1-bomba.jpg",
    table: "Bomba #4187",
    parsed: true,
    error: null,
    confidence: "high",
    dupTable: true, round: 1,
    matched: 6, total: 6,
    sumOk: true,
    rows: [
      { name: "Yakirsneh",   id: "1138292", pnl: +138.59, matched: "u1" },
      { name: "Don ron99",   id: "9302841", pnl: +412.20, matched: "u2" },
      { name: "Idanbu3224",  id: "4421119", pnl: -284.50, matched: "u3" },
      { name: "Roi K.",      id: "2210984", pnl:  -88.00, matched: "u4" },
      { name: "TomTom",      id: "8841220", pnl:  +66.71, matched: "u6" },
      { name: "Shaks",       id: "3098441", pnl: -245.00, matched: "u7" },
    ],
  },
  {
    id: "o2",
    file: "table-2-bomba.jpg",
    table: "Bomba #4187",
    parsed: true,
    error: null,
    confidence: "med",
    dupTable: true, round: 2,
    matched: 4, total: 5,
    sumOk: true,
    rows: [
      { name: "Yakirsneh",   id: "1138292", pnl:   +0.00,  matched: "u1" },
      { name: "Don ron99",   id: "9302841", pnl: +180.00,  matched: "u2" },
      { name: "OfirBets",    id: "5512908", pnl:  -42.40,  matched: "u9" },
      { name: "Nadavski",    id: "7720104", pnl: +112.20,  matched: "u10" },
      { name: "ApexHero22",  id: "9988123", pnl: -249.80,  matched: null }, // unmatched
    ],
  },
  {
    id: "o3",
    file: "table-3-bomba.jpg",
    table: null,
    parsed: false,
    error: null,
    progress: 0.62,
    statusText: "matching players… 4/6",
    matched: 4, total: 6,
  },
];

// Settle-up transfers (period: this month)
const TRANSFERS = [
  { from: "u3", to: "u4", amount: 612.10 },
  { from: "u3", to: "u2", amount: 320.40 },
  { from: "u7", to: "u4", amount: 122.00 },
  { from: "u1", to: "u6", amount: 138.59 },
];

Object.assign(window, {
  CLUB, ME, MEMBERS, memberById, SESSIONS, SPARK, ACTIVITY, OCR_SHOTS, TRANSFERS,
});
