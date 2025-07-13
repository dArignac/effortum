export function setItem(key: string, value: unknown) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error("Error saving to localStorage", error);
  }
}

export function getItem(key: string) {
  if (typeof window === "undefined") return;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : undefined;
  } catch (error) {
    console.error("Error reading from localStorage", error);
  }
}
