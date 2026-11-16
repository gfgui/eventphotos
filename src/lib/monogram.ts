/** The first letters of the first and last words, such as "MC" for "Maria Clara". */
function initials(text: string) {
  const words = text.split(/\s+/).filter((word) => /^\p{L}/u.test(word));
  if (words.length === 0) return "";
  return words.length > 1 ? `${words[0][0]}${words.at(-1)?.[0]}` : words[0][0];
}

/**
 * The event's initials. The honorees come first: "AB" for Ana and Bruno, or "MC" for Maria
 * Clara alone. Without them, the event's own name stands in, as in "JM" for "João & Maria".
 */
export function eventMonogram({
  name,
  honorees,
}: {
  name: string;
  honorees: string[];
}) {
  const people = honorees.map((person) => person.trim()).filter(Boolean);
  let letters: string;
  if (people.length > 1) {
    letters = people
      .slice(0, 2)
      .map((person) => initials(person).charAt(0))
      .join("");
  } else if (people.length === 1) {
    letters = initials(people[0]);
  } else {
    letters = initials(name);
  }
  return (letters || name.slice(0, 2)).toUpperCase();
}
