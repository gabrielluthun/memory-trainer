# ADR 0014 — Représentation des données d'un essai

- Statut : accepté
- Date : 2026-11-20

## Contexte

Le dictionnaire de données (S7) doit fixer comment sont représentés, dans Neon, la valeur des éléments et des réponses, les résultats d'un essai et sa date. Ces choix décident du MCD (S8), des contrôles de la base (ES07) et de l'évolution du schéma quand arriveront Cards, Images, Words et Names (lots 2 et 3). Détail : [dictionnaire de données](../bdd/dictionnaire.md).

## Options envisagées

### Valeur d'un élément et d'une réponse

| Option | Points forts | Points faibles |
|---|---|---|
| **Texte générique** | Aucun changement de structure aux lots 2 et 3. | La base contrôle moins bien le contenu : il faut un contrôle par discipline. |
| **Typé par discipline** | La base refuse toute valeur impossible (ES07). | La structure change à chaque nouvelle discipline, avec une migration par lot. |

### Résultats d'un essai

| Option | Points forts | Points faibles |
|---|---|---|
| **Stockés et contrôlés** | Lecture directe pour l'historique et les statistiques. RG19 conserve le résultat par élément. | Une information en double, gardée cohérente par un contrôle. |
| **Recalculés à la lecture** | Aucune donnée en double. | Règle de correction appliquée partout où on lit, et plus délicate pour Names (RG14). |

### Date d'un essai

| Option | Points forts | Points faibles |
|---|---|---|
| **Instant + décalage horaire** | On retrouve toujours le jour et l'heure locaux de l'essai. | Une donnée de plus. |
| **Instant seulement** | Plus simple. | Un essai fait dans un autre fuseau peut changer de jour dans les statistiques. |

## Décision

Choix du développeur :
- les valeurs sont **typées par discipline** : au lot 1, un chiffre montré ou répondu est un entier de 0 à 9 ;
- le résultat par élément et le score sont **stockés**, et la base vérifie qu'ils sont cohérents avec les éléments ;
- la date d'un essai est un **instant en heure universelle**, affiché dans le fuseau actuel de l'appareil.

## Conséquences

| Positives | Négatives |
|---|---|
| Une valeur impossible (un chiffre « 12 ») est refusée par la base, même si l'application a un défaut. | Chaque nouvelle discipline demande une migration du schéma, testée et appliquée par la CI (ES19). |
| L'historique et les statistiques lisent les résultats sans les recalculer. | Les contrôles de cohérence (score, élément juste) sont à écrire et à tester dans la base. |
| Une seule date à gérer. | Les statistiques par jour (lot 4) utiliseront le fuseau actuel de l'appareil : un essai fait en voyage peut changer de jour. |
