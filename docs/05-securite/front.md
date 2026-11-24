# SE5 — Sécurisation du front

Amont : [surface d'attaque](surface-attaque.md), [défense en profondeur](defense-en-profondeur.md), [exigences de sécurité](../03-analyse-securite/exigences-securite.md) (ES08, ES12 à ES15), [architecture](../04-specifications/architecture.md), ADR [0008](../04-specifications/adr/0008-service-worker-vite-plugin-pwa.md) et [0020](../04-specifications/adr/0020-polices-auto-hebergees.md).

## En bref

- **Le front est public et peut être lu en entier** : il ne contient aucun secret, seulement les adresses publiques de la Data API et de Hanko (ES08).
- **Des en-têtes de sécurité sur chaque réponse**, envoyés par Cloudflare Pages : HTTPS imposé, politique de sécurité du contenu (CSP), interdiction d'être affiché dans un cadre, permissions limitées (section 1).
- **Les scripts ne viennent que de l'application** ; les styles en ligne sont autorisés (décision ci-dessous).
- **Aucun texte n'est inséré comme du HTML** : Svelte échappe tout par défaut, et le lint interdit `{@html}` (ES12).
- **Les données de l'appareil ne sont pas chiffrées** : elles sont peu sensibles, et protégées par le verrouillage de l'appareil (MEN12, risque accepté). Le stockage du jeton de session est traité en [sécurité du back](back.md).

## Décision prise 

| Décision | Choix du développeur | Exigences |
|---|---|---|
| **Styles en ligne dans la CSP** | **Autorisés** : les attributs `style` sont permis, pour que Svelte s'utilise normalement (positions du carrousel, transitions). Les scripts restent limités à ceux de l'application. | ES13 |

## 1. En-têtes de sécurité

Envoyés sur chaque réponse par Cloudflare Pages, à partir d'un fichier `_headers` du build.

| En-tête | Valeur | Pourquoi | Exigences |
|---|---|---|---|
| **Strict-Transport-Security** | `max-age=63072000; includeSubDomains` | HTTPS obligatoire pendant 2 ans, même si une adresse en `http` est tapée | ES13 |
| **Content-Security-Policy** | Voir section 2 | N'autorise que ce dont l'application a besoin | ES13, ES15 |
| **X-Content-Type-Options** | `nosniff` | Le navigateur ne devine pas le type d'un fichier : un fichier texte ne peut pas être exécuté comme un script | ES13 |
| **Referrer-Policy** | `no-referrer` | Aucune adresse de l'application n'est envoyée à un autre site | ES15 |
| **Permissions-Policy** | `camera=(), microphone=(), geolocation=(), payment=(), usb=(), screen-wake-lock=(self), publickey-credentials-get=(self), publickey-credentials-create=(self)` | Seules les fonctions utiles sont permises : écran gardé allumé ([contraintes techniques](../04-specifications/contraintes-techniques.md)) et passkeys | ES13 |
| **Cross-Origin-Opener-Policy** | `same-origin` | Une autre page ouverte depuis l'application ne peut pas la piloter | ES13 |

L'application est publiée sur un sous-domaine `pages.dev`, gratuit (ENF06). Le domaine `.dev` impose déjà HTTPS dans les navigateurs ; l'en-tête HSTS le confirme.

## 2. Politique de sécurité du contenu (CSP)

| Directive | Autorise | Pourquoi |
|---|---|---|
| `default-src` | `'self'` | Par défaut, uniquement l'application |
| `script-src` | `'self'` et l'empreinte du script de démarrage de SvelteKit | Aucun script d'un autre site, aucun script injecté |
| `style-src` | `'self' 'unsafe-inline'` | Fichiers CSS de l'application, et styles en ligne (décision ci-dessus) |
| `font-src` | `'self'` | Polices auto-hébergées ([ADR 0020](../04-specifications/adr/0020-polices-auto-hebergees.md)) |
| `img-src` | `'self' data: blob:` | Images de l'application ; `data:` et `blob:` pour les icônes générées |
| `connect-src` | `'self'`, l'adresse de la Data API de Neon, l'adresse de Hanko | Le code ne peut envoyer des données qu'à ces deux services, même s'il était piraté (MEN06) |
| `worker-src` | `'self'` | Service worker de l'application seulement |
| `manifest-src` | `'self'` | Manifeste de la PWA |
| `object-src` | `'none'` | Aucun plugin |
| `base-uri` | `'self'` | Personne ne peut changer l'adresse de base des liens |
| `form-action` | `'self'` | Aucun formulaire ne peut envoyer vers un autre site |
| `frame-ancestors` | `'none'` | L'application ne peut pas être affichée dans un cadre d'un autre site (faux boutons superposés) |

Les adresses exactes de la Data API et de Hanko sont connues au sprint 0.

## 3. Affichage sans injection (XSS)

| Mesure                                      | Comment                                                                                                           | Exigences  |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------- |
| **Texte échappé**                           | Svelte affiche toute valeur comme du texte : les mots, prénoms et réponses saisies ne peuvent pas devenir du HTML | ES12       |
| `{@html}` **interdit**                      | Règle de lint `svelte/no-at-html-tags`, en erreur dans la CI                                                      | ES12       |
| **Pas de code construit à partir de texte** | Ni `eval`, ni `new Function`, ni gestionnaire d'événement écrit dans une chaîne ; la CSP le bloque de toute façon | ES12, ES13 |
| **Contenus importés**                       | Les listes de mots et de prénoms (lots 2 et 3) sont traitées comme du texte, jamais comme du HTML                 | ES12       |

Test prévu par ES12 : un texte contenant `<script>` s'affiche tel quel.

## 4. Données gardées sur l'appareil

| Stockage | Contenu | Sensible | Protection |
|---|---|---|---|
| **IndexedDB** (Dexie.js) | Essais, paramètres, file d'envoi, essai en cours, repère de réception | Faible | Isolé par le navigateur (une seule origine) ; verrouillage de l'appareil |
| **localStorage** | Langue de l'interface, copie des paramètres lue au démarrage ([ADR 0029](../04-specifications/adr/0029-langue-reactive.md)) | Aucun | Isolé par le navigateur ; les paramètres restent la référence |
| **Cache du service worker** | Fichiers de l'application et polices | Aucun | Uniquement les fichiers de l'application ; **jamais les réponses de la Data API** |
| **Jeton de session** | Jeton Hanko | Moyen | Traité en [sécurité du back](back.md) |

Les données de l'appareil ne sont pas chiffrées : elles sont peu sensibles, et un appareil perdu est un risque faible, accepté (MEN12). La déconnexion ne vide pas la base locale : l'application reste utilisable hors ligne avec les essais déjà enregistrés.

## 5. Aucune clé secrète dans le front

| Mesure | Comment | Exigences |
|---|---|---|
| **Configuration publique seulement** | Le build ne reçoit que des variables publiques : adresse de la Data API, adresse et identifiant du projet Hanko | ES08 |
| **Vérification du build** | La CI cherche des secrets dans les fichiers produits par le build, avant la publication ; la publication échoue si elle en trouve | ES08, ES09 |

## 6. Dépendances du front

| Mesure | Comment | Exigences |
|---|---|---|
| **Versions figées** | Fichier de verrouillage commité ; installation par `npm ci` dans la CI | ES14 |
| **Audit** | `npm audit` dans la CI ; alertes de vulnérabilité de GitHub activées | ES14 |
| **Peu de dépendances** | Celles du benchmark seulement ; chaque ajout est justifié | ES14, [surface d'attaque](surface-attaque.md) |
| **Rien depuis un CDN** | Tout est inclus dans le build : aucun script ni police chargé d'un autre site | ES15 |

## 7. Service worker

| Mesure | Pourquoi |
|---|---|
| Ne met en cache que les fichiers de l'application, listés au build | Aucune donnée ni aucun jeton dans son cache |
| Servi depuis l'application, sur sa propre origine | Il ne peut pas être remplacé par un autre site (`worker-src 'self'`) |
| Une nouvelle version n'est jamais appliquée pendant un essai ([séquences](../04-specifications/uml/sequences.md)) | Pas de rechargement au milieu d'un rappel |

## Points ouverts

| Point | Pourquoi | Quand |
|---|---|---|
| **Empreinte du script de démarrage de SvelteKit** | SvelteKit insère un petit script dans la page ; son empreinte doit être autorisée par la CSP (option `kit.csp`). | Sprint 0 |
| **Adresses exactes** de la Data API et de Hanko dans `connect-src` | Connues à la création des projets. | Sprint 0 |
| **Test des en-têtes en production** | Analyse des en-têtes du site publié (ES13). | Recette du lot 1 |
