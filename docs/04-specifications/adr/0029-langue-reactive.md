# ADR 0029 — Langue de l'interface réactive, copiée sur l'appareil

- Statut : accepté
- Date : 2026-11-24

## Contexte

US19 installe Paraglide JS ([ADR 0026](0026-traduction-paraglide.md)). Changer de langue doit traduire toute l'interface **sans recharger les données** (US19 CA1). Par défaut, Paraglide recharge la page quand la langue change.

La langue fait partie des paramètres, gardés dans IndexedDB et synchronisés ([ADR 0012](0012-conflits-parametres-heure-appareil.md)). Leur lecture à l'ouverture est **asynchrone** : pendant ce court instant, l'application ne connaît pas encore la langue choisie.

Restait à décider comment l'interface suit la langue, et quelle langue afficher avant la lecture des paramètres.

## Options envisagées

Suivre la langue :

| Option | Points forts | Points faibles |
|---|---|---|
| **Langue réactive** (rune Svelte lue par une stratégie personnalisée de Paraglide) | Seuls les textes changent ; l'état des écrans est gardé | Chaque texte doit être lu dans le gabarit, jamais copié une fois pour toutes |
| **Écran recréé** (`{#key}` autour des pages) | Très simple ; aucun texte oublié | L'état local de l'écran courant est perdu |
| **Rechargement** (comportement par défaut de Paraglide) | Rien à écrire | Recharge la page et les données : contraire à CA1 |

Avant la lecture des paramètres :

| Option | Points forts | Points faibles |
|---|---|---|
| **Copie dans `localStorage`** | Lue tout de suite : bonne langue dès le premier affichage | La même valeur à deux endroits |
| **Attendre les paramètres** | Une seule source | Écran vide à chaque ouverture |
| **Défaut puis bascule** | Rien à ajouter | Éclair de français à chaque ouverture en anglais |

## Décision

Choix du développeur :

- **langue réactive** : une rune contient la langue courante, et Paraglide la lit par une stratégie personnalisée. Aucun rechargement ;
- **copie dans `localStorage`** : la langue y est recopiée à chaque changement, et lue au démarrage. Les **paramètres restent la référence** : à leur lecture, et plus tard à leur synchronisation (US21), ils remplacent la copie ;
- **français par défaut** sur un appareil neuf, comme `Settings.defaults()` ;
- les **temps et les dates suivent la langue** : « 48,52 s » et « Aujourd'hui » en français, « 48.52 s » et « Today » en anglais (US19 CA2).

L'attribut `lang` de la page suit aussi la langue, pour les lecteurs d'écran.

## Conséquences

| Positives | Négatives |
|---|---|
| Changer de langue ne coupe rien, même pendant un essai. | Un texte calculé une seule fois dans un script resterait dans l'ancienne langue : les tests de composants le vérifient dans les deux langues. |
| La bonne langue dès le premier affichage, hors ligne compris. | Un nouveau stockage sur l'appareil, sans donnée sensible ([sécurité du front](../../05-securite/front.md)). |
| Les formats de temps et de dates reçoivent la langue en paramètre : testables sans navigateur. | Les fonctions de format changent de signature. |
