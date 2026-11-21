# ADR 0018 — Rôles et règles d'accès : sauvegarde et paramètres

- Statut : accepté
- Date : 2026-11-21

## Contexte

L'accès aux données (S11) repose sur des règles RLS qui ne laissent passer que le propriétaire connecté (ES04). Deux cas sortaient de ce cadre :
- le **Worker de sauvegarde** lit les données sans jeton Hanko, avec un rôle en lecture seule ([ADR 0009](0009-sauvegarde-cloudflare-worker-r2.md)) ;
- **`save_settings`** applique « la modification la plus récente gagne » ([ADR 0012](0012-conflits-parametres-heure-appareil.md)), mais avec les droits de l'appelant, l'application pourrait aussi écrire directement dans `accounts` et `discipline_settings` et contourner cette règle.

Détail : [accès aux données](../acces.md).

## Options envisagées

### Accès du Worker de sauvegarde

| Option | Points forts | Points faibles |
|---|---|---|
| **Règles dédiées** | RLS reste actif pour tous les rôles, et chaque accès est écrit. | Une règle de plus par table, à ne pas oublier quand une table s'ajoute. |
| **Rôle qui ignore RLS** (`BYPASSRLS`) | Rien à ajouter table par table. | RLS ne protège plus rien pour ce rôle : seuls ses droits de lecture le limitent. |

### Écriture des paramètres

| Option | Points forts | Points faibles |
|---|---|---|
| **Fonction propriétaire** (`SECURITY DEFINER`) | Un seul chemin d'écriture, simple à tester. | La fonction contourne RLS et doit vérifier l'identité elle-même ; deux styles de fonctions coexistent. |
| **Déclencheur de garde** | RLS partout, même style que les essais. | Règle plus subtile à écrire et à tester. |
| **Accepter le risque** | Rien à ajouter. | La règle de l'ADR 0012 n'est pas garantie par la base. |

## Décision

Choix du développeur :
- le rôle **`backup_reader`** a ses **propres règles RLS**, en lecture seule, une par table, et uniquement le droit `SELECT` ;
- **`save_settings`** s'exécute avec les **droits du propriétaire** des tables (`SECURITY DEFINER`), avec un chemin de recherche fixé. L'application n'a **aucun droit d'écriture direct** sur `accounts` ni sur `discipline_settings`.

## Conséquences

| Positives | Négatives |
|---|---|
| Aucune table n'échappe à RLS, pour aucun rôle de l'application ou de la sauvegarde. | Chaque nouvelle table devra recevoir sa règle `_backup_read`, sinon elle ne sera pas sauvegardée. Le test « tables sans RLS » ne suffit pas : il faudra aussi vérifier que chaque table est lisible par `backup_reader`. |
| La règle « la plus récente gagne » est garantie par la base (testé : écriture directe refusée). | `save_settings` doit filtrer elle-même sur `auth.user_id()`, ce qu'elle fait ; toute évolution de la fonction doit garder ce filtre. |
| Une fuite du mot de passe de sauvegarde ne permet que la lecture. | `submit_trial` (droits de l'appelant) et `save_settings` (droits du propriétaire) ne suivent pas le même modèle : à savoir en relisant le code. |
