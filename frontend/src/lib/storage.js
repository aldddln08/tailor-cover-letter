const NAME_KEY = "coverLetter:name";
const SKILLS_KEY = "coverLetter:skills";
const GUEST_ID_KEY = "coverLetter:guestId";

export function loadCachedInputs() {
  return {
    name: localStorage.getItem(NAME_KEY) || "",
    skills: localStorage.getItem(SKILLS_KEY) || "",
  };
}

export function saveCachedInputs({ name, skills }) {
  localStorage.setItem(NAME_KEY, name);
  localStorage.setItem(SKILLS_KEY, skills);
}

export function getOrCreateGuestId() {
  const existing = localStorage.getItem(GUEST_ID_KEY);
  if (existing) {
    return existing;
  }

  const generated =
    globalThis.crypto?.randomUUID?.() ||
    `guest-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  localStorage.setItem(GUEST_ID_KEY, generated);
  return generated;
}
