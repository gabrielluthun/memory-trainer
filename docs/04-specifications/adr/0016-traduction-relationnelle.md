# ADR 0016 — Traduction relationnelle du modèle de données

- Statut : accepté
- Date : 2026-11-20

## Contexte

Le MLD (S9) traduit le [MCD](../bdd/mcd.md) en tables. Trois points restaient à fixer : la traduction de la spécialisation des éléments ([ADR 0015](0015-modele-conceptuel-donnees.md)), la clé de la table des disciplines, et la forme des noms de tables. Détail : [MLD](../bdd/mld.md).

## Options envisagées

### Spécialisation des éléments

| Option | Points forts | Points faibles |
|---|---|---|
| **Une table par entité** | Règle Merise classique, fidèle au MCD, données communes écrites une seule fois. | Une jointure pour lire un élément complet, deux lignes par chiffre. |
| **Sous-tables seulement** | Une ligne par chiffre, aucune jointure, moins de place. | Données communes répétées dans chaque sous-table, analyse toutes disciplines plus lourde. |

### Clé des disciplines

| Option | Points forts | Points faibles |
|---|---|---|
| **Code texte** | Lisible partout, y compris dans les sauvegardes JSON. | Quelques octets de plus par essai. |
| **Numéro** | Clé plus courte. | Illisible sans jointure, et numéros à garder identiques dans toutes les bases. |

### Noms des tables

| Option | Points forts | Points faibles |
|---|---|---|
| **Singulier** | Même nom que l'entité et la classe. | — |
| **Pluriel** | Usage répandu avec PostgreSQL, URL de la Data API naturelles (`/trials`). | Le nom diffère de l'entité et de la classe. |

## Décision

Choix du développeur :
- **une table par entité**, y compris `trial_items` et `trial_items_numbers`, qui partagent la clé (`trial_id`, `position`) ;
- la clé de `disciplines` est son **code texte** (`numbers`) ;
- les noms de tables sont **au pluriel**, en anglais (P7).

## Conséquences

| Positives | Négatives |
|---|---|
| Le MLD suit le MCD sans écart : chaque entité a sa table. | Lire un élément Numbers demande de joindre `trial_items` et `trial_items_numbers`. |
| Une sauvegarde ou un essai se lit sans table de correspondance (`discipline = numbers`). | La règle « un élément a exactement une ligne de sous-table » se vérifie hors des clés étrangères (point ouvert, S10). |
| Les adresses de la Data API se lisent naturellement. | Les noms de tables (`trials`) diffèrent des classes (`Trial`) : correspondance à garder en tête. |
