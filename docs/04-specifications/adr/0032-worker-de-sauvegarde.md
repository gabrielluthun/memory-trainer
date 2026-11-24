# ADR 0032 — Worker de sauvegarde : déploiement, accès à la base, surveillance

- Statut : accepté
- Date : 2026-11-24

## Contexte

Le Worker exporte chaque jour les nouveaux essais vers R2 ([ADR 0009](0009-sauvegarde-cloudflare-worker-r2.md), SEQ06). Trois points restaient ouverts au moment de le coder :
- comment il est déployé, sachant que le poste du développeur n'a aucun identifiant de production ([surface d'attaque](../../05-securite/surface-attaque.md)) ;
- comment il lit la base, avec le rôle `backup_reader` en lecture seule ;
- comment savoir qu'il a échoué : l'offre gratuite de Cloudflare n'envoie **aucun e-mail** quand une tâche planifiée échoue. Elle garde seulement l'historique des 100 dernières exécutions.

## Options envisagées

**Déploiement**

| Option | Points forts | Points faibles |
|---|---|---|
| **Par notre CI** (Wrangler) | Un seul chemin de mise en production, depuis `main`, après les contrôles | Le jeton Cloudflare de la CI peut aussi modifier les Workers |
| **Workers Builds** (Cloudflare déploie depuis le dépôt) | Aucun jeton de plus dans GitHub | Second chemin de mise en production, hors de la CI |
| **À la main, dans la console** | Aucun jeton ni automatisation | Code déployé différent du dépôt ; pas de dépendance npm |

**Accès à la base**

| Option | Points forts | Points faibles |
|---|---|---|
| **Pilote Neon en HTTP** (`@neondatabase/serverless`) | Simple, rien à configurer chez Cloudflare | Pas de transaction entre deux lectures |
| **Hyperdrive** | Recommandé par Cloudflare, pilote PostgreSQL classique | Un service de plus, inutile pour une exécution par jour |

**Surveillance**

| Option | Points forts | Points faibles |
|---|---|---|
| **Vérification à la main** | Aucun service de plus | Un échec peut passer inaperçu |
| **Service de battement externe** | Alerte automatique | Un fournisseur de plus |
| **Date de sauvegarde affichée dans l'application** | Visible à chaque séance | Le Worker devrait écrire en base (ES11) |

## Décision

Choix du développeur :
- **Déploiement par notre CI** : une étape de la mise en production, après la publication du site.
- **Pilote Neon en HTTP**.
- **Vérification à la main** de l'historique des exécutions dans la console Cloudflare, **à chaque lot** (avec le test de restauration) et à chaque reprise du projet.
- **Secret dans GitHub**, poussé au Worker par la CI à chaque déploiement.

Mise en œuvre :

| Réglage | Valeur | Pourquoi |
|---|---|---|
| **Heure** | Chaque jour à 3 h UTC | Hors des séances |
| **Document JSON** | Construit **par PostgreSQL**, transmis tel quel à R2 | 10 ms de calcul par exécution : le Worker ne parcourt pas les essais |
| **Contenu** | Lignes brutes de chaque table, **numéro d'ordre compris** ; paramètres en entier | Une restauration doit garder les numéros ([ADR 0011](0011-repere-numero-ordre-verrou.md)) |
| **Essais par exécution** | Au plus **100** | Un lot trop gros dépasserait les 10 ms, et le Worker retenterait le même lot chaque jour sans jamais avancer |
| **Nom du fichier** | `daily/<date>_after-<repère>.json` | Deux exécutions le même jour n'écrasent jamais d'autres essais |
| **Un fichier chaque jour**, même sans nouvel essai | Paramètres du jour | Rend la vérification à la main immédiate : un fichier par jour dans R2 |
| **Accès à R2** | Liaison (binding) du Worker au bucket, sans clé | Aucun jeton R2 dans les secrets du Worker |
| **Secret du Worker** | Adresse de la base avec `backup_reader`, rangée dans l'environnement `production` de GitHub (`BACKUP_DATABASE_URL`), envoyée par `wrangler secret put` | Tous les secrets de production au même endroit ; un changement passe par la CI |

## Conséquences

| Positives | Négatives |
|---|---|
| Le Worker part avec chaque release, comme le site et les migrations. | Le jeton Cloudflare de la CI est élargi aux Workers. |
| Le mot de passe de `backup_reader` se change par la CI, comme les autres secrets. | Une copie de plus du mot de passe, dans GitHub (environnement `production`). |
| Un retard se rattrape seul, à 100 essais par jour. | Plus de 100 essais en un jour attendent le lendemain (sans perte). |
| Aucun service de plus. | Un échec peut rester invisible jusqu'au lot suivant ; les essais restent dans Neon et sur les appareils en attendant. |
