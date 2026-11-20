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
