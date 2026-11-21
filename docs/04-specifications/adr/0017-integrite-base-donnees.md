# ADR 0017 — Intégrité de la base : déclencheurs, ENUM, compte et immuabilité

- Statut : accepté
- Date : 2026-11-20

## Contexte

Le MPD (S10) fixe comment la base garantit ses règles. Quatre points restaient ouverts :
- la fonction d'envoi s'exécute avec les droits de l'appelant ([ADR 0010](0010-envoi-essai-fonction-sql.md)), qui peut donc aussi écrire directement dans les tables. Où placer les contrôles qui portent sur un essai entier ?
- comment contraindre les listes de valeurs ?
- comment créer la ligne du compte autorisé sans mettre d'identifiant réel dans le repo public ?
- comment rendre les essais immuables (RG18, ES05) ?

Détail : [MPD](../bdd/mpd.md).

## Options envisagées

### Contrôles sur plusieurs lignes

| Option | Points forts | Points faibles |
|---|---|---|
| **Déclencheurs différés** | ADR 0010 inchangé, RLS s'applique partout, aucune voie de contournement. | Déclencheurs plus complexes à écrire et à tester. |
| **Fonction seule (SECURITY DEFINER)** | Un seul point d'entrée, tous les contrôles au même endroit. | La fonction contourne RLS et doit vérifier l'identité elle-même ; ADR 0010 et SEQ05 à revalider. |

### Listes de valeurs

| Option | Points forts | Points faibles |
|---|---|---|
| **Contraintes CHECK** | Simple, une valeur s'ajoute en modifiant la contrainte. | Liste répétée si plusieurs colonnes l'utilisent. |
| **Types ENUM** | Type réutilisable, lisible. | Retirer ou renommer une valeur est difficile. |

### Création du compte autorisé

| Option | Points forts | Points faibles |
|---|---|---|
| **Secret de la CI** | Rien de personnel dans le repo public (ES10). | Une étape de plus dans la CI, identifiant à configurer par environnement. |
| **Dans une migration** | Simple, versionné. | Identifiant réel visible publiquement. |

### Immuabilité

| Option | Points forts | Points faibles |
|---|---|---|
| **Droits + déclencheur** | Défense en profondeur : même une erreur de migration ne peut rien effacer. | Une vraie correction exige une migration dédiée qui désactive le déclencheur. |
| **Droits seulement** | Simple. | Le rôle de migration ou le propriétaire peut encore modifier un essai par erreur. |

## Décision

Choix du développeur :
- les contrôles sur un essai entier sont des **déclencheurs différés**, vérifiés à la fin de chaque transaction ;
- les listes de valeurs sont des **types ENUM** (`trial_mode`, `trial_status`, `interface_language`) ;
- la ligne du compte est créée par une **migration de la CI**, avec l'identifiant Hanko tiré d'un **secret GitHub** ;
- les essais sont protégés par les **droits** et par un **déclencheur** qui refuse toute modification, suppression ou vidage, quel que soit le rôle.

## Conséquences

| Positives | Négatives |
|---|---|
| Un essai incohérent est refusé, qu'il passe par la fonction ou non (testé : 14 cas sur PostgreSQL 16). | Chaque nouvelle discipline doit ajouter sa sous-table au déclencheur de contrôle. |
| Aucune donnée réelle dans le repo public. | Le secret du compte doit exister dans chaque environnement (dev, prod). |
| Aucun rôle ne peut effacer un essai par erreur. | Une correction de données passe par une migration dédiée, relue. |
| Les valeurs autorisées sont lisibles dans le schéma. | Retirer une valeur d'un type ENUM demande de recréer le type. |
