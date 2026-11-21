# S1 — Benchmark technologique

Amont : [exigences](../01-besoin/exigences.md), [contraintes](../01-besoin/contraintes.md), [risques projet](../02-projet/risques.md), [menaces](../03-analyse-securite/menaces.md), [exigences de sécurité](../03-analyse-securite/exigences-securite.md).

Données vérifiées le **2026-11-20**. Les offres gratuites changent souvent : à revérifier avant le sprint 0.

## En bref

| Catégorie | Trois premiers (score) |
|---|---|
| Framework front | Svelte (30/35), React (29), Vue (27) |
| Backend et base | Neon (33/40), Supabase (30), Cloudflare Workers + D1 (29) |
| Fournisseur de connexion (avec Neon) | Hanko Cloud (33/40), WorkOS AuthKit et Better Auth auto-hébergé (32) |
| Hors ligne et synchro | Sur-mesure avec Dexie.js (35/40), RxDB (30), PowerSync et Dexie Cloud (28) |
| Hébergement du front | Cloudflare Pages (33/35), Vercel (26), Netlify (23) |
| Application de bureau | PWA installée (39/40), Electron (32), Tauri 2 (31) |

Chaque technologie a ses **points forts et ses points faibles** dans sa section. Le développeur choisit ([section 7](#7-choix-du-développeur)).

## 1. Méthode

- **Notes de 1 à 5 étoiles** par critère, avec 5 à 6 critères par catégorie.
- **Poids ×2** sur les deux priorités du développeur : la **pérennité de l'offre gratuite** (ENF06, R4) et un **hors ligne robuste** (ENF02, ENF07, RG22). Les autres critères comptent ×1.
- **Retours d'utilisateurs** : taux « admiré » de l'enquête **Stack Overflow 2026** (part des utilisateurs qui veulent continuer à s'en servir), complété par l'enquête **State of JS 2025**. Barème : ≥ 58 % = ★★★★★ · 52–58 % = ★★★★ · 45–52 % = ★★★ · 40–45 % = ★★ · < 40 % = ★. Une technologie absente de l'enquête reçoit ★★ (adoption faible).
- **Critère éliminatoire** : pas d'écriture possible hors connexion (ENF02).

## 2. Framework front

Tous les candidats s'utilisent en TypeScript, avec Vite, et en application monopage (SPA). Le rendu côté serveur n'apporte rien ici : l'application est derrière une connexion et doit fonctionner hors ligne.

| Framework   | Satisfaction | Performance | Pérennité (×2) | Écosystème PWA et hors ligne (×2) | Simplicité | Score / 35 |
| ----------- | ------------ | ----------- | -------------- | --------------------------------- | ---------- | ---------- |
| **Svelte**  | ★★★★★        | ★★★★★       | ★★★★☆          | ★★★★☆                             | ★★★★☆      | **30**     |
| **React**   | ★★★☆☆        | ★★★☆☆       | ★★★★★          | ★★★★★                             | ★★★☆☆      | **29**     |
| **Vue**     | ★★★☆☆        | ★★★★☆       | ★★★★☆          | ★★★★☆                             | ★★★★☆      | **27**     |
| **Preact**  | ★★★☆☆        | ★★★★★       | ★★★☆☆          | ★★★★☆                             | ★★★★☆      | **26**     |
| **Angular** | ★★☆☆☆        | ★★★☆☆       | ★★★★★          | ★★★★☆                             | ★★☆☆☆      | **25**     |
| **Solid**   | ★★★★☆        | ★★★★★       | ★★☆☆☆          | ★★★☆☆                             | ★★★☆☆      | **22**     |
| **Qwik**    | ★★☆☆☆        | ★★★★☆       | ★★☆☆☆          | ★★☆☆☆                             | ★★☆☆☆      | **16**     |

| Framework | Points forts | Points faibles |
|---|---|---|
| **Svelte** | Le plus admiré des grands frameworks (59,4 % ; SvelteKit 64,4 %). Compilé : bundle léger et rapide (ENF08). Peu de code à écrire. | Écosystème plus petit. Moins de ressources d'aide. Changements importants entre versions (passage de Svelte 4 à 5 avec les « runes »). |
| **React** | Le plus utilisé (44,7 %) et le plus demandé sur le marché. L'écosystème et la documentation les plus riches. Soutenu par Meta. | Admiration moyenne (46,7 %). Plus verbeux. Plus lourd (DOM virtuel). Les re-rendus sont à surveiller pour la latence (ENF08). |
| **Vue** | Simple à apprendre. Écosystème solide et équilibré. | Ne se démarque sur aucun critère. Admiration moyenne (47,2 %). Moins demandé que React. |
| **Preact** | Très léger (environ 3 Ko). Compatible avec une partie de l'écosystème React. | Communauté plus petite. Compatibilité avec React incomplète. |
| **Angular** | Soutenu par Google. Complet : routeur, formulaires et service worker intégrés. | Le moins admiré (42,1 %). Long à apprendre. Beaucoup de code pour une petite application. |
| **Solid** | Le plus satisfaisant depuis cinq ans (State of JS). Très performant. | Utilisé par environ 10 % des développeurs : écosystème et aide limités, pérennité incertaine. |
| **Qwik** | Chargement initial très rapide. | Conçu pour le rendu côté serveur, inutile ici. Satisfaction en recul (State of JS 2025). Écosystème réduit. |

## 3. Backend et base de données

Le process impose une base **relationnelle** : le MPD est un script SQL (chaîne Merise).

| Service | Pérennité du gratuit ×2 | Compatibilité hors ligne ×2 | SQL relationnel | Sécurité (ES) | Satisfaction | Simplicité | Score / 40 |
|---|---|---|---|---|---|---|---|
| **Neon** (Postgres, Data API, auth managée) | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | **33** |
| **Supabase** (Postgres, API, auth) | ★★☆☆☆ | ★★★★☆ | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★★★★ | **30** |
| **Cloudflare Workers + D1** (API maison, SQLite) | ★★★★★ | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | ★★★★☆ | ★★☆☆☆ | **29** |
| **Firebase** (Firestore) | ★★★☆☆ | ★★★★★ | ★☆☆☆☆ | ★★★☆☆ | ★☆☆☆☆ | ★★★★☆ | **25** |
| **PocketBase** sur PocketHost | ★★★☆☆ | ★★☆☆☆ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | **24** |
| **Convex** | ★★★★☆ | ★★☆☆☆ | ★★☆☆☆ | ★★★★☆ | ★★☆☆☆ | ★★★★☆ | **24** |
| **InstantDB** | ★☆☆☆☆ | ★★★★★ | ★☆☆☆☆ | ★★★☆☆ | ★★☆☆☆ | ★★★★★ | **23** |
| **Appwrite Cloud** | ★★☆☆☆ | ★★☆☆☆ | ★★☆☆☆ | ★★★★☆ | ★★☆☆☆ | ★★★★☆ | **20** |

| Service | Points forts | Points faibles |
|---|---|---|
| **Neon** | **Aucune suspension pour inactivité** : le calcul se met en veille et se réveille à la requête suivante. PostgreSQL, la base la plus admirée (62,3 %). La Data API applique les règles d'accès définies dans la base. 0,5 à 1 Go et 100 heures de calcul par mois. | L'authentification managée **n'a ni passkey ni double authentification** : ES02 non tenue, sauf avec un fournisseur de connexion à part. Data API récente (septembre 2026). Petit délai sur la première requête après la veille. Pas tout-en-un : base, API et connexion sont des briques séparées. |
| **Supabase** | Tout-en-un : base PostgreSQL, API, connexion, règles d'accès en base. **Passkeys** (bêta) et double authentification. Inscription désactivable. Le plus mature. | Projet gratuit **suspendu après 7 jours d'inactivité** : il faut le relancer à la main (données conservées pendant un an), ou mettre en place une tâche de réveil quotidienne. Passkeys encore en bêta, avec des bugs signalés. **Aucune sauvegarde gratuite**. 500 Mo. Admiré à 45,2 %. |
| **Cloudflare Workers + D1** | Aucune suspension. Les plafonds quotidiens bloquent au lieu de facturer. Même fournisseur que l'hébergement. SQLite apprécié (56,4 %). | **API et connexion à écrire soi-même** : plus de code et plus de surface d'attaque. Contrôle d'accès dans le code, pas dans la base (contraire à STRAT01). Ajoute un contrat d'API au process. 500 Mo par base. |
| **Firebase** | Le meilleur hors ligne intégré. Pas de suspension. Soutenu par Google. | Base **NoSQL**, incompatible avec un MPD en SQL. Pas de passkeys natives. Offre gratuite réduite en 2026. Le moins admiré (38,6 %). |
| **PocketBase** (PocketHost) | Très simple : un seul programme, SQLite, règles d'accès intégrées. Gratuit sans mise en veille chez PocketHost. | Petit hébergeur, financé par une dotation, 1 projet gratuit. Pas de passkeys natives. Pas d'outil de synchronisation hors ligne. |
| **Convex** | Pas de suspension documentée. TypeScript de bout en bout. | Base orientée documents (pas de SQL). Hors ligne limité. Absent de l'enquête. |
| **InstantDB** | Hors ligne excellent et intégré. Très simple. | L'équipe **a rejoint OpenAI** (annonce sur sa page de tarifs) : avenir incertain. Pas de SQL. Pas de passkeys documentées. |
| **Appwrite Cloud** | Complet : base, connexion, fichiers. Auto-hébergeable. | Projets gratuits **suspendus après 7 jours d'inactivité**. Base orientée documents. Pas de synchronisation hors ligne pour le web. |

### Fournisseur de connexion (avec Neon)

L'authentification managée de Neon n'a pas de passkey. Il faut donc un fournisseur externe qui respecte ES02, et dont les jetons (JWT) sont vérifiables par la Data API de Neon grâce à ses clés publiques (JWKS).

Un seul utilisateur : les plafonds d'utilisateurs des offres gratuites (de 7 500 à 1 million) ne départagent pas les fournisseurs. Ici, la « pérennité du gratuit » note la **solidité de l'éditeur** et la **possibilité de repli** s'il change son offre.

| Fournisseur | Pérennité du gratuit ×2 | Passkeys gratuites ×2 | Compatibilité Neon | Simplicité | Maturité | Indépendance | Score / 40 |
|---|---|---|---|---|---|---|---|
| **Hanko Cloud** | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | ★★★★★ | **33** |
| **WorkOS AuthKit** | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★☆☆☆ | **32** |
| **Better Auth** auto-hébergé (Cloudflare Workers) | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★☆☆☆ | ★★★☆☆ | ★★★★★ | **32** |
| **Descope** | ★★★★☆ | ★★★★★ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ★★☆☆☆ | **30** |
| **Clerk** | ★★★★☆ | ★★★☆☆ | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★☆☆☆ | **29** |
| **Auth0** | ★★★☆☆ | ★★★☆☆ | ★★★★★ | ★★★☆☆ | ★★★★★ | ★★☆☆☆ | **27** |

| Fournisseur | Points forts | Points faibles |
|---|---|---|
| **Hanko Cloud** | Conçu d'abord pour les passkeys. **Open source et auto-hébergeable** : si l'offre gratuite change, on peut l'héberger soi-même sans changer de solution. Composants web compatibles avec tous les frameworks, dont Svelte. | Petite entreprise. Absent de la liste de Neon : configuration JWKS générique, sans guide dédié. |
| **WorkOS AuthKit** | Passkeys et double authentification incluses dans l'offre gratuite. Éditeur solide. Cité dans la documentation de Neon. | Service propriétaire, orienté entreprises (B2B) : l'offre gratuite sert à attirer des clients payants et peut changer. Page de connexion hébergée chez WorkOS (redirection). Pas de SDK Svelte officiel. |
| **Better Auth** auto-hébergé | Gratuit et sans fournisseur tiers. Extension passkey officielle. Extension JWT avec clés publiques (JWKS). Données de connexion chez nous. | **Serveur de connexion à écrire, héberger et sécuriser soi-même** : plus de code et plus de surface d'attaque (contraire à STRAT04). |
| **Descope** | Passkeys incluses dans l'offre gratuite. Cité par Neon. | Moins connu. Configuration par « flux » visuels, plus déroutante. Service propriétaire. |
| **Clerk** | Guide officiel Neon. Très bonne expérience de développement. | Passkeys dans l'offre gratuite **non confirmées**. Pas de SDK Svelte officiel. Service propriétaire. |
| **Auth0** (Okta) | Le plus mature. Guide officiel Neon. | Offre gratuite réduite selon une source. Passkeys dans l'offre gratuite **non confirmées**. Lourd à configurer. |

Point commun : un seul fournisseur peut être branché sur la Data API de Neon à la fois.

## 4. Hors ligne et synchronisation

Point clé : les essais terminés sont **immuables** (RG18) et il n'y a qu'**un seul utilisateur**. La synchronisation consiste donc surtout à **ajouter** des essais, avec très peu de conflits possibles.

| Solution | Robustesse hors ligne ×2 | Pérennité du gratuit ×2 | Compatibilité SQL | Simplicité | Peu de dépendances | Maturité | Score / 40 |
|---|---|---|---|---|---|---|---|
| **Sur-mesure** : Dexie.js (IndexedDB) + file d'envoi | ★★★★☆ | ★★★★★ | ★★★★★ | ★★★☆☆ | ★★★★★ | ★★★★☆ | **35** |
| **RxDB** | ★★★★☆ | ★★★★☆ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | ★★★★☆ | **30** |
| **PowerSync** | ★★★★★ | ★★☆☆☆ | ★★★★★ | ★★★☆☆ | ★★☆☆☆ | ★★★★☆ | **28** |
| **Dexie Cloud** | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ | ★★★★★ | ★★★☆☆ | ★★★☆☆ | **28** |
| **Zero** (Rocicorp) | ★☆☆☆☆ | ★★★☆☆ | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ | ★★★☆☆ | **Éliminé** |
| **ElectricSQL** | ★★☆☆☆ | ★★☆☆☆ | ★★★★☆ | ★★☆☆☆ | ★★☆☆☆ | ★★★☆☆ | **19** |

| Solution | Points forts | Points faibles |
|---|---|---|
| **Sur-mesure** : Dexie.js + file d'envoi | Aucun service tiers ni quota, donc rien à suspendre. Fonctionne avec n'importe quel backend. Simple grâce aux essais immuables : un identifiant unique créé sur l'appareil évite les doublons (RG22, ES06). Dexie.js est mature et fonctionne avec tous les frameworks candidats. | **Code de synchronisation à écrire et à tester** : c'est là que peut naître MEN08. Les conflits sur les systèmes (lot 5) sont à gérer soi-même, par exemple avec « la dernière écriture gagne ». Pas de mise à jour en temps réel entre appareils : la synchronisation se fait à l'ouverture et au retour du réseau. |
| **RxDB** | Base locale réactive. Réplication vers Supabase ou une API déjà prête. | Certaines extensions sont payantes. Bibliothèque lourde, longue à prendre en main. |
| **PowerSync** | Le plus robuste : SQLite côté client, file d'envoi intégrée. Compatible avec Supabase et Neon. | Offre gratuite **désactivée après 7 jours d'inactivité**. Un service de plus. L'auto-hébergement exige un serveur, donc n'est pas gratuit. |
| **Dexie Cloud** | Synchronisation et connexion clés en main. | **Son propre serveur** : pas de base SQL à nous. Gratuit limité à 3 utilisateurs et 100 Mo. Petit éditeur. |
| **Zero** (Rocicorp) | Rapide, open source. | **Aucune écriture hors connexion** : contraire à ENF02, éliminé. |
| **ElectricSQL** | Open source, basé sur Postgres. | Synchronise seulement la lecture : écritures hors ligne à coder soi-même. Racheté par Databricks en août 2026, avec un service cloud incertain. |

## 5. Hébergement du front

| Hébergeur | Pérennité du gratuit ×2 | En-têtes HTTP (ES13) | Réseau mondial (CDN) | Satisfaction | Simplicité | Protection DDoS | Score / 35 |
|---|---|---|---|---|---|---|---|
| **Cloudflare Pages** | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★☆ | ★★★★☆ | ★★★★★ | **33** |
| **Vercel** (Hobby) | ★★★☆☆ | ★★★★★ | ★★★★★ | ★☆☆☆☆ | ★★★★★ | ★★★★☆ | **26** |
| **Netlify** (Free) | ★★☆☆☆ | ★★★★★ | ★★★★☆ | ★☆☆☆☆ | ★★★★★ | ★★★★☆ | **23** |
| **GitHub Pages** | ★★★★☆ | ★☆☆☆☆ | ★★★★☆ | ★★☆☆☆ | ★★★★☆ | ★★★☆☆ | **22** |

| Hébergeur | Points forts | Points faibles |
|---|---|---|
| **Cloudflare Pages** | Pas de limite de bande passante publiée, aucune clause « non commercial », 500 déploiements par mois. En-têtes de sécurité via un fichier `_headers` (ES13). Réseau mondial et protection DDoS. Le même compte peut lancer des tâches planifiées (sauvegarde ES17). Admiré à 53,2 %. | Cloudflare oriente les nouveaux projets vers Workers : Pages pourrait évoluer ou demander une migration. Interface plus technique. Mettre l'hébergement et la sauvegarde chez le même fournisseur les rend dépendants l'un de l'autre. |
| **Vercel** (Hobby) | Outillage excellent, déploiement très simple. En-têtes configurables. | Réservé à un usage non commercial. 100 Go par mois. Admiré à 39,2 %. |
| **Netlify** (Free) | Simple, en-têtes faciles à configurer. | Fonctionne par crédits (300 par mois, soit environ 15 Go) : quand ils sont épuisés, **tous les projets sont suspendus**. Admiré à 38,9 %. |
| **GitHub Pages** | Intégré au repo, gratuit. | **Aucun en-tête HTTP personnalisé** : ES13 impossible à respecter (pas de vraie politique CSP). |

## 6. Application de bureau

Besoin ajouté par le développeur pendant le benchmark : utiliser memory-trainer comme une application de bureau.

| Technologie | Gratuité, signature comprise ×2 | Hors ligne ×2 | Passkeys (ES02) | Légèreté | Réutilisation du code web | Maturité | Score / 40 |
|---|---|---|---|---|---|---|---|
| **PWA installée** | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★★ | ★★★★☆ | **39** |
| **Electron** | ★★★★☆ | ★★★★★ | ★★★☆☆ | ★☆☆☆☆ | ★★★★★ | ★★★★★ | **32** |
| **Tauri 2** | ★★★★☆ | ★★★★☆ | ★★☆☆☆ | ★★★★★ | ★★★★☆ | ★★★★☆ | **31** |
| **Wails** | ★★★★☆ | ★★★★☆ | ★★☆☆☆ | ★★★★☆ | ★★★☆☆ | ★★★☆☆ | **28** |
| **Neutralinojs** | ★★★★☆ | ★★★☆☆ | ★★☆☆☆ | ★★★★★ | ★★★★☆ | ★★☆☆☆ | **27** |

| Technologie | Points forts | Points faibles |
|---|---|---|
| **PWA installée** | La même application, installée depuis Chrome, Edge ou Safari (macOS 14 et plus), avec sa fenêtre et son icône dans le Dock. Aucun code en plus, mêmes passkeys et même hors ligne que sur le web. | Pas une « vraie » application native : elle dépend du navigateur, sans accès natif (fichiers, barre de menus). Firefox ne permet pas l'installation. |
| **Electron** | Très mature, utilisé par VS Code et Slack. Chromium embarqué : même comportement partout. | Très lourd : 80 à 200 Mo et beaucoup de mémoire. Passkeys partiellement prises en charge (à vérifier). |
| **Tauri 2** | Très léger (quelques Mo), car il utilise la fenêtre web du système. Stable depuis la version 2. | **Passkeys difficiles** : sur macOS, il faut une application signée avec un compte développeur Apple **payant** (contraire à ENF06) ; elles sont absentes sur Linux, et l'origin pose problème sur Windows. Parties natives en Rust. |
| **Wails** | Léger, parties natives en Go. | Mêmes limites de passkeys que Tauri. Communauté plus petite. |
| **Neutralinojs** | Le plus léger. | Le moins mature. Stockage hors ligne moins documenté. Mêmes limites de passkeys. |

Aucun chiffre de satisfaction 2026 : l'enquête Stack Overflow 2026 ne couvre plus ces outils. En 2023, Tauri était le plus admiré de sa catégorie.

## 7. Choix du développeur

Choix faits au vu des scores et des points faibles. Chaque choix sera consigné dans un ADR.

| Catégorie | Choix | ADR |
|---|---|---|
| Framework front | **Svelte** | [ADR 0001](adr/0001-framework-front-svelte.md) |
| Backend et base | **Neon** (PostgreSQL et Data API) | [ADR 0002](adr/0002-backend-neon.md) |
| Fournisseur de connexion | **Hanko Cloud** | [ADR 0003](adr/0003-connexion-hanko.md) |
| Hors ligne et synchro | **Sur-mesure** : Dexie.js et file d'envoi | [ADR 0004](adr/0004-hors-ligne-sur-mesure-dexie.md) |
| Hébergement du front | **Cloudflare Pages** | [ADR 0005](adr/0005-hebergement-cloudflare-pages.md) |
| Application de bureau | **PWA installée**, livrée dans un lot 7 après la 1.0 | [ADR 0006](adr/0006-bureau-pwa-installee.md) |

## Sources

Retours d'utilisateurs :

- [Stack Overflow 2026 — frameworks web](https://survey.stackoverflow.co/2026/technology/data/da-webframe), [plateformes cloud](https://survey.stackoverflow.co/2026/technology/data/da-platform), [bases de données](https://survey.stackoverflow.co/2026/technology/data/da-database)
- [State of JS 2025 — frameworks front](https://2025.stateofjs.com/en-US/libraries/front-end-frameworks/), [synthèse InfoQ](https://www.infoq.com/news/2026/03/state-of-js-survey-2025/), [synthèse Strapi](https://strapi.io/blog/state-of-javascript-2025-key-takeaways)

Backends :

- Supabase : [tarifs](https://supabase.com/pricing), [suspension des projets](https://supabase.com/docs/guides/platform/free-project-pausing), [passkeys (bêta)](https://supabase.com/changelog/46458-passkeys-for-supabase-auth-beta)
- Neon : [tarifs](https://neon.com/pricing), [Data API](https://neon.com/docs/data-api/overview), [authentification managée](https://neon.com/docs/auth/overview), [extensions prises en charge](https://neon.com/docs/auth/guides/plugins)
- Cloudflare : [limites de D1](https://developers.cloudflare.com/d1/platform/limits), [limites des Workers](https://developers.cloudflare.com/workers/platform/limits)
- Firebase : [authentification](https://firebase.google.com/docs/auth), [offre gratuite 2026](https://www.activepieces.com/blog/firebase-pricing-2026-plans-costs-and-free-limits)
- [Convex — limites](https://docs.convex.dev/production/state/limits), [Appwrite — offre gratuite](https://indieappstack.com/tools/appwrite), [PocketHost — FAQ](https://pockethost.io/docs/overview/faq/), [InstantDB — tarifs](https://www.instantdb.com/pricing)

Hors ligne :

- [PowerSync — tarifs](https://powersync.com/pricing), [Dexie Cloud — tarifs](https://dexie.org/pricing), [rachat d'Electric par Databricks](https://www.blocksandfiles.com/ai-ml/2026/08/12/oh-no-not-another-one-databricks-buys-electric/5286721), [comparatif Electric, PowerSync et Zero](https://kryptonforge.in/blog/local-first-sync-engines-electricsql-powersync-zero-2026)
- [WebKit — politique de stockage](https://webkit.org/?p=14403) (PWA installée sur iOS)

Hébergement :

- [Comparatif des offres gratuites (septembre 2026)](https://flaviocopes.com/hosting-free-tiers/), [Cloudflare Pages — en-têtes](https://developers.cloudflare.com/pages/configuration/headers/), [GitHub Pages — absence d'en-têtes](https://github.com/orgs/community/discussions/54257)

Connexion :

- [Neon — fournisseurs de connexion externes](https://neon.com/docs/data-api/custom-authentication-providers), [offres gratuites des fournisseurs d'identité (2026)](https://www.casdoor.com/blog/free-identity-providers), [WorkOS, Auth0 et Clerk comparés](https://guptadeepak.com/ciam-compass/guides/workos-vs-auth0-vs-clerk/), [fournisseurs sans mot de passe](https://securityboulevard.com/2026/05/12-best-auth0-alternatives-for-passwordless-authentication-in-2026/)

Application de bureau :

- [Tauri — passkeys dans la fenêtre web (ticket)](https://github.com/tauri-apps/tauri/issues/7926), [Tauri, Electron et Neutralinojs mesurés](https://dev.to/guang_diyuzhi_74b0fec2c09/tauri-vs-electron-vs-neutralinojs-bundle-size-and-ram-measured-2a21), [Tauri ou Electron en 2026](https://tech-insider.org/tauri-vs-electron-2026/)
