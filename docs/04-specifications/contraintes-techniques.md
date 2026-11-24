# S3 — Contraintes techniques

Amont : [benchmark](benchmark.md), [architecture](architecture.md), [exigences](../01-besoin/exigences.md), [exigences de sécurité](../03-analyse-securite/exigences-securite.md).

Données vérifiées le **2026-11-20**. À revérifier au sprint 0.

## En bref

- **Les offres gratuites suffisent largement** pour un seul utilisateur : l'usage mensuel reste très en dessous de chaque limite, et le stockage tient plus de 20 ans.
- **Deux services se mettent en veille** après une période d'inactivité (Neon et Hanko), mais **se réveillent seuls** à la première requête. Après une longue pause, la première connexion est donc un peu plus lente, sans aucune action manuelle.
- **La synchronisation ne peut pas tourner en arrière-plan** sur Safari et Firefox : elle se fait quand l'application est ouverte.
- **Sur iPhone et iPad, l'application doit être installée** sur l'écran d'accueil pour que ses données locales ne soient pas effacées.
- **Deux points sont à vérifier au sprint 0** : la fermeture de l'inscription chez Hanko (ES01) et la vérification des jetons Hanko par Neon.

## 1. Limites des offres gratuites

| Service | Limite gratuite | Usage estimé | Si la limite est dépassée |
|---|---|---|---|
| **Neon** : stockage | 1 Go par projet | Environ 30 à 45 Mo par an (voir section 2) | Base en lecture seule ou calcul coupé jusqu'au mois suivant |
| **Neon** : calcul | 100 heures de calcul par mois ; veille après 5 minutes sans requête | Quelques heures par mois (séances, synchronisation, sauvegarde) | Calcul coupé jusqu'au mois suivant |
| **Neon** : transfert | 5 Go par mois | Quelques Mo par mois | Calcul coupé jusqu'au mois suivant |
| **Neon** : restauration | Historique de **6 heures** seulement | — | Au-delà, seule notre sauvegarde externe (ES17) permet de restaurer |
| **Hanko Cloud** | 2 projets ; passkeys et double authentification incluses ; projet mis en pause après une période d'inactivité, **réveillé automatiquement** à la première requête | 1 projet, 1 utilisateur | — |
| **Cloudflare Pages** | 500 déploiements par mois, 20 000 fichiers par site, 25 Mo par fichier, bande passante sans limite publiée | Quelques déploiements par mois ; quelques centaines de fichiers | Déploiement refusé |
| **Cloudflare Workers** | 100 000 requêtes par jour, **10 ms de calcul** par exécution, 5 tâches planifiées par compte | 1 exécution par jour (sauvegarde) | Erreur jusqu'au lendemain |
| **Cloudflare R2** | 10 Go par mois, 1 million d'écritures et 10 millions de lectures par mois, téléchargements gratuits | Quelques Mo par mois, environ 30 écritures par mois | Facturé au tarif de R2 : R2 exige un moyen de paiement ([ADR 0024](adr/0024-moyen-de-paiement-cloudflare-r2.md)). Alertes de facturation (ES16) |
| **GitHub** (repo public) | Actions gratuites ; détection des secrets et blocage des push contenant un secret gratuits | Une exécution de CI par push | — |

Conséquences pour la conception :
- **Sauvegarde incrémentale** : 10 ms de calcul par exécution ne suffisent pas pour exporter toute la base. Le Worker n'exporte que les essais créés depuis la dernière sauvegarde, et un instantané des systèmes ([ADR 0009](adr/0009-sauvegarde-cloudflare-worker-r2.md)).
- **Pas de recherche dans la base à chaque action** : l'application lit ses données dans Dexie.js. La base ne sert qu'à la synchronisation, ce qui garde le calcul Neon très bas.
- **L'historique de 6 heures de Neon ne remplace pas une sauvegarde** : ES17 reste indispensable.

## 2. Volume de données

Estimation à confirmer avec le MCD (S8).

