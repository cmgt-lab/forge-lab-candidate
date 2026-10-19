/**
 * Configuration PUBLIQUE chargée à l'exécution (validation Pharos §3.2) : le même paquet front
 * sert en preview, préprod et prod ; seul /config.json change. Repli sur les variables VITE_*
 * intégrées au build, pour rester compatible avec un déploiement classique.
 *
 * `accessToken` n'existe que pour le banc de conformité (authentification simulée) : une vraie
 * application obtiendrait sa session par Supabase Auth. Sa présence ne prouve rien sur Auth.
 */
export type PublicConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  syncUrl: string;
  environment: string;
  accessToken?: string;
};

export async function loadConfig(): Promise<PublicConfig> {
  try {
    const r = await fetch("/config.json", { cache: "no-store" });
    if (r.ok) return (await r.json()) as PublicConfig;
  } catch {
    // pas de config.json : repli build-time
  }
  return {
    supabaseUrl: import.meta.env.VITE_SUPABASE_URL ?? "",
    supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY ?? "",
    syncUrl: import.meta.env.VITE_SYNC_URL ?? "",
    environment: import.meta.env.MODE,
  };
}
