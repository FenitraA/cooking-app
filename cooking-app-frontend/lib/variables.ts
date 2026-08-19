export const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;
export const API_URL = process.env.NEXT_PUBLIC_API_URL;
export const MAXIMUM_IMAGES =
  Number(process.env.NEXT_PUBLIC_MAXIMUM_IMAGES) || 1;

export const LOCALES = [
  { value: "en", label: "English" },
  { value: "fr", label: "Français" },
] as const;
