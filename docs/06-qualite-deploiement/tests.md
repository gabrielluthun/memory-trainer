# Q1 — Stratégie de tests

Amont : [objectifs](../02-projet/objectifs.md) (O3), [règles de gestion](../01-besoin/regles-de-gestion.md), [architecture](../04-specifications/architecture.md) (couches et tests), [diagramme de classes](../04-specifications/uml/classes.md) (tests par couche), [modèle physique](../04-specifications/bdd/mpd.md) et [accès aux données](../04-specifications/acces.md) (tests de la base), [sécurité de la base](../05-securite/bdd.md), [ADR 0021](../04-specifications/adr/0021-outils-de-test.md).

## En bref

- **Quatre niveaux de tests** : unitaires (le métier), intégration (les cas d'usage et l'accès aux services), base de données, bout en bout (l'application entière dans un navigateur).
- **Outils** : **Vitest** pour les tests unitaires, d'intégration et de la base ; **Playwright** pour les tests de bout en bout ; **PGlite** pour faire tourner PostgreSQL dans la CI, sans secret ni réseau.
- **TDD sur le domaine et la couche Application** : chaque règle de gestion et chaque cas d'usage commence par un test qui échoue.
- **Couverture contrôlée deux fois** : un seuil bloquant dans la CI sur le domaine, et chaque règle de gestion reliée à ses tests par son identifiant.
- **Tout tourne dans la CI**, sauf les tests du client de la Data API, qui ont besoin de la branche Neon de dev. Les vrais appareils sont vérifiés à la [recette](recette.md), en production.

## Décisions prises

| Décision | Choix du développeur | Où |
|---|---|---|
| **Outil des tests unitaires et d'intégration** | Vitest | [ADR 0021](../04-specifications/adr/0021-outils-de-test.md) |
| **Outil des tests de bout en bout** | Playwright | [ADR 0021](../04-specifications/adr/0021-outils-de-test.md) |
| **Périmètre du TDD** | Domaine et couche Application | Section 2 |
| **Tests de la base dans la CI** | PGlite seulement | Section 1, [ADR 0021](../04-specifications/adr/0021-outils-de-test.md) |
| **Mesure de la couverture** | Seuil bloquant et traçabilité des règles | Section 3 |
| **Téléphone et tablette** | Émulation Playwright dans la CI ; les vrais appareils sont vérifiés à la recette en production (parade du risque R6 inchangée) | Section 1, [recette](recette.md) |

## 1. Les niveaux de tests

| Niveau | Ce qui est testé | Avec quoi | Où il tourne |
|---|---|---|---|
| **Unitaires : domaine** | Règles RG01 à RG25 : formats, pauses, tirage, navigation, saisie, correction, score, classement, transitions de l'essai | Vitest ; fausses horloges et faux hasard à graine fixe | Poste et CI |
| **Intégration : application** | Cas d'usage : essai complet, abandon, interruption, file d'envoi, synchronisation, paramètres | Vitest ; fausses implémentations en mémoire des dépôts, du serveur, de la session et du planificateur | Poste et CI |
| **Intégration : infrastructure** | `TrialMapper` (aller-retour sans perte), transactions Dexie.js, conversion de la file d'envoi entre deux versions ([déploiement](deploiement.md)) | Vitest | Poste et CI |
| **Intégration : Data API** | `DataApiClient` : requêtes envoyées (fonction, filtres, tri, page, jeton) et lecture des réponses (envoi, doublon, refus, réception par pages, jeton refusé) | Vitest ; réponses HTTP simulées | Poste et CI |
| **Base de données** | Les 14 cas d'intégrité et les 17 cas d'accès déjà menés, aucune table sans RLS, aucune fonction exécutable par tous, chaque table lisible par `backup_reader` | Vitest ; PGlite ; `auth.user_id()` simulée ; base construite **depuis les fichiers de migration** | Poste et CI |
| **Bout en bout** | Parcours du lot 1 : essai Numbers standard et personnalisé, pauses, abandon, interruption puis réouverture, hors ligne puis retour du réseau, historique, paramètres | Playwright : Chromium, Firefox, WebKit, plus iPhone, iPad et Android émulés (tactile compris) | Poste et CI |

Les tests de la base sont construits à partir des migrations : ils vérifient donc aussi que chaque migration s'applique sur une base vide (ES19).

> Décision : dans les tests de bout en bout, la **Data API et Hanko sont simulés** en interceptant les requêtes du navigateur (fonction `page.route` de Playwright). La CI n'a ainsi aucun secret. La vraie connexion et la vraie synchronisation sont vérifiées à la recette en production.

> Décision : dans les tests de bout en bout, le **service worker est bloqué**, sauf dans les tests du hors ligne (US20). Ceux-ci ne tournent que sous Chromium : ailleurs, Playwright ne peut pas simuler les services pour une page contrôlée par un service worker. Le hors ligne sur iPhone et iPad est vérifié sur les vrais appareils à la recette (TR10, mode avion).

> Décision : le seul projet Hanko est celui de production, qui n'accepte que l'adresse du site. Sur le poste, aucun jeton réel n'est donc disponible, et un jeton de production y serait un identifiant de production ([surface d'attaque](../05-securite/surface-attaque.md)). `DataApiClient` est donc testé avec des **réponses simulées**, partout ; la vraie Data API est vérifiée à la recette (TR10).

