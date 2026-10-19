# Application synthétique de conformité Forge

Petite app Vite + React + Supabase, **entièrement fictive** : données inventées, aucun secret, aucun client réel. Elle sert de terrain aux tests de l'adaptateur `web-vite-react-supabase` (F-08) et, au lot F-10, aux défauts injectés que le gate doit refuser.

La configuration publique est chargée à l'exécution depuis `/config.json` (même paquet front dans tous les environnements) ; `.env.example` ne contient que des noms.

## Comportements couverts par le banc Forge (F-10)

- **Création / lecture** d'un client (nom, champ X), visible uniquement par son propriétaire (`supabase/access-contract.json`, vérifié par des connexions non propriétaires).
- **Synchronisation** vers le service externe Y : succès, erreur affichée, reprise **avec la même clé d'idempotence** (jamais deux objets chez Y pour une reprise).
- **Migrations** : invariants de `supabase/schema-contract.json` et conservation des données semées avant la dernière migration ; **restauration** `pg_dump`/`pg_restore` puis mêmes assertions.
- **Frontière d'URL** : la preview ne référence que les services du banc ; toute URL hors liste est un défaut.

L'authentification est **simulée** par le banc (jeton fourni dans `config.json`) : rien ici ne prouve Supabase Auth ni PostgREST réels. Les défauts que le banc doit refuser vivent dans `conformance/defects/`.
