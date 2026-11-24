# ADR 0008 — Service worker : vite-plugin-pwa

- Statut : accepté
- Date : 2026-11-20

## Contexte

Pour démarrer sans réseau (ENF02), l'application doit être mise en cache par un service worker, et décrite par un manifeste pour être installable (EF22).

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **vite-plugin-pwa (Workbox)** | Génère le service worker et le manifeste. Intégration SvelteKit. Stratégies de cache éprouvées. | Une dépendance de plus (Workbox). Configuration parfois opaque. |
| **Service worker écrit à la main** | Aucune dépendance, contrôle total. SvelteKit fournit la liste des fichiers. | Mise à jour du cache et cas limites à coder et à tester soi-même. |

## Décision

**vite-plugin-pwa**, avec son intégration SvelteKit, choisi par le développeur.

## Conséquences

| Positives | Négatives |
|---|---|
| Cache et mises à jour gérés par Workbox, largement utilisé. | Dépendance supplémentaire à surveiller (ES14). |
| Manifeste PWA généré : installation sur téléphone, tablette et ordinateur. | Le comportement du cache doit être compris pour éviter de servir une ancienne version. |

## Mise en œuvre (US20)

L'intégration SvelteKit a été réécrite pour SvelteKit 3 : c'est **@vite-pwa/sveltekit 2**, qui s'appuie sur **@unplugin-pwa** et remplace le plugin `sveltekit()` par `withPwa()`. Le choix est maintenu par le développeur, en connaissance de cette refonte récente.

| Réglage | Valeur | Pourquoi |
|---|---|---|
| **Génération** | `generateSW` (Workbox) | Aucun code de service worker à écrire |
| **Fichiers en cache** | Ceux du build client : scripts, styles, polices, icônes, manifeste | Jamais une réponse de la Data API ni de Hanko ([sécurité du front](../../05-securite/front.md)) |
| **Page de l'application** | Gardée sous `/`, servie pour toute adresse ouverte hors ligne | L'hébergement ne sert pas `/index.html` |
| **Nouvelle version** | Mode `prompt` : elle attend le pratiquant | Jamais appliquée pendant un essai ([déploiement](../../06-qualite-deploiement/deploiement.md), section 5) |
| **Manifeste** | Généré ; lien et icône d'iPhone ajoutés à la page | L'intégration ne les insère pas elle-même |
| **Icônes** | PNG produits une fois depuis le logo, rangés dans `static/icons/` | Aucun outil de plus |
