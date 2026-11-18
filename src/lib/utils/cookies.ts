/** Browser cookie helpers. All are no-ops / return null during server rendering. */

export function readCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const prefix = `${encodeURIComponent(name)}=`;
  const entry = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(prefix));
  return entry ? decodeURIComponent(entry.slice(prefix.length)) : null;
}

export function writeCookie(name: string, value: string, expires: Date): void {
  if (typeof document === "undefined") return;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=/; Expires=${expires.toUTCString()}; SameSite=Strict${secure}`;
}

export function deleteCookie(name: string): void {
  writeCookie(name, "", new Date(0));
}
