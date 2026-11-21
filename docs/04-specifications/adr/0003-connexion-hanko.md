# ADR 0003 — Fournisseur de connexion : Hanko Cloud

- Statut : accepté
- Date : 2026-11-20

## Contexte

ES02 impose une connexion par passkey. L'authentification managée de Neon n'en propose pas ([ADR 0002](0002-backend-neon.md)). Il faut un fournisseur externe dont les jetons (JWT) sont vérifiables par la Data API de Neon grâce à ses clés publiques (JWKS). Il n'y a qu'un seul utilisateur, donc les plafonds d'utilisateurs ne comptent pas.

## Options envisagées

Hanko Cloud (33/40), WorkOS AuthKit (32), Better Auth auto-hébergé (32), Descope (30), Clerk (29), Auth0 (27). Détail : [benchmark, fournisseur de connexion](../benchmark.md#fournisseur-de-connexion-avec-neon).

## Décision

**Hanko Cloud**, choisi par le développeur.

## Conséquences

| Positives | Négatives |
|---|---|
| Conçu d'abord pour les passkeys (ES02). | Petite entreprise : l'offre gratuite peut changer. |
| Open source et auto-hébergeable : en cas de changement d'offre, on peut l'héberger soi-même sans changer de solution. | Absent de la liste de Neon : configuration JWKS générique, à valider au sprint 0. |
| Composants web utilisables avec Svelte. | Un service tiers de plus dans la chaîne de connexion. |
| — | Projet gratuit mis en pause après une période d'inactivité, réveillé automatiquement à la première requête : la première connexion après une longue pause est plus lente ([S3](../contraintes-techniques.md)). |

À vérifier au sprint 0 : que l'inscription publique peut être fermée (ES01) et que les sessions peuvent être révoquées (ES03).
