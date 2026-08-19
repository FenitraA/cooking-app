import imageCompression from "browser-image-compression";
import { UnauthorizedError } from "./errors";
import { CloudinaryUploadResult, PaginationVariables } from "./types";
import { BASE_URL } from "./variables";
import {
  IngredientBase,
  IngredientStockRead,
  IngredientTypeBase,
  IngredientUnitBase,
  SellerBase,
} from "./ingredient/types";
import { MealIngredientRead, RecipeBase } from "./recipe/types";
import { ItemCategoryBase } from "./shopping/types";

export const getIngredientUnitName = (g: IngredientUnitBase) =>
  g.name.toLocaleString();
export const getIngredientTypeName = (g: IngredientTypeBase) =>
  g.name.toLocaleString();
export const getItemCategoryName = (g: ItemCategoryBase) =>
  g.name.toLocaleString();
export const getSellerName = (s: SellerBase) => s.name.toLocaleString();
export const getIngredientName = (i: IngredientBase) => i.name.toLocaleString();
export const getRecipeName = (i: RecipeBase) => i.name.toLocaleString();
export const getIngredientStockName = (i: IngredientStockRead) =>
  `${i.seller_name} - ${formatNumberToCurrency(i.ingredient_stock.unit_cost)} / ${formatNumber(i.quantity_left)}${i.ingredient_unit} `;
export const getIngredientStockNameSimple = (i: IngredientStockRead) =>
  `${i.seller_name} - ${formatNumberToCurrency(i.ingredient_stock.unit_cost)}/${i.ingredient_unit} `;
export const getMealIngredientStockDescription = (i: MealIngredientRead) =>
  `${i.seller_name} - ${formatNumberToCurrency(i.unit_cost)}/${i.ingredient_unit}`;

export function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export async function safeReadError(res: Response) {
  try {
    const text = await res.text();
    // if FastAPI returns JSON error, still show something useful
    return text?.slice(0, 400);
  } catch {
    return null;
  }
}

export function getPageAndPerPageValues(
  offset: number,
  limit: number,
  totalResults: number,
): PaginationVariables {
  const perPage = limit;
  const currentPage = Math.floor(offset / perPage) + 1;
  const totalPages = Math.ceil(totalResults / perPage);

  return { currentPage, perPage, totalPages };
}

export function getPaginationValues(
  currentPage: number,
  perPage: number,
): { offset: number; limit: number } {
  const limit = perPage;
  const offset = (currentPage - 1) * perPage;
  return { offset, limit };
}

export function normStr(value: unknown): string {
  if (value == null) return "";

  if (typeof value === "string") {
    return value.trim();
  }

  return String(value).trim();
}
export function formatNumber(value: string | number): string {
  const number = typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(number)) {
    return "";
  }
  return Number(value).toString();
}
export function formatNumberToCurrency(value: string | number): string {
  const number = typeof value === "string" ? Number.parseFloat(value) : value;

  if (Number.isNaN(number)) {
    return "";
  }

  return new Intl.NumberFormat("fr-MG", {
    style: "currency",
    currency: "MGA",
    minimumFractionDigits: 0, // Ariary usually has no decimals
    maximumFractionDigits: 4,
  }).format(number);
}

export function formatWithCommas(n: number) {
  return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}
export function formattedToRawNumber(n: string) {
  return Number(n);
}

export async function uploadImagesToCloudinary(
  files: File[],
  folder: string,
): Promise<CloudinaryUploadResult[]> {
  if (files.length === 0) return [];

  // 1) Ask your FastAPI backend for a signature
  //    Adjust URL to your backend proxy route if needed.
  const signRes = await fetch(
    `${BASE_URL}/proxy/cloudinary/sign?folder=${folder}`,
    {
      method: "GET",
      credentials: "include",
    },
  );

  if (!signRes.ok) {
    const text = await signRes.text();
    throw new Error(`Failed to get upload signature: ${text}`);
  }

  const signed = (await signRes.json()) as {
    cloudName: string;
    apiKey: string;
    timestamp: number;
    signature: string;
    folder: string;
  };

  // 2) Upload each file to Cloudinary
  const uploads = files.map(async (file) => {
    const compressedFile = await imageCompression(file, {
      maxSizeMB: 1,
      maxWidthOrHeight: 1200,
      useWebWorker: true,
      initialQuality: 0.8,
      fileType: "image/webp",
    });
    const webpFile = new File(
      [compressedFile],
      file.name.replace(/\.\w+$/, ".webp"),
      {
        type: "image/webp",
      },
    );
    const form = new FormData();
    form.append("file", webpFile);
    form.append("api_key", signed.apiKey);
    form.append("timestamp", String(signed.timestamp));
    form.append("signature", signed.signature);
    form.append("folder", signed.folder);

    // optional: add tags/context if you want
    // form.append("tags", "lot");
    // form.append("context", "source=lot_registration");

    const uploadUrl = `https://api.cloudinary.com/v1_1/${signed.cloudName}/image/upload`;

    const res = await fetch(uploadUrl, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`Cloudinary upload failed: ${errText}`);
    }

    const data = (await res.json()) as CloudinaryUploadResult;
    return {
      public_id: data.public_id,
      secure_url: data.secure_url,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      format: data.format,
    };
  });

  // If any single upload fails, Promise.all rejects (good for atomicity flow)
  const results = await Promise.allSettled(uploads);

  const successes = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<CloudinaryUploadResult>).value);

  const failures = results.filter((r) => r.status === "rejected");

  if (failures.length > 0) {
    await deleteCloudinaryImages(successes.map((s) => s.public_id));
    throw new Error("Upload failed. Rolled back.");
  }

  return successes;
}

export async function deleteCloudinaryImages(image_ids: string[]) {
  if (image_ids.length === 0) return;

  const res = await fetch(`${BASE_URL}/proxy/lots/images/delete-many`, {
    method: "POST",
    credentials: "include",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ image_ids: image_ids }),
  });

  if (res.status === 401) throw new UnauthorizedError("Unauthorized");
  if (!res.ok) throw new Error(await res.text().catch(() => "Request failed"));

  return res.json();
}

export function formatDateFR(dateInput: string | Date): string {
  return new Date(dateInput).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
export function formatDateFRNoTime(dateInput: string | Date): string {
  return new Date(dateInput).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
export function formatDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function getWeekRange(date: Date) {
  const start = new Date(date);

  const day = start.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  start.setDate(start.getDate() + diff);

  const end = new Date(start);
  end.setDate(start.getDate() + 6);

  return { start, end };
}
