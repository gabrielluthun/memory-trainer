# ADR 0013 — Organisation du code métier

- Statut : accepté
- Date : 2026-11-20

## Contexte

L'architecture en couches est fixée (S2) : le domaine en TypeScript pur, l'horloge injectée. Il restait à décider comment écrire ce code : le style du domaine, la représentation des phases d'un essai (RG25, SEQ02), la préparation des disciplines des lots 2 et 3, et l'accès à Dexie.js, à la Data API et à Hanko. Ces choix fondent le [diagramme de classes](../uml/classes.md) et la stratégie de tests (Q1).

## Options envisagées

### Style du domaine

| Option | Points forts | Points faibles |
|---|---|---|
| **Classes avec méthodes** | Diagramme de classes naturel, l'objet protège ses règles (RG18). | Objets à convertir pour Dexie.js et le JSON, et les classes se marient moins bien avec la réactivité de Svelte. |
| **Types et fonctions pures** | Se stocke tel quel dans Dexie.js et en JSON, très facile à tester en TDD. | Rien n'empêche de modifier un champ à la main, et le diagramme montre des modules plutôt que des classes. |
| **Mixte** | Chaque forme là où elle sert. | Deux styles à connaître, et une frontière à tenir dans le temps. |

### Phases d'un essai

| Option | Points forts | Points faibles |
|---|---|---|
| **Machine à états explicite** | Une transition impossible est refusée dès la compilation, et chaque transition se teste une par une. | Plus de code au départ. |
| **Champ statut + contrôles** | Simple et court. | Une transition interdite n'est détectée qu'à l'exécution, si un test y pense. |

### Disciplines

| Option | Points forts | Points faibles |
|---|---|---|
| **Interface commune dès le lot 1** | Ajouter une discipline revient à ajouter une implémentation, sans toucher au reste. | Interface posée avant le 2e cas, peut-être à revoir au lot 2. |
| **Numbers seul, généraliser au lot 2** | Rien de spéculatif, code plus simple au lot 1. | Une réorganisation au lot 2, avec des tests à adapter. |

### Accès à l'infrastructure

| Option | Points forts | Points faibles |
|---|---|---|
| **Interfaces + adaptateurs** | Tests avec de faux dépôts en mémoire, et changer de service ne touche pas au métier. | Plus de fichiers, et du code pour tout assembler au démarrage. |
| **Imports directs** | Moins de code et de fichiers. | Les tests dépendent des détails d'implémentation, et changer de service modifie la couche Application. |

## Décision

Choix du développeur :
- le domaine est écrit en **classes avec méthodes** ;
- un essai est une **machine à états explicite** : une classe par phase, dont chaque transition renvoie un nouvel objet dans l'état suivant ;
- une **interface `Discipline`** existe dès le lot 1, et Numbers en est la première implémentation ;
- la couche Application ne dépend que d'**interfaces**, implémentées par des **adaptateurs** dans l'Infrastructure et assemblées au démarrage (`AppContainer`).

## Conséquences

| Positives | Négatives |
|---|---|
| Un essai ne peut pas sauter une phase : le compilateur l'interdit. | Un convertisseur (`TrialMapper`) est nécessaire entre les objets et Dexie.js ou le JSON, et doit être testé dans les deux sens. |
| Les règles et chaque transition se testent sans navigateur ni base (O3). | Le lien entre les cas d'usage et l'affichage Svelte reste à fixer au sprint 0. |
| Un service externe (Hanko, Neon) se remplace sans toucher au métier, ce qui limite R4. | L'interface `Discipline` sera relue avant le lot 2 (Cards et Images se saisissent autrement). |
| Les disciplines des lots 2 et 3 s'ajoutent sans modifier la machine à états. | Plus de fichiers dès le lot 1. |
