# ADR 0030 — Écran de connexion avec hanko-elements

- Statut : accepté
- Date : 2026-11-24

## Contexte

US21 demande de retrouver ses essais sur tous ses appareils, donc de se connecter (CU16). La connexion passe par Hanko ([ADR 0003](0003-connexion-hanko.md)), par passkey seule ([sécurité du back](../../05-securite/back.md)). La maquette 11 montre un seul bouton « Continuer avec une passkey » et un lien « Continuer hors connexion ».

Hanko propose deux paquets pour le navigateur. Restait à choisir lequel.

## Options envisagées

| Option | Points forts | Points faibles |
|---|---|---|
| **hanko-elements** (composant `<hanko-auth>` tout fait) | Parcours complet maintenu par Hanko : passkey, annulation, erreurs, nouvel appareil ; traduit en français et en anglais ; jeton en cookie réglable | Style et textes limités à ce que le composant permet ; affiche aussi les écrans que la console Hanko laisse actifs (code par e-mail tant qu'il n'est pas désactivé) |
| **hanko-frontend-sdk** seul (sans interface) | Écran fidèle à la maquette 11, textes dans Paraglide | Parcours passkey écrit à la main : défi, erreurs, annulation, nouvel appareil |

## Décision

**hanko-elements.** Choix du développeur.

- Le composant `<hanko-auth>` est placé dans l'écran de connexion de la maquette 11, sous le titre, avec le lien « Continuer hors connexion » en dessous.
- Sa langue suit celle de l'interface ([ADR 0029](0029-langue-reactive.md)).
- Le jeton reste dans un **cookie sécurisé** (`SameSite=Strict`), comme le fixe la [sécurité du back](../../05-securite/back.md).
- Les méthodes affichées sont celles de la console Hanko : passkey seule, une fois le code par e-mail désactivé après la première passkey.
- L'application écoute les événements de session du SDK inclus : `session-created` lance la synchronisation, `session-expired` la met en attente.

## Conséquences

| Positives | Négatives |
|---|---|
| Le parcours passkey, y compris le QR code pour un nouvel appareil, est celui de Hanko, déjà testé. | L'écran ne reproduit pas exactement la maquette 11 : le bouton est celui du composant, stylé par ses variables CSS. |
| Les messages d'erreur de Hanko sont traduits en français et en anglais. | Les textes du composant viennent de Hanko, pas de Paraglide. |
| Le SDK de Hanko est inclus : rien d'autre à installer pour lire la session. | Deux dépendances de plus à surveiller (le composant et le SDK), et Preact, sur lequel il est construit. |
