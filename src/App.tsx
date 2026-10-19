import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { type FormEvent, useCallback, useEffect, useState } from "react";
import { loadConfig, type PublicConfig } from "./config";
import { syncClient } from "./sync";

type Client = { id: string; name: string; field_x: string | null; synced_at: string | null };
type SyncState = { status: "idle" | "pending" | "synced" | "error"; message?: string };

export function App() {
  const [cfg, setCfg] = useState<PublicConfig | null>(null);
  const [sb, setSb] = useState<SupabaseClient | null>(null);
  const [clients, setClients] = useState<Client[]>([]);
  const [name, setName] = useState("");
  const [fieldX, setFieldX] = useState("");
  const [sync, setSync] = useState<Record<string, SyncState>>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async (client: SupabaseClient) => {
    const { data, error: e } = await client
      .from("clients")
      .select("id,name,field_x,synced_at")
      .order("created_at", { ascending: true })
      .limit(50);
    if (e) setError(e.message);
    setClients((data as Client[] | null) ?? []);
  }, []);

  useEffect(() => {
    void (async () => {
      const c = await loadConfig();
      setCfg(c);
      if (!c.supabaseUrl) return;
      const client = createClient(c.supabaseUrl, c.supabaseAnonKey, {
        global: c.accessToken ? { headers: { Authorization: `Bearer ${c.accessToken}` } } : {},
        auth: { persistSession: false, autoRefreshToken: false },
      });
      setSb(client);
      await refresh(client);
    })();
  }, [refresh]);

  async function onCreate(ev: FormEvent) {
    ev.preventDefault();
    if (!sb || !name.trim()) return;
    const { error: e } = await sb
      .from("clients")
      .insert({ name: name.trim(), field_x: fieldX.trim() || null });
    if (e) {
      setError(e.message);
      return;
    }
    setName("");
    setFieldX("");
    await refresh(sb);
  }

  async function onSync(c: Client) {
    if (!sb || !cfg) return;
    setSync((s) => ({ ...s, [c.id]: { status: "pending" } }));
    const r = await syncClient(cfg.syncUrl, c.id);
    if (!r.ok) {
      setSync((s) => ({ ...s, [c.id]: { status: "error", message: r.reason } }));
      return;
    }
    const { error: e } = await sb
      .from("clients")
      .update({ synced_at: new Date().toISOString() })
      .eq("id", c.id);
    if (e) {
      setSync((s) => ({ ...s, [c.id]: { status: "error", message: e.message } }));
      return;
    }
    setSync((s) => ({ ...s, [c.id]: { status: "synced" } }));
    await refresh(sb);
  }

  return (
    <main>
      <h1>
        Clients (<span data-testid="environment">{cfg?.environment ?? "?"}</span>)
      </h1>
      <form onSubmit={onCreate} data-testid="create-form">
        <input
          data-testid="name"
          placeholder="Nom"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          data-testid="field-x"
          placeholder="Champ X"
          value={fieldX}
          onChange={(e) => setFieldX(e.target.value)}
        />
        <button type="submit" data-testid="create">
          Créer
        </button>
      </form>
      {error && (
        <p role="alert" data-testid="error">
          {error}
        </p>
      )}
      <ul data-testid="clients">
        {clients.map((c) => {
          const st = sync[c.id] ?? { status: c.synced_at ? "synced" : "idle" };
          return (
            <li key={c.id} data-testid="client-row" data-client-id={c.id}>
              <span data-testid="client-name">{c.name}</span> —{" "}
              <span data-testid="client-field-x">{c.field_x ?? "∅"}</span>{" "}
              <span data-testid="sync-status" data-status={st.status}>
                {st.status === "synced"
                  ? "synchronisé"
                  : st.status === "pending"
                    ? "…"
                    : st.status === "error"
                      ? `erreur : ${st.message ?? "?"}`
                      : "non synchronisé"}
              </span>{" "}
              <button
                type="button"
                data-testid="sync"
                disabled={st.status === "pending" || st.status === "synced"}
                onClick={() => void onSync(c)}
              >
                {st.status === "error" ? "Réessayer" : "Synchroniser"}
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
