# ADR 0028 — Derniers réglages de lancement

- Statut : accepté
- Date : 2026-11-24

## Contexte

US09 ajoute le mode personnalisé : le pratiquant règle le nombre d'éléments et la durée de mémorisation (RG15), de 1 à 500 éléments et de 1 s à 1 h ([dictionnaire](../bdd/dictionnaire.md)). Pour progresser par paliers, il relance souvent le même réglage, un peu modifié. Les pauses, elles, reprennent déjà les dernières valeurs de l'épreuve, gardées avec les paramètres et synchronisées (RG25, [ADR 0012](0012-conflits-parametres-heure-appareil.md)).

Restait à décider ce que l'écran de lancement propose pour le mode et pour les réglages du mode personnalisé.

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **Derniers réglages, synchronisés** (avec les paramètres) | Même comportement que les pauses, sur tous les appareils ; aucune ressaisie | Migration de `discipline_settings`, `save_settings` change de format, modèle de données à revalider |
| **Derniers réglages, appareil seul** (Dexie.js) | Aucun changement côté Neon | Deux comportements pour les réglages de lancement : pauses synchronisées, le reste non |
| **Rien de retenu** | Le plus simple | Ressaisie à chaque essai personnalisé |

## Décision

Choix du développeur : le **dernier mode**, le **nombre d'éléments** et la **durée de mémorisation** du mode personnalisé sont gardés **par discipline**, avec les pauses, dans `discipline_settings` (`launch_mode`, `custom_item_count`, `custom_memorization_s`), et synchronisés comme elles. Avant tout essai personnalisé, ils valent le **format standard** (80 chiffres, 1 minute pour Numbers). Ils sont enregistrés au lancement d'un essai, comme les pauses.

## Conséquences

| Positives | Négatives |
|---|---|
| Un palier se relance en un clic, sur n'importe quel appareil. | Une migration ajoute trois colonnes ; `save_settings` reçoit trois valeurs de plus par discipline. |
| Un seul endroit pour tous les réglages de lancement : pauses, mode, format personnalisé. | Les lignes déjà en base reçoivent le format standard et le mode « standard ». |
| La base contrôle les bornes (1 à 500 éléments, 1 à 3 600 s), comme pour les essais (ES07). | Les paramètres déjà enregistrés sur un appareil n'ont pas ces réglages : ils valent le format standard jusqu'au premier lancement. |
