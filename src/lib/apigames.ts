import { logger } from "@/lib/logger";

type UnknownRecord = Record<string, unknown>;

export class ApiGamesError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "CONFIG_ERROR"
      | "NETWORK_ERROR"
      | "HTTP_ERROR"
      | "RESPONSE_ERROR"
      | "NOT_FOUND",
    public readonly meta?: UnknownRecord
  ) {
    super(message);
    this.name = "ApiGamesError";
  }
}

export interface ApiGamesProduct {
  code: string;
  name: string;
  buyPrice: number;
  gameId: string | null;
  nominalValue: string | null;
  status: "ACTIVE" | "INACTIVE";
  raw: UnknownRecord;
}

interface ApiGamesConfig {
  baseUrl: string;
  apiKey: string;
  timeoutMs: number;
  maxRetry: number;
}

const RETRYABLE_STATUS = new Set([500, 502, 503, 504]);

function asObject(value: unknown): UnknownRecord {
  return typeof value === "object" && value !== null ? (value as UnknownRecord) : {};
}

function pickString(obj: UnknownRecord, keys: string[]): string | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return undefined;
}

function pickNumber(obj: UnknownRecord, keys: string[]): number | undefined {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "number" && Number.isFinite(v)) return Math.trunc(v);
    if (typeof v === "string" && v.trim()) {
      const parsed = Number(v.replace(/[^\d.-]/g, ""));
      if (Number.isFinite(parsed)) return Math.trunc(parsed);
    }
  }
  return undefined;
}

function parsePositiveIntEnv(name: string): number {
  const raw = process.env[name]?.trim();
  if (!raw) {
    throw new ApiGamesError(`${name} wajib di-set`, "CONFIG_ERROR", { name });
  }
  const value = Number(raw);
  if (!Number.isInteger(value) || value <= 0) {
    throw new ApiGamesError(`${name} harus integer > 0`, "CONFIG_ERROR", { name, raw });
  }
  return value;
}

function getConfig(): ApiGamesConfig {
  const baseUrl = process.env.APIGAMES_BASE_URL?.trim();
  const apiKey = process.env.APIGAMES_API_KEY?.trim();

  if (!baseUrl) {
    throw new ApiGamesError("APIGAMES_BASE_URL wajib di-set", "CONFIG_ERROR");
  }
  if (!apiKey) {
    throw new ApiGamesError("APIGAMES_API_KEY wajib di-set", "CONFIG_ERROR");
  }

  return {
    baseUrl: baseUrl.replace(/\/+$/, ""),
    apiKey,
    timeoutMs: parsePositiveIntEnv("APIGAMES_TIMEOUT_MS"),
    maxRetry: parsePositiveIntEnv("APIGAMES_MAX_RETRY"),
  };
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildUrl(baseUrl: string, path: string, query?: Record<string, string | number | undefined>) {
  const url = new URL(`${baseUrl}${path}`);
  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }
  return url;
}

