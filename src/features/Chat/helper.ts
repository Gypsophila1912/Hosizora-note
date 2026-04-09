export function getGreeting() {
  const hour = new Date().getHours();

  if (hour < 12) return "おはよう ☀️";
  if (hour < 18) return "こんにちは 🌤";
  return "こんばんは 🌙";
}
