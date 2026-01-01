import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Proxy an image URL through wsrv.nl for better reliability and caching
 */
export function proxyImageUrl(url: string): string {
  return `https://wsrv.nl/?${new URLSearchParams({ url, output: "webp" }).toString()}`;
}
