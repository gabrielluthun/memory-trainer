# Notes de version

Ce qui change pour le pratiquant, version par version. Chaque section est recopiée dans la release GitHub de la version.

## 0.1.0 — Socle et Numbers

Première version utilisable : la discipline Numbers au format Memory League, sur ordinateur, téléphone et tablette, avec ou sans réseau.

### S'entraîner

- **Numbers** : 80 chiffres à mémoriser en 1 minute, puis 4 minutes pour les restituer. Le score compte les chiffres justes à la bonne position ; le temps de mémorisation s'affiche au centième de seconde.
- **Pauses de préparation** : avant la mémorisation et avant le rappel, 0, 5, 10 ou 20 secondes, qu'on peut écourter. Elles ne comptent dans aucun temps.
- **Navigation** : → et ← passent d'un groupe à l'autre, espace ou ↑ reviennent au début. Entrée, le bouton Finished ou → deux fois rapidement sur le dernier groupe terminent la mémorisation.
- **Motif d'affichage** réglable dans les paramètres (« 2 2 », « 2 3 »…) ; la grille de rappel suit le même découpage.
- **Saisie du rappel** comme sur Memory League : + insère une case vide, − en supprime une.
- **Mode personnalisé** : nombre de chiffres et durée de mémorisation au choix. Le dernier mode et les derniers réglages sont proposés au lancement suivant, sur tous les appareils.
- **Abandon** : trois choix, « Garder hors statistiques », « Compter tel quel » ou « Ne pas garder ». Un essai interrompu malgré soi (onglet fermé, batterie vide) est proposé à la réouverture.

### Suivre

- **Résultat d'un essai** : score, temps de mémorisation et de rappel, et la copie corrigée, chiffre par chiffre.
- **Historique** de tous les essais, du plus récent au plus ancien ; chaque essai ouvre sa copie corrigée. Un essai terminé ne peut être ni modifié ni supprimé.

### Partout

- **Hors connexion** : l'application s'ouvre et un essai se fait sans réseau. Les essais partent dès le retour du réseau, une seule fois, avec leurs dates d'origine.
- **Tous les appareils** : connexion par passkey, puis synchronisation des essais et des paramètres. L'état de la synchronisation s'affiche dans l'en-tête.
- **Nouvelle version** : un encart la propose en bas de l'écran, jamais pendant un essai.
- **Installation** : sur iPhone et iPad, un rappel explique comment installer l'application, sans quoi Safari peut effacer les essais de l'appareil.
- **Français et anglais**, au choix dans les paramètres, avec les temps et les dates dans le format de la langue.

### En coulisses

- Sauvegarde quotidienne des essais, hors de la base, chez un autre service.
- En-têtes de sécurité sur tout le site.
