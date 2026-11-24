# ADR 0023 — Compatibilité entre les versions de l'application

- Statut : accepté
- Date : 2026-11-21

## Contexte

L'application fonctionne hors ligne ([ADR 0004](0004-hors-ligne-sur-mesure-dexie.md)). Un appareil resté longtemps sans réseau garde l'ancienne version et des essais en attente d'envoi, à l'ancien format. Pendant ce temps, une nouvelle version a pu changer la base et la fonction d'envoi `submit_trial` ([ADR 0010](0010-envoi-essai-fonction-sql.md)). Deux questions étaient ouvertes dans les [séquences](../uml/sequences.md) :
- comment la base reçoit les essais d'une ancienne version ;
- comment une nouvelle version s'installe, sachant qu'elle ne doit **jamais** l'être pendant un essai.

## Options envisagées

**Compatibilité de l'envoi**

| Option | Points forts | Points faibles |
|---|---|---|
| **Rétrocompatible** | Simple, un seul nom de fonction | La fonction s'alourdit au fil des lots ; un vrai changement de format reste impossible |
| **Fonction versionnée** | Changements libres, ancienne version intacte | Plusieurs fonctions à tester et à protéger ; leur retrait est à décider |
| **Mise à jour d'abord** | Une seule fonction en base, au format courant | Conversion locale à écrire et à tester à chaque changement de format |

**Installation d'une nouvelle version**

| Option | Points forts | Points faibles |
|---|---|---|
| **Bandeau hors essai** | Le pratiquant choisit le moment | Une ancienne version peut rester longtemps si le bandeau est ignoré |
| **Automatique à l'accueil** | Toujours à jour, rien à faire | Rechargement surprise juste avant un essai |
| **À la prochaine ouverture** | Aucun rechargement en cours d'usage | Sur mobile, une application restée ouverte peut garder l'ancienne version des jours |

## Décision

Choix du développeur :
- **Mise à jour d'abord** : la base n'accepte que le format courant. L'appareil installe la nouvelle version, sa base locale convertit la file d'envoi, puis il synchronise.
- **Bandeau hors essai** : « Nouvelle version disponible », avec un bouton, jamais affiché pendant un essai.

Les deux choix se tiennent : tant que le bandeau est ignoré, la synchronisation attend. L'appareil sait qu'il est périmé en comparant sa version à celle du site publié, avant chaque synchronisation ([déploiement](../../06-qualite-deploiement/deploiement.md), section 5).

## Conséquences

| Positives | Négatives |
|---|---|
| Une seule fonction d'envoi en base, toujours au format courant. | Chaque changement de format d'un essai arrive avec sa conversion Dexie.js et son test. |
| Aucun essai valide n'est refusé à cause de sa version : un ancien format n'atteint jamais la base. | Tant que la mise à jour n'est pas faite, les essais ne sont pas synchronisés (ils restent sur l'appareil, sans perte). |
| Jamais de rechargement pendant un essai. | Un appareil ne se met à jour que si le pratiquant clique sur le bandeau. |
| La migration de la base et la nouvelle version partent ensemble, dans la même mise en production. | Le fichier de version doit être exclu du cache du service worker. |

## Mise en œuvre (US20)

Choix du développeur, au moment de coder la mise à jour :

| Réglage | Valeur | Pourquoi |
|---|---|---|
| **Version comparée** | Celle de `package.json` (0.1.0, 0.2.0…), injectée au build et publiée dans `version.json` | Lisible, suit les releases et les tags. La synchronisation attend aussi après une release qui ne change pas le format : c'est accepté. |
| **Version publiée illisible** | La synchronisation s'arrête avant tout envoi | Un essai n'est jamais envoyé sans savoir si l'appareil est à jour. |
| **Message** | Un **encart** en bas de l'écran, hors essai, avec « Mettre à jour » | Ne décale pas le contenu. Pendant l'attente, la pastille de synchronisation l'indique aussi. |
| **Fermeture** | Une croix ferme l'encart jusqu'à la prochaine ouverture | Le pratiquant choisit son moment ; la pastille rappelle que la synchronisation attend. |
| **Autres fenêtres** | Une version installée depuis une autre fenêtre recharge celle-ci **seulement quand aucun essai n'y est en cours** | Le service worker recharge sinon toutes les fenêtres ouvertes, même en plein essai. |
