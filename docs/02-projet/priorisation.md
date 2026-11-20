# P3 — Priorisation MoSCoW

Amont : [user stories](../01-besoin/user-stories.md), [périmètre et lots](perimetre.md), [objectifs](objectifs.md).

Toutes les user stories font partie de la v1 ([P2](perimetre.md)). La priorisation sert d'**arbitrage si le temps manque** : on reporte d'abord les **Could**, puis les **Should** ; les **Must** ne se négocient pas.

| Priorité | User stories | Justification |
|---|---|---|
| **Must** | US01 Numbers, US02 Cards, US03 Images, US04 Words, US07 Navigation et chronomètre, US08 Saisie du rappel, US09 Mode personnalisé, US11 Détail d'un essai, US12 Historique, US20 Hors ligne, US21 Multi-appareils | Le cœur de l'entraînement au format Memory League. Le mode personnalisé permet de progresser par paliers ; le hors-ligne et le multi-appareils sont des exigences fortes (ENF02, ENF03). |
| **Should** | US05 Names, US06 International Names, US10 Abandon, US13 Progression, US15 Analyse des erreurs, US16 Gérer mes systèmes, US18 Erreurs → images | Importantes : les courbes de progression portent l'objectif O1, et l'analyse des erreurs reliée aux systèmes est une raison d'être du projet (B1). |
| **Could** | US14 Points IAM, US17 Réviser mes systèmes, US19 Interface FR/EN | Utiles mais secondaires : les points IAM servent seulement aux statistiques. |
| **Won't** | Autres épreuves IAM, multi-utilisateurs, match contre soi-même, palais mentaux | Hors périmètre ([P2](perimetre.md#hors-périmètre)). |

## Cohérence avec les lots

L'ordre des lots suit surtout la logique technique (socle d'abord, disciplines, puis fonctions annexes), pas strictement la priorité. Conséquences en cas de manque de temps :
- **Lot 1** : US19 (Could) et US10 (Should) peuvent être reportées sans bloquer la version 0.1. L'interface reste alors en français seulement, mais **aucun texte n'est écrit en dur** (ENF05), pour que l'anglais s'ajoute sans reprise.
- **Lot 5** : US17 (Could) peut être reportée ; US16 et US18 (Should) restent.
- **Lot 6** : entièrement Could ; la v1.0 peut être déclarée sans lui si le développeur le décide.
