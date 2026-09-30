import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";
import { cache } from "react";
import { neon } from "@neondatabase/serverless";
import { ContentSchema, PrivateSchema, type Content, type PrivateData } from "./schema";
import { seedContent, seedPrivate } from "./seed";

export type Message = {
  id: string;
  name: string;
  email: string;
  body: string;
  createdAt: string;
  read: boolean;
  delivered: boolean;
};

interface Driver {
  get(key: string): Promise<unknown | null>;
  set(key: string, value: unknown): Promise<void>;
  addMessage(m: Omit<Message, "id" | "createdAt" | "read">): Promise<void>;
  listMessages(): Promise<Message[]>;
  markMessage(id: string, read: boolean): Promise<void>;
  deleteMessage(id: string): Promise<void>;
  /** Incrementa um contador com janela temporal e devolve o valor atual. */
  hit(key: string, windowSec: number): Promise<number>;
}

/* ---------------------------------------------------------------- Postgres */

function postgresDriver(url: string): Driver {
  const sql = neon(url);
  let ready: Promise<unknown> | null = null;
  const init = () =>
    (ready ??= (async () => {
      await sql`create table if not exists cv_kv (key text primary key, value jsonb not null, updated_at timestamptz not null default now())`;
      await sql`create table if not exists cv_messages (id bigserial primary key, name text not null, email text not null, body text not null, created_at timestamptz not null default now(), read boolean not null default false, delivered boolean not null default false)`;
      await sql`create table if not exists cv_rate (key text primary key, count int not null, reset_at timestamptz not null)`;
    })().catch((e) => {
      ready = null;
      throw e;
    }));

  return {
    async get(key) {
      await init();
      const rows = await sql`select value from cv_kv where key = ${key}`;
      return rows[0]?.value ?? null;
    },
    async set(key, value) {
      await init();
      await sql`insert into cv_kv (key, value, updated_at) values (${key}, ${JSON.stringify(value)}::jsonb, now())
        on conflict (key) do update set value = excluded.value, updated_at = now()`;
    },
    async addMessage(m) {
      await init();
      await sql`insert into cv_messages (name, email, body, delivered) values (${m.name}, ${m.email}, ${m.body}, ${m.delivered})`;
    },
    async listMessages() {
      await init();
      const rows = await sql`select id, name, email, body, created_at, read, delivered from cv_messages order by created_at desc limit 500`;
      return rows.map((r) => ({
        id: String(r.id),
        name: r.name,
        email: r.email,
        body: r.body,
        createdAt: new Date(r.created_at).toISOString(),
        read: r.read,
        delivered: r.delivered,
      }));
    },
    async markMessage(id, read) {
      await init();
      await sql`update cv_messages set read = ${read} where id = ${id}`;
    },
    async deleteMessage(id) {
      await init();
      await sql`delete from cv_messages where id = ${id}`;
    },
    async hit(key, windowSec) {
      await init();
      const rows = await sql`insert into cv_rate (key, count, reset_at) values (${key}, 1, now() + make_interval(secs => ${windowSec}))
        on conflict (key) do update set
          count = case when cv_rate.reset_at < now() then 1 else cv_rate.count + 1 end,
          reset_at = case when cv_rate.reset_at < now() then now() + make_interval(secs => ${windowSec}) else cv_rate.reset_at end
        returning count`;
      return Number(rows[0]?.count ?? 1);
    },
  };
}

/* ------------------------------------------- Ficheiros locais (só para dev) */

function fileDriver(): Driver {
  const dir = path.join(process.cwd(), ".data");
  const file = (name: string) => path.join(dir, name);
  const rate = new Map<string, { count: number; reset: number }>();

  async function readJson<T>(name: string, fallback: T): Promise<T> {
    try {
      return JSON.parse(await fs.readFile(file(name), "utf8")) as T;
    } catch {
      return fallback;
    }
  }
  async function writeJson(name: string, value: unknown) {
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(file(name), JSON.stringify(value, null, 2), "utf8");
  }

  return {
    async get(key) {
      const kv = await readJson<Record<string, unknown>>("kv.json", {});
      return kv[key] ?? null;
    },
    async set(key, value) {
      const kv = await readJson<Record<string, unknown>>("kv.json", {});
      kv[key] = value;
      await writeJson("kv.json", kv);
    },
    async addMessage(m) {
      const list = await readJson<Message[]>("messages.json", []);
      list.unshift({ ...m, id: String(Date.now()), createdAt: new Date().toISOString(), read: false });
      await writeJson("messages.json", list);
    },
    async listMessages() {
      return readJson<Message[]>("messages.json", []);
    },
    async markMessage(id, read) {
      const list = await readJson<Message[]>("messages.json", []);
      await writeJson("messages.json", list.map((m) => (m.id === id ? { ...m, read } : m)));
    },
    async deleteMessage(id) {
      const list = await readJson<Message[]>("messages.json", []);
      await writeJson("messages.json", list.filter((m) => m.id !== id));
    },
    async hit(key, windowSec) {
      const now = Date.now();
      const cur = rate.get(key);
      if (!cur || cur.reset < now) {
        rate.set(key, { count: 1, reset: now + windowSec * 1000 });
        return 1;
      }
      cur.count++;
      return cur.count;
    },
  };
}

let driver: Driver | null = null;
function db(): Driver {
  if (driver) return driver;
  const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
  if (url) return (driver = postgresDriver(url));
  if (process.env.VERCEL) {
    throw new Error("DATABASE_URL não está definido. Liga uma base de dados Neon Postgres ao projeto na Vercel.");
  }
  return (driver = fileDriver());
}

/* ------------------------------------------------------------------ API */

export const getContent = cache(async (): Promise<Content> => {
  const raw = await db().get("content");
  if (raw == null) {
    await db().set("content", seedContent);
    return seedContent;
  }
  const parsed = ContentSchema.safeParse(raw);
  if (!parsed.success) {
    console.error("[store] conteúdo inválido na base de dados:", parsed.error.issues.slice(0, 5));
    throw new Error("O conteúdo guardado é inválido. Vê os logs do servidor.");
  }
  return parsed.data;
});

export async function saveContent(content: Content) {
  await db().set("content", ContentSchema.parse(content));
}

export async function getPrivate(): Promise<PrivateData> {
  const raw = await db().get("private");
  if (raw == null) return seedPrivate;
  const parsed = PrivateSchema.safeParse(raw);
  return parsed.success ? parsed.data : seedPrivate;
}

export async function savePrivate(data: PrivateData) {
  await db().set("private", PrivateSchema.parse(data));
}

export const messages = {
  add: (m: Omit<Message, "id" | "createdAt" | "read">) => db().addMessage(m),
  list: () => db().listMessages(),
  mark: (id: string, read: boolean) => db().markMessage(id, read),
  remove: (id: string) => db().deleteMessage(id),
};

/** true se o limite foi excedido. */
export async function rateLimited(key: string, max: number, windowSec: number) {
  const n = await db().hit(key, windowSec);
  return n > max;
}
