# S11 — Accès aux données

Amont : [MPD](bdd/mpd.md), [dictionnaire de données](bdd/dictionnaire.md), [exigences de sécurité](../03-analyse-securite/exigences-securite.md), [architecture](architecture.md), [séquences](uml/sequences.md).

## En bref

- **Un seul rôle humain** : le pratiquant, propriétaire de ses données. En base, il agit par le rôle **`authenticated`** de la Data API, avec son jeton Hanko.
- **Quatre rôles en base** : `anonymous` (rien), `authenticated` (l'application), `backup_reader` (le Worker de sauvegarde, lecture seule) et le rôle de migration (la CI).
- **Tout est refusé par défaut** : RLS est actif sur les 6 tables, et aucun droit n'est donné sans être écrit ici (ES04).
- **L'application ne fait qu'insérer des essais et lire ses données.** Elle n'a aucun droit de modification ni de suppression. Ses paramètres ne s'écrivent que par `save_settings`.
- **Le Worker de sauvegarde lit tout, par ses propres règles RLS**, et ne peut rien écrire.
- Le SQL est dans `bdd/schema.sql` (section 8), ignoré par git. Il a été **testé sur PostgreSQL 16 : 31 cas, tous conformes** (section 6).
- Ces choix sont tracés dans l'[ADR 0018](adr/0018-roles-et-regles-acces.md).

## 1. Rôles

| Rôle | Qui l'utilise | Comment il se connecte | Ce qu'il peut faire |
|---|---|---|---|
| **anonymous** | Une requête à la Data API sans jeton | Data API de Neon | Rien |
| **authenticated** | L'application, pour le pratiquant connecté | Data API de Neon, avec le jeton Hanko vérifié (JWKS) | Lire ses données, envoyer ses essais et ses paramètres |
| **backup_reader** | Le Worker de sauvegarde (SEQ06) | Connexion directe à PostgreSQL, mot de passe dans les secrets du Worker | Tout lire, rien écrire |
| **Rôle de migration** | La CI (SEQ07) | Connexion directe, identifiants dans les secrets de la CI | Faire évoluer la structure. Propriétaire des tables. Ne peut quand même pas modifier un essai (déclencheur d'immuabilité) |

## 2. Matrice des droits

C = créer, L = lire, M = modifier, S = supprimer. « Ses lignes » = lignes dont le propriétaire est l'identité du jeton.

| Table | anonymous | authenticated | backup_reader |
|---|---|---|---|
| **accounts** | — | L (sa ligne) | L |
| **disciplines** | — | L (toutes) | L |
| **trials** | — | C, L (ses lignes) | L |
| **trial_items** | — | C, L (ses lignes) | L |
| **trial_items_numbers** | — | C, L (ses lignes) | L |
| **discipline_settings** | — | L (ses lignes) | L |

| Fonction | anonymous | authenticated | backup_reader |
|---|---|---|---|
| **submit_trial** | — | Exécuter | — |
| **save_settings** | — | Exécuter | — |

Aucun rôle n'a le droit **M** ni **S** sur une table d'essai. Les écritures sur `accounts` et `discipline_settings` passent uniquement par `save_settings`.

## 3. Règles RLS

| Règle | Table | Rôle | Action | Condition |
|---|---|---|---|---|
| **accounts_owner_read** | accounts | authenticated | Lire | `owner_id` = identité du jeton |
| **disciplines_read** | disciplines | authenticated | Lire | Toujours : données de référence, sans propriétaire |
| **trials_owner_read** | trials | authenticated | Lire | `owner_id` = identité du jeton |
| **trials_owner_insert** | trials | authenticated | Créer | `owner_id` = identité du jeton |
| **trial_items_owner_read** | trial_items | authenticated | Lire | L'essai de l'élément appartient à l'identité du jeton |
| **trial_items_owner_insert** | trial_items | authenticated | Créer | Même condition |
| **trial_items_numbers_owner_read** | trial_items_numbers | authenticated | Lire | Même condition |
| **trial_items_numbers_owner_insert** | trial_items_numbers | authenticated | Créer | Même condition |
| **discipline_settings_owner_read** | discipline_settings | authenticated | Lire | `owner_id` = identité du jeton |
| **…_backup_read** (une par table) | Les 6 tables | backup_reader | Lire | Toujours |

Les tables d'éléments n'ont pas de colonne `owner_id` : leurs règles vérifient le propriétaire **de l'essai** (MLD, point ouvert fermé ici).

## 4. Fonctions

| Fonction | S'exécute avec | Pourquoi | Garde-fous |
|---|---|---|---|
| **submit_trial** | Les droits de l'appelant (`SECURITY INVOKER`) | Les règles RLS s'appliquent aussi pendant l'envoi ([ADR 0010](adr/0010-envoi-essai-fonction-sql.md)) | Déclencheurs différés : un essai écrit sans la fonction est contrôlé de la même façon ([ADR 0017](adr/0017-integrite-base-donnees.md)) |
| **save_settings** | Les droits du propriétaire des tables (`SECURITY DEFINER`) | C'est le seul chemin d'écriture des paramètres : la règle « la plus récente gagne » ne peut pas être contournée ([ADR 0012](adr/0012-conflits-parametres-heure-appareil.md)) | Ne touche que la ligne de l'identité du jeton. Chemin de recherche fixé (`search_path`), pour qu'aucun objet piégé ne soit appelé à sa place |

Les fonctions sont créées exécutables par tous, par défaut, dans PostgreSQL. Ce droit est retiré à tous, puis donné uniquement à `authenticated`, fonction par fonction.

## 5. Ce que peut faire chaque rôle, en clair

| Situation | Ce qui se passe |
|---|---|
| Quelqu'un appelle la Data API sans jeton | Tout est refusé : `anonymous` n'a aucun droit (ES04) |
| Un inconnu crée un compte Hanko et appelle la Data API | Il ne voit rien (RLS). Ses envois sont refusés : son identité n'existe pas dans `accounts` (ES01) |
| L'application tente d'écrire un essai pour un autre compte | Refusé par la règle `trials_owner_insert` |
| L'application tente de modifier ou de supprimer un essai | Refusé : aucun droit, et le déclencheur d'immuabilité en plus (ES05) |
| L'application écrit ses paramètres directement, sans `save_settings` | Refusé : aucun droit d'écriture sur ces tables |
| Le mot de passe du Worker fuit | L'attaquant peut tout **lire**, mais rien modifier ni effacer. Parade : changer le mot de passe (SE4) |
| Une migration tente de modifier un essai par erreur | Refusé par le déclencheur d'immuabilité, même pour le propriétaire des tables |

## 6. Tests

Exécutés le 2026-11-21 sur **PostgreSQL 16.4** (PGlite), avec les vrais rôles et une fonction `auth.user_id()` simulée. Deux comptes de test (`owner-1`, `owner-2`) vérifient l'isolement par RLS seul.

| Cas | Résultat |
|---|---|
| Les 14 cas d'intégrité du [MPD](bdd/mpd.md#8-tests-du-script), rejoués avec le rôle `authenticated` | Tous conformes |
| `owner-1` lit les essais | Ne voit que les siens : 2 essais, 160 éléments |
| `owner-2` lit les essais | Ne voit que le sien : 1 essai |
| Identité inconnue lit les essais | 0 essai |
| `owner-1` insère un essai au nom de `owner-2` | Refusé par RLS |
| Écriture directe dans `accounts` ou `discipline_settings` | Refusée : pas de droit |
| `anonymous` lit les essais ou appelle `submit_trial` | Refusé : pas de droit |
| `backup_reader` lit les essais et les éléments | Voit tout : 3 essais, 240 chiffres |
| `backup_reader` écrit, ou appelle une fonction | Refusé : pas de droit |
| Tables sans RLS | Aucune |
| Fonctions exécutables par `anonymous` | Aucune |

Ces cas deviendront des tests automatiques de la CI (ES04 : « une requête sans connexion échoue sur chaque table, et un test liste les tables sans règle »).

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Rôles et schéma `auth` chez Neon** | Vérifier les noms `authenticated` et `anonymous`, et que `auth.user_id()` leur est bien accessible. | Sprint 0 |
| **Mot de passe de `backup_reader`** | Créé dans Neon, rangé dans les secrets du Worker, jamais dans le repo. Changement en cas de fuite. | Sprint 0, SE4 |
| **Nouvelle table à un lot suivant** | Chaque table devra avoir ses droits, ses règles pour `authenticated` et sa règle `_backup_read`. Le test « tables sans RLS » le rappellera. | Avant chaque lot |
