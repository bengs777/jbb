import { RouterOSAPI } from "node-routeros";

export interface MikrotikProfile {
  name: string;
  rateLimit?: string;
  sharedUsers?: string;
  sessionTimeout?: string;
}

export interface MikrotikActiveUser {
  id: string;
  name: string;
  address: string;
  "mac-address": string;
  uptime: string;
  "bytes-in": string;
  "bytes-out": string;
  comment?: string;
}

function getClient() {
  const host = process.env.MIKROTIK_HOST;
  const port = parseInt(process.env.MIKROTIK_PORT ?? "8728", 10);
  const user = process.env.MIKROTIK_USER;
  const password = process.env.MIKROTIK_PASS;

  if (!host || !user || !password) {
    throw new Error("MikroTik env vars not configured (MIKROTIK_HOST, MIKROTIK_USER, MIKROTIK_PASS)");
  }

  return new RouterOSAPI({
    host,
    port,
    user,
    password,
    timeout: 8,
  });
}

async function withConnection<T>(fn: (api: RouterOSAPI) => Promise<T>): Promise<T> {
  const api = getClient();
  try {
    await api.connect();
    const result = await fn(api);
    return result;
  } finally {
    try {
      api.close();
    } catch {
      // ignore close errors
    }
  }
}

export async function getProfiles(): Promise<MikrotikProfile[]> {
  return withConnection(async (api) => {
    const raw = await api.write("/ip/hotspot/user/profile/print");
    return (raw as any[]).map((p) => ({
      name: p.name as string,
      rateLimit: p["rate-limit"],
      sharedUsers: p["shared-users"],
      sessionTimeout: p["session-timeout"],
    }));
  });
}

export async function getActiveUsers(): Promise<MikrotikActiveUser[]> {
  return withConnection(async (api) => {
    const raw = await api.write("/ip/hotspot/active/print");
    return raw as MikrotikActiveUser[];
  });
}

export async function kickActiveUser(activeId: string): Promise<void> {
  return withConnection(async (api) => {
    await api.write("/ip/hotspot/active/remove", [`=.id=${activeId}`]);
  });
}

export async function addHotspotUser(
  name: string,
  password: string,
  profile: string,
  comment?: string
): Promise<void> {
  return withConnection(async (api) => {
    const args = [
      `=name=${name}`,
      `=password=${password}`,
      `=profile=${profile}`,
    ];
    if (comment) args.push(`=comment=${comment}`);
    await api.write("/ip/hotspot/user/add", args);
  });
}

export async function removeHotspotUser(name: string): Promise<void> {
  return withConnection(async (api) => {
    const found = await api.write("/ip/hotspot/user/print", [`?name=${name}`]);
    if (found.length === 0) return;
    const id = (found[0] as any)[".id"] as string;
    await api.write("/ip/hotspot/user/remove", [`=.id=${id}`]);
  });
}