### Exigences vérifiées par les tests

| Exigence | Test | Niveau |
|---|---|---|
| **ENF01** : Chronomètre à la milliseconde | Durées mesurées sur une fausse horloge monotone, au millième près | Unitaire |
| **ENF02** : Hors ligne | Réseau coupé dans Playwright : un essai se lance, se termine et s'affiche dans l'historique | Bout en bout |
| **ENF08** : Moins de 100 ms de latence | Temps entre l'appui sur une touche et l'affichage, mesuré dans Playwright | Bout en bout, non bloquant |
| **ES04** : Accès réservé au propriétaire | Requêtes sans connexion et d'un autre compte refusées, sur chaque table | Base |
| **ES05** : Essais terminés immuables | Modification, suppression et vidage refusés | Base |
| **ES06** : Synchronisation sans doublon | Deux envois du même essai : un seul en base ; même chose côté file d'envoi | Base, application |
| **ES07** : Validation par la base | Valeur hors bornes refusée, essai marqué « refusé » sur l'appareil | Base, application |
| **ES09** : Secrets hors du repo | Un faux secret est bloqué par le scan, en local et dans la CI | Contrôle du sprint 0 ([déploiement](deploiement.md)) |
| **ES12** : Aucun HTML brut | Un texte contenant `<script>` s'affiche tel quel | Bout en bout, dès le lot 2 (première saisie de texte libre : Words) |
| **ES13** : En-têtes de sécurité | Analyse des en-têtes du site publié | [Recette](recette.md), en production |
| **ES14** : Dépendances maîtrisées | `npm audit` | CI ([déploiement](deploiement.md)) |

> Décision : la mesure de latence (ENF08) est **non bloquante** dans la CI, car les machines partagées de GitHub donnent des temps variables. Elle signale une régression ; la vraie mesure est faite à la recette, sur les appareils.

## 2. TDD : sur quel périmètre et pourquoi

| Couche | TDD ? | Pourquoi |
|---|---|---|
| **Domaine** | **Oui** | Les règles de score et de correction sont le cœur du projet (O3). Le domaine est en TypeScript pur, sans navigateur ni base : un test s'écrit et tourne en quelques millisecondes. |
| **Application** | **Oui** | L'enchaînement d'un essai, l'abandon, l'interruption et la synchronisation sont les cas où une donnée peut se perdre (R5). Les interfaces de l'[ADR 0013](../04-specifications/adr/0013-organisation-code-metier.md) permettent de les tester avec de fausses implémentations, sans service réel. |
| **Présentation** | Non | Les écrans bougent beaucoup pendant un lot. Ils sont couverts par les tests de bout en bout, écrits une fois l'écran stable. |
| **Infrastructure** | Non | Elle dépend des services réels (Dexie.js, Data API) : tests d'intégration écrits avec le code. |
| **Fonctions SQL** | Non | Déjà écrites et testées au [modèle physique](../04-specifications/bdd/mpd.md). Chaque nouvelle migration arrive avec ses cas de test, dans la même branche. |

Cycle suivi : un test qui échoue, le code le plus simple qui le fait passer, puis le nettoyage, tests toujours verts.

