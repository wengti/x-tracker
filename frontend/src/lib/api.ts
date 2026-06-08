const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "";

export function apiURL(path: string): string {
  return `${baseURL}${path}`;
}
