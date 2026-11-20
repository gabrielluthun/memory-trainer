# ADR 0002 — Backend et base : Neon

- Statut : accepté
- Date : 2026-11-20

## Contexte

Il faut une base relationnelle (MPD en SQL), gratuite dans la durée (ENF06, R4), avec des règles d'accès appliquées dans la base (STRAT01, ES04). Le développeur fait des pauses de plusieurs semaines (persona, contexte C-A) : le service ne doit pas se suspendre pendant ces pauses.

## Options envisagées

Neon (33/40), Supabase (30), Cloudflare Workers + D1 (29), Firebase (25), PocketBase (24), Convex (24), InstantDB (23), Appwrite (20). Détail : [benchmark, section 3](../benchmark.md#3-backend-et-base-de-données).

## Décision

**Neon** : PostgreSQL, avec sa **Data API**, qui applique les règles d'accès (RLS) de la base. La connexion est confiée à un fournisseur externe ([ADR 0003](0003-connexion-hanko.md)), car l'authentification managée de Neon n'a pas de passkey (ES02).

## Conséquences

| Positives | Négatives |
|---|---|
| Aucune suspension pour inactivité : le calcul se met en veille et se réveille à la requête suivante. | Petit délai sur la première requête après la veille. |
| PostgreSQL : MPD en SQL standard, et données faciles à exporter (ES18). | Data API récente (septembre 2026) : à surveiller. |
| 1 Go par projet : de nombreuses années de données. | Les briques sont séparées (base, API, connexion) : plus d'intégration à faire. |
| Les règles d'accès sont dans la base, quelle que soit la requête. | Les sauvegardes externes (ES17) restent à mettre en place. |

Les limites de l'offre gratuite sont détaillées dans les contraintes techniques (S3).