## 3. Couverture et traçabilité

**Seuil bloquant** : la CI échoue si la couverture du domaine descend sous le seuil (mesure de Vitest, lignes et branches).

> Décision : seuil de **90 %** des lignes et des branches, sur la couche Domaine seulement.

**Traçabilité** : chaque test d'une règle porte son identifiant dans son nom, par exemple `RG12 — un chiffre juste à la mauvaise position ne rapporte rien`. Une recherche de `RG12` dans les tests donne donc tous ses tests. Le tableau ci-dessous est tenu à jour à chaque lot.

| Règle | Testée par | Lot |
|---|---|---|
| **RG01** : Durées standard | Unitaires | 1 |
| **RG02** : Numbers | Unitaires | 1 |
| **RG03** à **RG07** : Cards, Images, Words, Names, International Names | Unitaires | 2 et 3 |
| **RG08** : Arrêt du chronomètre avant la fin | Unitaires, bout en bout | 1 |
| **RG09** : Navigation pendant la mémorisation | Unitaires, bout en bout | 1 |
| **RG10** : Saisie du rappel | Unitaires, bout en bout | 1 (Numbers), puis 2 et 3 |
| **RG11** : Présentation par groupes | Unitaires | 1 |
| **RG12** : 1 point par élément correct | Unitaires, base (score cohérent) | 1 |
| **RG13** : Le score prime sur le temps | Unitaires | 1 |
| **RG14** : Orthographe exacte des prénoms | Unitaires | 3 |
| **RG15** : Mode personnalisé | Unitaires, bout en bout | 1 |
| **RG16** : Équivalents en points IAM | Unitaires | 6 |
| **RG17** : Standards IAM datés | Unitaires, base | 6 |
| **RG18** : Essai terminé immuable | Base, application | 1 |
| **RG19** : Détail conservé | Application (`TrialMapper`), base | 1 |
| **RG20** : Groupe relié à une image du système | Unitaires, base | 5 |
| **RG21** : Nouvelle séquence à chaque essai | Unitaires | 1 |
| **RG22** : Synchronisation une seule fois | Application, base, bout en bout | 1 |
| **RG23** : Abandon volontaire | Application, bout en bout | 1 |
| **RG24** : Interruption subie | Application, bout en bout | 1 |
| **RG25** : Temps de préparation | Unitaires, bout en bout | 1 |

Les règles de l'objectif O3 (RG12 à RG17) sont toutes en tests unitaires du domaine, donc sous le seuil bloquant.

## 4. Données de test

- **Toujours fictives** (ES10) : produites par le faux hasard à graine fixe, ou écrites à la main dans les tests.
- **Jamais copiées de la production**, ni d'une sauvegarde.
- Deux comptes fictifs dans les tests de la base (`owner-1`, `owner-2`), comme dans l'[accès aux données](../04-specifications/acces.md), pour vérifier l'isolement.

## 5. Quand les tests tournent

| Moment | Ce qui tourne |
|---|---|
| **Pendant le développement** | Vitest en mode surveillance : unitaires et intégration à chaque enregistrement |
| **Avant une fusion dans `develop`** | Toute la suite en local |
| **Dans la CI** | Lint, unitaires, intégration, base, bout en bout, couverture ([déploiement](deploiement.md)) |
| **Après une mise en production** | Les tests de recette, à la main, sur l'ordinateur, le téléphone et la tablette ([recette](recette.md)) |

## 6. Rangement des tests

| Tests | Dossier |
|---|---|
| Unitaires et intégration | À côté du code testé : `src/lib/<couche>/**/*.test.ts` |
| Base de données | `tests/db/` |
| Bout en bout | `tests/e2e/` |
| Fausses implémentations partagées | `tests/fakes/` |

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Dexie.js dans Vitest** | Node n'a pas d'IndexedDB. Deux pistes : une IndexedDB simulée en mémoire (un paquet de plus, très rapide), ou le mode navigateur de Vitest avec Playwright (vrai IndexedDB, plus lent). Choix à faire avec leurs points forts et faibles. | Sprint 0 |
| **Version de PostgreSQL** | Les tests ont été menés sur PostgreSQL 16.4 (PGlite). PGlite doit suivre la même version majeure que la base Neon. | Sprint 0 |
