# ADR 0026 — Traduction de l'interface avec Paraglide JS

- Statut : accepté
- Date : 2026-11-22

## Contexte

L'interface doit exister en français et en anglais (EF20, ENF05, US19). Le changement de langue doit se faire sans recharger les données. L'application fonctionne hors ligne ([ADR 0004](0004-hors-ligne-sur-mesure-dexie.md)) : les textes doivent être disponibles sans réseau. Chaque dépendance doit être justifiée (ES14).

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **Paraglide JS** | Module officiel proposé par SvelteKit ; messages vérifiés par TypeScript ; seuls les textes utilisés sont livrés ; inclus dans le build, donc disponible hors ligne | Une étape de génération ; deux paquets de plus |
| **Dictionnaire maison** | Aucune dépendance ; suffisant pour une centaine de libellés | Pluriels et formats à gérer soi-même |
| **svelte-i18n** | Très répandu ; pluriels et formats ICU | Conçu à l'époque de Svelte 4 ; traductions chargées à l'exécution ; moins de vérification de types |

## Décision

**Paraglide JS.** Choix du développeur. Il est installé avec la user story US19 (Choisir la langue de l'interface). D'ici là, les quelques textes des premiers écrans sont écrits directement, puis migrés vers Paraglide à US19.

## Conséquences

| Positives | Négatives |
|---|---|
| Un message manquant ou mal nommé est une erreur de compilation, vue par la CI. | Les fichiers générés par Paraglide doivent être exclus du lint et du formatage. |
| Les textes font partie du build : rien à charger, hors ligne compris. | Deux dépendances de plus à surveiller (Dependabot). |
| Le choix de la langue reste dans les paramètres synchronisés (CU15). | Les textes des premiers écrans, écrits avant US19, sont à migrer. |
