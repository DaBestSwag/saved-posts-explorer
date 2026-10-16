export const CATEGORIES = [
  'Politics', 'Other', 'Filmmaking', 'Basketball', 'Agentic coding', 'Movies and TV', 'Music', 'Memes',
  'Going out', 'Gaming', 'Cooking', 'Food out', 'Workout', 'Other sports', 'Massage', 'Science',
];
export const SUBS = ['Music videos', 'Cinematography', 'Lighting', 'Color grading', 'Editing'];

/** Stable hue per category, used for chip colors. */
export const catHue = (name: string) => {
  const i = CATEGORIES.indexOf(name);
  if (i >= 0) return (i * 47 + 12) % 360;
  return SUBS.includes(name) ? 215 : 0;
};
