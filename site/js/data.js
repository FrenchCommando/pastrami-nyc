// Content for the home page. Plain data, no DOM: the tests import it too.

// take: your own review, e.g. { score: '9/10', text: '...' }; shown on the card only when present.
export const DELIS = [
  {
    name: "Katz's Delicatessen", since: '1888', borough: 'Manhattan', hood: 'Lower East Side',
    address: '205 E Houston St',
    blurb: 'The cathedral. Pastrami is carved by hand to order, and the carver hands you a sample while he works. Tip him and the pile tends to grow.',
    order: 'Pastrami on rye, hand-cut, ask for it juicy',
    tags: ['hand-carved', 'landmark'],
    tip: "Take a ticket at the door and don't lose it. You pay with it on the way out.",
  },
  {
    name: 'Carnegie Deli', since: '1937', borough: 'Manhattan', hood: 'Midtown',
    address: '834 Seventh Ave',
    blurb: 'Closed in 2016, back in September 2026 in the old Stage Deli space, a short walk from where it started. Sandwiches tall enough to need a structural engineer. Walk-in only.',
    order: 'Pastrami on rye, and cheesecake if you can still move',
    tags: ['reopened 2026', 'towering'],
    news: true,
  },
  {
    name: '2nd Ave Deli', since: '1954', borough: 'Manhattan', hood: 'Murray Hill · Upper East Side',
    address: '162 E 33rd St',
    blurb: 'Kosher institution that left Second Avenue long ago but kept the name. Two Manhattan locations, one at E 33rd and one on First Avenue at 75th.',
    order: 'Pastrami on rye, matzo ball soup',
    tags: ['kosher', 'two locations'],
  },
  {
    name: 'Pastrami Queen', since: '', borough: 'Manhattan', hood: 'Upper East Side',
    address: '1125 Lexington Ave',
    blurb: 'A tiny Lexington Avenue counter, mostly takeout, with a loyal uptown following. The Upper West Side outpost closed in 2026, so this is the one.',
    order: 'Pastrami on rye, extra mustard',
    tags: ['kosher-style', 'small counter'],
  },
  {
    name: "Sarge's Delicatessen & Diner", since: '1964', borough: 'Manhattan', hood: 'Murray Hill',
    address: '548 Third Ave',
    blurb: 'Opened by a former NYPD sergeant, hence the name. Half deli, half diner, with big portions and little ceremony.',
    order: 'Pastrami on rye or a hot pastrami Reuben',
    tags: ['diner', 'Reuben-friendly'],
  },
  {
    name: "Liebman's Delicatessen", since: '1953', borough: 'Bronx', hood: 'Riverdale',
    address: '552 W 235th St',
    blurb: 'Often called the last Jewish deli in the Bronx. Kosher, neighborhood-scale, unchanged in the best way. A second location opened in Ardsley, Westchester, in 2024.',
    order: 'Pastrami on rye, a knish on the side',
    tags: ['kosher', 'neighborhood'],
  },
  {
    name: "David's Brisket House", since: '1981', borough: 'Brooklyn', hood: 'Bed-Stuy',
    address: '533 Nostrand Ave',
    blurb: "A Bed-Stuy institution, run by a Yemeni family since 2008 and halal. Plenty of regulars say it's the best pastrami in the city. Go and decide for yourself.",
    order: 'Pastrami on rye, or the pastrami Reuben',
    tags: ['halal', 'Brooklyn'],
  },
  {
    name: "Frankel's Delicatessen & Appetizing", since: '', borough: 'Brooklyn', hood: 'Greenpoint',
    address: '631 Manhattan Ave',
    blurb: 'Newer deli with old-school respect. Pastrami plus the appetizing side: lox, whitefish, bagels. Weekend lines are real.',
    order: 'Pastrami, egg & cheese on a roll',
    tags: ['breakfast', 'appetizing'],
  },
];

export const LB_TO_KG = 0.45359237;

// Grams per kg of trimmed brisket. The cure is an equilibrium cure: 2.5% salt and
// 0.25% Prague Powder #1 (6.25% sodium nitrite -> ~156 ppm), so time can't oversalt it.
export const CURE = [
  ['Kosher salt', 25],
  ['Brown sugar', 10],
  ['Prague Powder #1', 2.5],
];

export const RUB = [
  ['Black peppercorns, coarse-cracked', 14],
  ['Coriander seed, coarse-cracked', 9],
  ['Brown sugar', 4],
  ['Sweet paprika', 3],
  ['Garlic powder', 2],
  ['Mustard seed, cracked', 2],
];

export const toKg = (weight, unit) => (unit === 'lb' ? weight * LB_TO_KG : weight);

export const scale = (items, kg) => items.map(([name, perKg]) => [name, perKg * kg]);

export const formatGrams = (g) => (g < 10 ? g.toFixed(1) : String(Math.round(g))) + ' g';

export const mapUrl = (d) =>
  'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(`${d.name} ${d.address} New York`);
