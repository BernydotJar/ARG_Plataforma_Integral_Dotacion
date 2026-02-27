import "server-only";

import { env } from "@/lib/config/env";

type QueryOptions = {
  select?: string[];
  filter?: string;
  orderBy?: string;
  top?: number;
  expand?: string[];
};

type TokenCache = {
  accessToken: string;
  expiresAt: number;
};

let tokenCache: TokenCache | null = null;

const getDataverseScope = (): string => {
  const baseUrl = new URL(env.dataverse.url);
  return `${baseUrl.origin}/.default`;
};

const fetchDataverseToken = async (): Promise<string> => {
  if (!env.dataverse.tenantId || !env.dataverse.clientId || !env.dataverse.clientSecret) {
    throw new Error("Configuracion Dataverse incompleta");
  }

  const now = Date.now();
  if (tokenCache && tokenCache.expiresAt > now + 60_000) {
    return tokenCache.accessToken;
  }

  const tokenUrl = `https://login.microsoftonline.com/${env.dataverse.tenantId}/oauth2/v2.0/token`;

  const response = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: env.dataverse.clientId,
      client_secret: env.dataverse.clientSecret,
      scope: getDataverseScope(),
    }),
    cache: "no-store",
  });

  if (!response.ok) {
    const payload = await response.text();
    throw new Error(`No se pudo obtener token de Dataverse: ${response.status} ${payload}`);
  }

  const tokenPayload = (await response.json()) as { access_token: string; expires_in: number };

  tokenCache = {
    accessToken: tokenPayload.access_token,
    expiresAt: now + tokenPayload.expires_in * 1000,
  };

  return tokenPayload.access_token;
};

const buildQuery = (options?: QueryOptions): string => {
  if (!options) return "";

  const params = new URLSearchParams();
  if (options.select?.length) params.set("$select", options.select.join(","));
  if (options.filter) params.set("$filter", options.filter);
  if (options.orderBy) params.set("$orderby", options.orderBy);
  if (options.top) params.set("$top", String(options.top));
  if (options.expand?.length) params.set("$expand", options.expand.join(","));

  const query = params.toString();
  return query ? `?${query}` : "";
};

const extractEntityId = (header: string | null): string | null => {
  if (!header) return null;
  const match = header.match(/\(([^)]+)\)/);
  return match?.[1] ?? null;
};

class DataverseClient {
  private readonly baseApiUrl: string;

  constructor() {
    this.baseApiUrl = `${env.dataverse.url.replace(/\/$/, "")}/api/data/v9.2`;
  }

  private async request<T>(
    method: "GET" | "POST" | "PATCH" | "DELETE",
    path: string,
    body?: Record<string, unknown>,
  ): Promise<T> {
    const accessToken = await fetchDataverseToken();

    const response = await fetch(`${this.baseApiUrl}/${path.replace(/^\//, "")}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
        Accept: "application/json",
        "OData-MaxVersion": "4.0",
        "OData-Version": "4.0",
        Prefer: "return=representation",
      },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });

    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Error Dataverse ${response.status}: ${text}`);
    }

    if (response.status === 204) {
      return undefined as T;
    }

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return (await response.json()) as T;
    }

    const entityId = extractEntityId(
      response.headers.get("odata-entityid") || response.headers.get("OData-EntityId"),
    );

    return { id: entityId } as T;
  }

  async list<T>(entitySetName: string, options?: QueryOptions): Promise<T[]> {
    const payload = await this.request<{ value: T[] }>(
      "GET",
      `${entitySetName}${buildQuery(options)}`,
    );
    return payload.value;
  }

  async get<T>(entitySetName: string, id: string, options?: Omit<QueryOptions, "filter" | "top">): Promise<T> {
    const query = buildQuery({
      select: options?.select,
      expand: options?.expand,
    });

    return this.request<T>("GET", `${entitySetName}(${id})${query}`);
  }

  async create<T>(entitySetName: string, body: Record<string, unknown>): Promise<T> {
    return this.request<T>("POST", entitySetName, body);
  }

  async update(entitySetName: string, id: string, body: Record<string, unknown>): Promise<void> {
    await this.request<void>("PATCH", `${entitySetName}(${id})`, body);
  }

  async delete(entitySetName: string, id: string): Promise<void> {
    await this.request<void>("DELETE", `${entitySetName}(${id})`);
  }
}

let cachedClient: DataverseClient | null = null;

export const getDataverseClient = (): DataverseClient => {
  if (!cachedClient) {
    cachedClient = new DataverseClient();
  }

  return cachedClient;
};
