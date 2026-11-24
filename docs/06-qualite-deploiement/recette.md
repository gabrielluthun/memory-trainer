# Q2 — Recette personnelle

Amont : [user stories](../01-besoin/user-stories.md) (critères d'acceptation), [cas d'utilisation](../04-specifications/uml/cas-utilisation.md), [livrables par lot](../04-specifications/livrables.md), [planning](../02-projet/planning.md), [stratégie de tests](tests.md), [déploiement](deploiement.md).

## En bref

- **La recette se fait en production**, juste après la publication de la version du lot, sur l'ordinateur, le téléphone et la tablette.
- **Un test de recette (TR) par cas d'utilisation** du lot. Chaque TR indique les critères d'acceptation (CA) des user stories qu'il vérifie.
- **Lot 1** : 13 tests, de **TR01** à **TR13** (12 cas d'utilisation et un contrôle de sécurité en production). **TR14**, sur la mise à jour de l'application, commence au lot 2.
- **Un procès-verbal par lot**, dans ce fichier (section 5). Le lot est livré quand tous les TR sont réussis et que les 8 livrables sont là.
- **Un défaut trouvé à la recette donne un hotfix** (`X.Y.1`), puis les TR concernés sont refaits.

## Décisions prises

| Décision | Choix du développeur | Conséquence |
|---|---|---|
| **Lieu de la recette** | En production | Les essais faits pendant la recette restent dans l'historique (RG18) : voir section 2 |
| **Découpage** | Un TR par cas d'utilisation | Suit la chaîne cas d'utilisation → test de recette |
| **Ordre dans un lot** | Code → tests → release → recette en production → lot livré | [Planning](../02-projet/planning.md) modifié, partie 2 revalidée sur ce point |
| **Vrais appareils** | Vérifiés ici, à la main ; la CI se limite à l'émulation ([stratégie de tests](tests.md)) | Parade du risque R6 tenue par la recette |

## 1. Déroulé de la recette d'un lot

1. La version `X.Y.0` est publiée par la CI ([déploiement](deploiement.md)).
2. Le développeur passe chaque TR du lot, sur chaque appareil indiqué, et note le résultat dans le procès-verbal.
3. Il fait le test de restauration de la sauvegarde ([sécurité de la base](../05-securite/bdd.md), section 6), qui est l'un des 8 livrables.
4. **Tous les TR réussis** : le lot est livré. Le procès-verbal est commité, puis le lot suivant peut commencer.
5. **Un TR en échec** : le défaut est corrigé par un hotfix `X.Y.1` ([conventions](../02-projet/conventions.md)), publié par la CI. Les TR concernés sont refaits, puis on reprend à l'étape 4.

Un défaut mineur, qui ne gêne pas l'entraînement (un libellé, un alignement), peut être accepté **avec réserve** : il est noté dans le procès-verbal et corrigé au lot suivant.

## 2. Essais faits pendant la recette

Les essais terminés sont immuables (RG18), et la recette se fait sur les vraies données. Pour ne pas fausser les statistiques :

| Situation | Que faire |
|---|---|
| **Essai terminé normalement** | Le faire pour de vrai : c'est un entraînement, il compte normalement. |
| **Abandon ou interruption** | Choisir « Garder hors statistiques » ou « Ne pas garder » : l'essai n'entre pas dans les statistiques. |
| **« Compter tel quel »** | Le tester sur un vrai essai, abandonné vers la fin : il comptera dans les statistiques. |
| **Mode personnalisé** | Faire de vrais essais courts : ils se reconnaissent à leur code couleur (RG15). |

## 3. Appareils

| Appareil | Saisie | Ce qu'il vérifie en priorité |
|---|---|---|
| **Ordinateur** | Clavier et souris | Raccourcis clavier (RG09, RG10), contrôles de sécurité en production |
| **Téléphone** | Tactile | Équivalents tactiles, écran allumé pendant l'essai, hors ligne, installation |
| **Tablette** | Tactile | Mêmes points que le téléphone, sur un écran plus grand |

Le procès-verbal note, pour chaque appareil, son système et son navigateur avec leurs versions. ENF09 vise les deux dernières versions de Chrome, Safari (macOS et iOS), Firefox et Edge : la recette couvre les navigateurs des appareils du développeur, et la CI couvre les trois moteurs (Chromium, Firefox, WebKit).

## 4. Tests de recette du lot 1 (version 0.1)

| Test de recette | Cas d'utilisation | Ce qui est vérifié | Appareils |
|---|---|---|---|
| **TR01** : Lancer un essai Numbers | CU01 | Standard : 80 chiffres tirés au hasard, différents à chaque essai. Personnalisé : 10 chiffres puis plus. Pauses de 0, 5, 10 ou 20 s ; les dernières durées sont proposées. | Tous |
| **TR02** : Mémoriser | CU02 | Navigation par groupes (→, ←, espace, ↑, et leurs équivalents tactiles), arrêt plus tôt (→ deux fois, Finished, Entrée), arrêt seul à 1 minute. Chiffres cachés pendant la pause. Latence entre l'appui et l'affichage sous 100 ms, mesurée dans les outils de développement du navigateur (ENF08). | Tous |
| **TR03** : Restituer | CU03 | Saisie, retour arrière, insertion (+) et suppression (−) avec décalage, arrêt seul à 4 minutes, écran resté allumé. | Tous |
| **TR04** : Consulter le résultat | CU04 | Score égal au nombre de chiffres justes à la bonne place ; temps au centième ; chaque chiffre attendu face à la réponse, erreurs visibles. | Ordinateur, téléphone |
| **TR05** : Abandonner | CU05 | Les trois choix, pendant la mémorisation, la pause avant le rappel et le rappel. Abandon pendant la pause avant la mémorisation : aucune question, rien d'enregistré. | Ordinateur, téléphone |
| **TR06** : Essai interrompu | CU06 | Fermer l'application pendant un rappel, la rouvrir : statut « Erreur externe à l'application », trois choix proposés, essai jamais envoyé avant le choix. | Téléphone |
| **TR07** : Consulter l'historique | CU07 | Du plus récent au plus ancien, filtres par discipline et par mode, essais personnalisés en couleur, abandonnés signalés, aucune action de modification ni de suppression. | Ordinateur, tablette |
| **TR08** : Régler ses paramètres | CU15 | Langue FR et EN sans perte de données, temps et dates au format de la langue, langue gardée à la réouverture ; motif d'affichage appliqué à l'essai suivant, à la mémorisation et au rappel ; réglage retrouvé sur un autre appareil. | Ordinateur, téléphone |
| **TR09** : Se connecter | CU16 | Connexion par passkey sur chaque appareil ; aucune autre méthode proposée ; hors ligne, l'application reste utilisable. | Tous |
| **TR10** : Synchroniser | CU17 | Essai fait en mode avion, puis réseau rétabli : il apparaît **une seule fois**, avec ses temps d'origine, sur les autres appareils. | Tous |
| **TR11** : Installer l'application | CU18 | Installation sur l'écran d'accueil du téléphone et de la tablette ; rappel d'installation affiché tant qu'elle n'est pas faite ; stockage persistant accordé. | Téléphone, tablette |
| **TR12** : Sauvegarder | CU19 | Le lendemain de la recette : un fichier JSON daté dans R2, avec les essais de la recette ; aucune erreur dans la console Cloudflare. | Console Cloudflare |
| **TR13** : Contrôles de sécurité en production | — (ES01, ES02, ES08, ES13, ES15) | En-têtes HSTS et CSP présents (analyse des en-têtes du site) ; inscription refusée chez Hanko ; requête à la Data API sans jeton refusée ; aucune requête vers un autre site que l'hébergeur, la base et Hanko ; aucune clé secrète dans les fichiers publiés. | Ordinateur |
| **TR14** : Mettre à jour l'application | — (décision du [déploiement](deploiement.md)) | Dès la version 0.2 : bandeau « Nouvelle version » jamais affiché pendant un essai ; essais en attente d'envoi convertis puis envoyés après la mise à jour. | Téléphone, ordinateur |

### Critères d'acceptation couverts

| User story | Critères d'acceptation | Vérifiés par |
|---|---|---|
| **US01** : S'entraîner à Numbers | CA1 à CA4 | TR01 à TR04 |
| **US07** : Naviguer et terminer plus tôt | CA1, CA1bis, CA2, CA3 | TR02, TR08 |
| | CA4 (classement à score égal) | Tests unitaires (RG13) : aucun classement n'est affiché au lot 1 |
| **US08** : Saisir et corriger son rappel | CA1, CA2 (Numbers) | TR03 |
| **US09** : Mode personnalisé | CA1 à CA3 | TR01, TR07 |
| **US10** : Abandonner un essai | CA1 à CA4 | TR05 |
| | CA5, CA6 | TR06 |
| **US11** : Voir le détail d'un essai | CA1 | TR04 |
| **US12** : Consulter l'historique | CA1 à CA3 | TR07 |
| **US19** : Langue de l'interface | CA1, CA2 | TR08 |
| **US20** : S'entraîner hors connexion | CA1, CA2 (Numbers) | TR10 |
| **US21** : Données sur tous les appareils | CA1 | TR10 |
| | CA2 (clavier et toucher) | TR02, TR03 |
| **US23** : Se préparer avant chaque phase | CA1 à CA6 | TR01, TR02, TR05 |

Les CA qui concernent d'autres disciplines (Cards, Images, Words, Names) sont vérifiés à leur lot.

## 5. Procès-verbaux

Un procès-verbal par lot, ajouté ici au moment de la recette. Modèle :

```markdown
### Procès-verbal — version X.Y.0 (lot N)

- Date :
- Appareils : ordinateur (système, navigateur et versions), téléphone (…), tablette (…)

| Test de recette | Ordinateur | Téléphone | Tablette | Remarque |
|---|---|---|---|---|
| TR01 : … | Réussi / Échec / Réserve | | | |

- Restauration de la sauvegarde : réussie / en échec (nombre d'essais, dernier numéro d'ordre)
- Hotfix : aucun / X.Y.1 (TR refaits : …)
- Réserves reportées au lot suivant :
- **Décision** : lot livré / lot non livré
```

### Procès-verbal — version 0.1.0 (lot 1)

À remplir après la publication de la version 0.1.0.
