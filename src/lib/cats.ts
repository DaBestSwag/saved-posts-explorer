export const CATEGORIES = [
  'Politics', 'Other', 'Filmmaking', 'Basketball', 'Agentic coding', 'Movies and TV', 'Music', 'Memes',
  'Going out', 'Gaming', 'Cooking', 'Food out', 'Workout', 'Other sports', 'Massage', 'Science',
];

/** Subcategories belong to one parent category and only show once that parent is picked. */
export const SUB_PARENTS: Record<string, string[]> = {
  Filmmaking: ['Music videos', 'Cinematography', 'Lighting', 'Color grading', 'Editing'],
  // Cooking and Going out labels come from data/extra_subcategories.json.
  Cooking: ['American', 'Asian', 'Italian', 'Mexican', 'Baking & desserts'],
  'Going out': ['Daytime activities', 'Bars', 'Clubs'],
};
export const parentOf = (sub: string) => Object.keys(SUB_PARENTS).find((p) => SUB_PARENTS[p].includes(sub));

/** Stable hue per category, used for chip colors. Subcategories share their parent's hue. */
export const catHue = (name: string): number => {
  const i = CATEGORIES.indexOf(name);
  if (i >= 0) return (i * 47 + 12) % 360;
  const parent = parentOf(name);
  return parent ? catHue(parent) : 215;
};
