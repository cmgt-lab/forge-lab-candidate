/**
 * Synchronisation d'un client vers le service externe Y.
 *
 * Règle métier de la fixture : une tentative et ses reprises portent la MÊME clé d'idempotence,
 * pour que Y ne crée jamais deux fois le même objet quand l'utilisateur réessaie après une panne.
 * La clé est choisie une fois par client et par session (voir `keyFor`), jamais régénérée sur
 * une reprise.
 */

const keys = new Map<string, string>();

export function keyFor(clientId: string): string {
  let k = keys.get(clientId);
  if (!k) {
    k = crypto.randomUUID();
    keys.set(clientId, k);
  }
  return k;
}

export type SyncResult = { ok: true; key: string } | { ok: false; key: string; reason: string };

export async function syncClient(syncUrl: string, clientId: string): Promise<SyncResult> {
  const key = keyFor(clientId);
  try {
    const r = await fetch(syncUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify({ client_id: clientId, key }),
    });
    if (!r.ok) return { ok: false, key, reason: `Y a répondu ${r.status}` };
    return { ok: true, key };
  } catch (e) {
    return { ok: false, key, reason: e instanceof Error ? e.message : String(e) };
  }
}
