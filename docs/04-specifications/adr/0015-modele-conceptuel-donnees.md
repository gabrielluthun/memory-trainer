# ADR 0015 — Modèle conceptuel : compte, discipline et éléments spécialisés

- Statut : accepté
- Date : 2026-11-20

## Contexte

Le MCD (S8) regroupe les données du [dictionnaire](../bdd/dictionnaire.md) en entités. Trois points de modélisation décident de la forme de la base et de son évolution : la place du propriétaire (les comptes vivent chez Hanko), celle de la discipline, et la façon d'accueillir les éléments typés de chaque discipline ([ADR 0014](0014-representation-donnees-essai.md)). Détail : [MCD](../bdd/mcd.md).

## Options envisagées

### Propriétaire

| Option | Points forts | Points faibles |
|---|---|---|
| **Entité COMPTE** | MCD Merise complet, et une clé étrangère garantit que chaque essai a un propriétaire connu. | Une table d'une seule ligne, à remplir à la création du compte. |
| **Simple donnée `owner_id`** | Plus simple, rien à créer côté base. | Moins conforme à Merise, et aucune clé étrangère ne contrôle le propriétaire. |

### Discipline

| Option | Points forts | Points faibles |
|---|---|---|
| **Entité DISCIPLINE** | Modèle Merise naturel : les réglages par discipline deviennent une association qui porte ses données. Une discipline s'ajoute par une ligne. | Une table de référence de plus. |
| **Liste de valeurs** | Moins de tables. | La liste change par migration à chaque lot, et les réglages ne sont pas reliés à une entité. |

### Éléments typés par discipline

| Option | Points forts | Points faibles |
|---|---|---|
| **Spécialisation** | Chaque discipline a ses propres données et contrôles, sans colonnes vides. | Une jointure de plus pour lire un élément, et une sous-entité à ajouter par lot. |
| **Entité unique** | Lecture directe, modèle simple au lot 1. | Beaucoup de données vides au fil des lots, et des contrôles plus compliqués. |

## Décision

Choix du développeur :
- une **entité COMPTE**, identifiée par l'identifiant Hanko, qui porte aussi les paramètres généraux ;
- une **entité DISCIPLINE**, et une association **RÉGLER** entre COMPTE et DISCIPLINE qui porte la taille des groupes et les pauses ;
- une entité **ÉLÉMENT** pour ce qui est commun, **spécialisée** par discipline : ÉLÉMENT_NUMBERS au lot 1, avec la contrainte XT (chaque élément appartient à une seule sous-entité).

## Conséquences

| Positives | Négatives |
|---|---|
| Un essai ne peut pas exister sans compte ni sans discipline connue. | La ligne COMPTE doit être créée en même temps que le compte Hanko (point ouvert, S10). |
| Ajouter une discipline revient à ajouter une ligne DISCIPLINE et une sous-entité, sans toucher aux autres. | Chaque discipline demande sa migration (déjà accepté dans l'ADR 0014). |
| Les contrôles d'une discipline (un chiffre de 0 à 9) restent dans sa propre sous-entité. | Chaque chiffre occupe deux lignes : environ 14 Ko par essai au lieu de 12 Ko (S3), sans effet sur la marge de stockage. |
