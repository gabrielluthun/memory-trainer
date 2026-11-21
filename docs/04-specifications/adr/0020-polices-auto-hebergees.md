# ADR 0020 — Polices auto-hébergées

- Statut : accepté
- Date : 2026-11-21

## Contexte

Les [mock-ups](../maquettes/mockups.md) (S13) utilisent **Atkinson Hyperlegible** (interface et chiffres), choisie pour que les chiffres ne se confondent jamais, et **Kalam** (écriture manuscrite des corrections). Pour l'export des PNG, elles sont chargées depuis Google Fonts. Dans l'application, ce chargement serait contraire à trois exigences validées :
- **ES15** : aucun service tiers en dehors de l'hébergeur, de la base et de la connexion ;
- **ES13** : la politique de sécurité du contenu n'autorise que les éléments de l'application ;
- **ENF02** : l'application doit fonctionner hors ligne, polices comprises.

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **Polices auto-hébergées** | Aucun service tiers, CSP stricte, disponibles hors ligne, identité des mock-ups conservée | Environ 150 à 300 Ko de plus au premier chargement ; mises à jour des polices à faire soi-même |
| **Polices du système** | Rien à charger ni à maintenir | Perte de la lisibilité des chiffres et de l'écriture manuscrite ; mock-ups à refaire |
| **Google Fonts** | Aucun fichier à gérer | Contraire à ES15 et ES13 ; Google voit chaque visite ; polices absentes hors ligne au premier lancement |

## Décision

Les polices sont **auto-hébergées**. Choix du développeur. Les fichiers (format WOFF2, licence SIL Open Font License, qui autorise leur redistribution) sont livrés avec l'application, servis par Cloudflare Pages et mis en cache par le service worker ([ADR 0008](0008-service-worker-vite-plugin-pwa.md)). Google Fonts ne sert qu'à l'export des PNG des maquettes, jamais dans l'application.

## Conséquences

| Positives | Négatives |
|---|---|
| Aucune requête vers un tiers : ES15 respectée, CSP limitée à l'application (ES13). | Poids du premier chargement un peu plus élevé : ne garder que les graisses utilisées (normal, moyen, gras). |
| Les polices sont disponibles hors ligne dès la première visite mise en cache (ENF02). | Les nouvelles versions des polices sont à intégrer à la main. |
| Les écrans correspondent aux mock-ups. | La licence OFL doit être jointe aux fichiers des polices dans le repo. |