| Hypothèse | Volume |
|---|---|
| Un essai Numbers standard (80 éléments, une ligne par élément pour l'analyse des erreurs, index compris) | Environ **12 Ko** au plus |
| 10 essais par jour, tous les jours | Environ **30 à 45 Mo par an** |
| Capacité de Neon (1 Go) | Plus de **20 ans** à ce rythme |
| Images, visages, listes de mots et de prénoms | **Hors de la base** : fichiers statiques, décidés avant le lot 2 |

Cloudflare Pages limite le site à **20 000 fichiers de 25 Mo au plus**. Les banques d'images et de visages (lots 2 et 3) devront respecter cette limite, ou être placées dans R2.

## 3. Navigateurs et appareils

ENF09 vise les deux dernières versions de Chrome, Safari (macOS et iOS), Firefox et Edge.

| Contrainte | Navigateurs concernés | Conséquence |
|---|---|---|
| **Pas de synchronisation en arrière-plan** (API Background Sync non prise en charge) | Safari, Firefox | La synchronisation se fait à l'ouverture de l'application, au retour du réseau, et régulièrement tant qu'elle est ouverte. Un essai terminé est d'abord écrit dans Dexie.js : il n'est jamais perdu (ENF07). |
| **Données locales effacées après quelques jours sans visite** | Safari sur iOS et iPadOS, si l'application n'est pas installée | Installer l'application sur l'écran d'accueil, et demander un stockage persistant (`navigator.storage.persist()`). Sur iPhone et iPad, l'application le rappelle à chaque ouverture, tant qu'elle n'est pas installée. |
| **Précision du chronomètre réduite** : environ 1 ms, au lieu de quelques microsecondes | Firefox, Safari (protection contre certaines attaques) | Suffisant : ENF01 demande une mesure à la milliseconde et un affichage au centième. |
| **Installation sur ordinateur impossible** | Firefox | L'application de bureau (lot 7) s'installe depuis Chrome, Edge ou Safari. Firefox reste utilisable dans un onglet. |
| **Écran qui se met en veille** pendant un essai (rappel de 4 minutes) | Téléphones et tablettes | Garder l'écran allumé pendant l'essai (API Screen Wake Lock, disponible dans les navigateurs ciblés). |

## 4. Connexion et hors ligne

| Contrainte | Conséquence |
|---|---|
| La connexion par passkey **demande le réseau** (échange avec Hanko). | Hors ligne, l'application s'ouvre avec les données locales, **sans se reconnecter**. La connexion n'est demandée qu'au moment de synchroniser. |
| Une session Hanko dure 12 heures par défaut (réglable de 1 minute à 1 mois), avec un délai d'inactivité. | Si la session a expiré, les essais attendent dans la file d'envoi jusqu'à la prochaine connexion. Durée exacte fixée en partie 5 (ES03). |
| La Data API de Neon n'accepte qu'**un seul fournisseur de connexion** à la fois. | Hanko est ce fournisseur unique. |
| Fermeture de l'inscription chez Hanko : **non documentée** sur les pages consultées. Vérifié au sprint 0 : elle se ferme dans la console. | Parade en base, quoi qu'il arrive : les règles d'accès n'autorisent que **l'identifiant du compte unique**. Un compte créé par un inconnu ne peut rien lire ni écrire (ES01, ES04). |

## 5. À vérifier au sprint 0

| Point | Pourquoi |
|---|---|
| Fermer l'inscription dans Hanko Cloud | ES01 ; la parade en base s'applique de toute façon |
| Brancher les clés publiques (JWKS) de Hanko sur la Data API de Neon | Hanko est absent de la liste de Neon : configuration générique, sans guide |
| Délai de réveil de Neon et de Hanko après une pause | Confort de la première connexion ; aucun impact sur les données |
| Place prise par les tables internes dans la base | Estimer précisément la marge de stockage |

## Sources

- Neon : [limites de l'offre gratuite](https://neon.com/faqs/free-plan-limits-and-quotas), [fenêtre de restauration](https://neon.com/docs/postgres/backup-restore/history-window), [fournisseurs de connexion externes](https://neon.com/docs/data-api/custom-authentication-providers)
- Hanko : [tarifs](https://www.hanko.io/pricing), [gestion des sessions](https://docs.hanko.io/guides/session-management), [réveil automatique des projets en pause](https://www.hanko.io/updates/webhooks-automatic-reactivation)
- Cloudflare : [tarifs de R2](https://developers.cloudflare.com/r2/pricing/), [limites des Workers](https://developers.cloudflare.com/workers/platform/limits), [limites de Pages](https://developers.cloudflare.com/pages/platform/limits/)
- Navigateurs : [Background Sync (caniuse)](https://caniuse.com/background-sync), [WebKit — politique de stockage](https://webkit.org/?p=14403)