async function requestJson(
  config: ApiGamesConfig,
  path: string,
  query?: Record<string, string | number | undefined>
): Promise<unknown> {
  const url = buildUrl(config.baseUrl, path, query);

  for (let attempt = 0; attempt <= config.maxRetry; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), config.timeoutMs);

    try {
      const res = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${config.apiKey}`,
          "X-API-KEY": config.apiKey,
        },
        signal: controller.signal,
      });

      clearTimeout(timeout);

      if (!res.ok) {
        if (res.status === 404) {
          throw new ApiGamesError("Resource Apigames tidak ditemukan", "NOT_FOUND", {
            url: url.toString(),
            status: res.status,
          });
        }

        if (RETRYABLE_STATUS.has(res.status) && attempt < config.maxRetry) {
          const backoff = 250 * 2 ** attempt;
          logger.warn("[apigames] retrying request", {
            path,
            status: res.status,
            attempt: attempt + 1,
            backoff,
          });
          await sleep(backoff);
          continue;
        }

        throw new ApiGamesError("HTTP error from Apigames", "HTTP_ERROR", {
          url: url.toString(),
          status: res.status,
        });
      }

      return await res.json();
    } catch (error) {
      clearTimeout(timeout);

      if (error instanceof ApiGamesError) {
        throw error;
      }

      const isAbort = error instanceof Error && error.name === "AbortError";
      const isRetryableNetworkError = attempt < config.maxRetry;

      if (isRetryableNetworkError) {
        const backoff = 250 * 2 ** attempt;
        logger.warn("[apigames] network retry", {
          path,
          attempt: attempt + 1,
          backoff,
          abort: isAbort,
          message: error instanceof Error ? error.message : String(error),
        });
        await sleep(backoff);
        continue;
      }

      throw new ApiGamesError("Network error calling Apigames", "NETWORK_ERROR", {
        path,
        abort: isAbort,
        message: error instanceof Error ? error.message : String(error),
      });
    }
  }

  throw new ApiGamesError("Unreachable retry branch", "NETWORK_ERROR");
}

function extractItems(payload: unknown): UnknownRecord[] {
  if (Array.isArray(payload)) {
    return payload.map(asObject);
  }

  const root = asObject(payload);
  const data = root.data;

  if (Array.isArray(data)) return data.map(asObject);

  const dataObj = asObject(data);
  for (const key of ["items", "results", "products", "list"]) {
    if (Array.isArray(dataObj[key])) {
      return (dataObj[key] as unknown[]).map(asObject);
    }
  }

  for (const key of ["items", "results", "products", "list"]) {
    if (Array.isArray(root[key])) {
      return (root[key] as unknown[]).map(asObject);
    }
  }

  if (Object.keys(dataObj).length > 0) {
    return [dataObj];
  }

  return [];
}

function extractPagination(payload: unknown): { hasNext: boolean; nextPage: number | null } {
  const root = asObject(payload);
  const data = asObject(root.data);
  const pagination = asObject(root.pagination ?? data.pagination ?? root.meta ?? data.meta);

  const currentPage = pickNumber(pagination, ["current_page", "currentPage", "page"]);
  const totalPages = pickNumber(pagination, ["total_page", "totalPage", "total_pages", "last_page", "lastPage"]);
  const hasNextRaw = pagination.has_next ?? pagination.hasNext;
  const nextPageRaw = pickNumber(pagination, ["next_page", "nextPage"]);

  if (typeof hasNextRaw === "boolean") {
    return { hasNext: hasNextRaw, nextPage: nextPageRaw ?? (hasNextRaw && currentPage ? currentPage + 1 : null) };
  }

  if (nextPageRaw && nextPageRaw > 0) {
    return { hasNext: true, nextPage: nextPageRaw };
  }

  if (currentPage && totalPages && currentPage < totalPages) {
    return { hasNext: true, nextPage: currentPage + 1 };
  }

  return { hasNext: false, nextPage: null };
}

function normalizeProduct(item: UnknownRecord): ApiGamesProduct {
  const code = pickString(item, ["code", "sku", "product_code", "productCode", "id"]);
  const name = pickString(item, ["name", "product_name", "productName", "title"]);
  const buyPrice = pickNumber(item, ["buy_price", "buyPrice", "price", "cost", "modal"]);

  if (!code || !name || buyPrice === undefined || buyPrice <= 0) {
    throw new ApiGamesError("Invalid Apigames product structure", "RESPONSE_ERROR", {
      code,
      name,
      buyPrice,
      item,
    });
  }

  const gameId = pickString(item, ["game_id", "gameId", "category", "game"])
    ?.toLowerCase()
    ?.replace(/\s+/g, "_") ?? null;
  const nominalValue = pickString(item, ["nominal_value", "nominalValue", "value", "amount"]) ?? null;
  const statusRaw = pickString(item, ["status", "active", "is_active", "isActive"]);
  const normalizedStatus = ["inactive", "disabled", "false", "0", "empty"].includes(
    (statusRaw ?? "").toLowerCase()
  )
    ? "INACTIVE"
    : "ACTIVE";

  return {
    code,
    name,
    buyPrice,
    gameId,
    nominalValue,
    status: normalizedStatus,
    raw: item,
  };
}

export function calculateSellPrice(buyPrice: number): number {
  return Math.ceil(buyPrice * 1.05);
}

export async function getAllProducts(): Promise<ApiGamesProduct[]> {
  const config = getConfig();

  const products: ApiGamesProduct[] = [];
  let page = 1;
  let loops = 0;

  while (loops < 500) {
    loops += 1;

    const payload = await requestJson(config, "/products", { page, limit: 100 });
    const items = extractItems(payload);
    if (items.length === 0) break;

    for (const item of items) {
      products.push(normalizeProduct(item));
    }

    const pagination = extractPagination(payload);
    if (!pagination.hasNext) break;
    page = pagination.nextPage ?? page + 1;
  }

  if (products.length === 0) {
    throw new ApiGamesError("Apigames tidak mengembalikan produk", "RESPONSE_ERROR");
  }

  logger.info("[apigames] products fetched", {
    count: products.length,
    pageCount: loops,
  });

  return products;
}

export async function validateProductPrice(code: string): Promise<ApiGamesProduct> {
  const config = getConfig();
  const normalizedCode = code.trim();
  if (!normalizedCode) {
    throw new ApiGamesError("Product code wajib diisi", "RESPONSE_ERROR", { code });
  }

  try {
    const directPayload = await requestJson(config, `/products/${encodeURIComponent(normalizedCode)}`);
    const directItems = extractItems(directPayload);
    if (directItems.length > 0) {
      return normalizeProduct(directItems[0]);
    }
  } catch (error) {
    if (error instanceof ApiGamesError && error.code !== "NOT_FOUND") {
      throw error;
    }
  }

  const fallbackPayload = await requestJson(config, "/products", { code: normalizedCode, limit: 1 });
  const fallbackItems = extractItems(fallbackPayload);
  const matched = fallbackItems.find((item) => {
    const candidate = pickString(item, ["code", "sku", "product_code", "productCode", "id"]);
    return candidate?.toLowerCase() === normalizedCode.toLowerCase();
  });

  if (!matched) {
    throw new ApiGamesError("Produk tidak ditemukan di Apigames", "NOT_FOUND", { code: normalizedCode });
  }

  return normalizeProduct(matched);
}
