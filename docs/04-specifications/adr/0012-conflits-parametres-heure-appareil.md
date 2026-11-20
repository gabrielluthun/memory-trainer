# ADR 0012 — Conflits sur les paramètres : heure de l'appareil

- Statut : accepté
- Date : 2026-11-20

## Contexte

Les paramètres (langue de l'interface, taille des groupes) sont synchronisés entre les appareils et restent modifiables. En cas de modification sur deux appareils, **la dernière modification l'emporte** (décision CU15). Il faut choisir l'horloge qui décide de la « dernière ». L'[ADR 0004](0004-hors-ligne-sur-mesure-dexie.md) prévoyait déjà ce principe pour les données modifiables. Flux détaillé : [SEQ05](../uml/sequences.md#5-seq05--synchronisation).

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **Heure de l'appareil** où la modification a été faite | Respecte l'ordre réel des actions, même hors ligne. | Une horloge d'appareil mal réglée peut faire gagner une modification plus ancienne. |
| **Heure de réception** par la base | Une seule horloge, fiable. | Une ancienne modification faite hors ligne, envoyée plus tard, écrase une modification plus récente faite sur un autre appareil. |

## Décision

Chaque modification des paramètres porte **l'heure de l'appareil** où elle a été faite. La base ne remplace les paramètres que si l'heure reçue est plus récente que celle qu'elle a. L'appareil fait de même à la réception. Choix du développeur.

## Conséquences

| Positives | Négatives |
|---|---|
| Une modification faite hors ligne garde sa place dans l'ordre réel. | Dépend de l'heure des appareils, en général réglée automatiquement par le système. |
| Règle simple, appliquée de la même façon dans la base et sur l'appareil. | Les deux côtés doivent être testés : une modification plus ancienne ne remplace jamais une plus récente. |
| Réutilisable pour les systèmes d'images (lot 5), si le même besoin se présente. | Les paramètres sont gardés en entier : deux réglages différents changés sur deux appareils ne se combinent pas, le plus récent remplace tout. |
