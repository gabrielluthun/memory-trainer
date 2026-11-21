# SE3 — Réduction de la surface d'attaque

Amont : [introduction](introduction.md), [défense en profondeur](defense-en-profondeur.md), [menaces](../03-analyse-securite/menaces.md) (section 2), [architecture](../04-specifications/architecture.md), [accès aux données](../04-specifications/acces.md).

## En bref

- **Quatre portes restent ouvertes sur internet** : le site, la Data API de Neon, la connexion Hanko et le repo GitHub public. Tout le reste est fermé ou n'a pas d'adresse.
- **Rien n'est activé sans besoin** : pas de code serveur sur Cloudflare Pages, pas d'adresse web pour le Worker, pas d'accès public à R2, aucune donnée pour un visiteur sans jeton, aucun script ni service tiers.
- **Trois décisions** : connexion par **passkey seule**, **aucun identifiant de production** sur le poste du développeur, **aucune prévisualisation** publique des branches.
- Chaque réglage est à vérifier au sprint 0 (section 4).

## Décisions prises

| Décision | Choix du développeur | Menaces |
|---|---|---|
| **Méthodes de connexion** | **Passkey seule** : mot de passe et code par e-mail désactivés. En cas de perte de toutes les passkeys, l'accès se recrée depuis la console Hanko. | MEN04 |
| **Identifiants de production** | **Aucun sur le poste du développeur** : seule la CI les détient. La production se consulte depuis la console Neon. | MEN03, MEN09 |
| **Prévisualisations Cloudflare Pages** | **Désactivées** : seule la branche `main` est publiée. Les releases s'essaient en local. | MEN02, MEN11 |

## 1. Ce qui reste exposé

| Porte | Ce qu'un inconnu peut atteindre | Ce qui le limite |
|---|---|---|
| **Site** (Cloudflare Pages) | Les fichiers statiques de l'application, lisibles en entier | Aucun code serveur ; aucun secret dans les fichiers (ES08) ; en-têtes de sécurité ([sécurité du front](front.md)) |
| **Data API** (Neon) | Les tables et les deux fonctions du schéma `public` | Sans jeton : rôle `anonymous`, aucun droit. Avec un jeton d'un autre compte : RLS et clé étrangère vers le compte unique ([accès aux données](../04-specifications/acces.md)) |
| **Connexion** (Hanko) | La page de connexion par passkey | Inscription fermée (ES01), passkey seule |
| **Repo** (GitHub, public) | Le code, la configuration, l'historique | Aucun secret ni donnée réelle (ES09, ES10) ; scan avant chaque commit et chaque push |

## 2. Ce qu'on désactive ou retire

| Élément | Désactivé ou retiré | Pourquoi | Exigences |
|---|---|---|---|
| **Application** | Aucun script, police, image ni service chargé depuis un autre site ; aucun `eval` ni HTML inséré depuis une chaîne | Pas de code étranger dans la page ; la politique de sécurité du contenu peut tout interdire par défaut | ES12, ES13, ES15, [ADR 0020](../04-specifications/adr/0020-polices-auto-hebergees.md) |
| **Cloudflare Pages** | Pas de code serveur (aucune fonction Pages) ; **prévisualisations des branches désactivées** ; seule `main` est publiée | Rien à attaquer côté serveur ; aucune version de travail en ligne | ES13 |
| **Data API** | Seul le schéma `public` est exposé ; `anonymous` n'a aucun droit ; seules `submit_trial` et `save_settings` sont exécutables, par `authenticated` | Un visiteur sans jeton n'atteint rien ; les fonctions internes (déclencheurs) ne sont pas appelables | ES04, [accès aux données](../04-specifications/acces.md) |
| **Base Neon** | Aucune chaîne de connexion dans le front ; deux rôles à mot de passe seulement : migration (CI) et `backup_reader` (Worker) | L'application ne passe que par la Data API, avec un jeton | ES08, ES11 |
| **Hanko** | **Inscription fermée** ; **passkey seule** : mot de passe et code par e-mail désactivés ; connexion par réseaux sociaux non configurée | Aucune méthode hameçonnable ; la boîte mail n'est pas une porte d'entrée | ES01, ES02 |
| **Worker de sauvegarde** | Déclenché uniquement par le planificateur : aucune route web, sous-domaine `workers.dev` désactivé | Personne ne peut le déclencher ni l'interroger depuis internet | ES11, ES17 |
| **R2** | Bucket privé : accès public et adresse `r2.dev` désactivés, aucun domaine personnalisé | Les sauvegardes ne sont lisibles que par le Worker et le développeur | ES17 |
| **GitHub Actions** | Jeton par défaut en lecture seule, élargi tâche par tâche ; aucune machine d'exécution personnelle ; pas de secrets pour les pull requests venant de copies du repo ; actions tierces épinglées par empreinte de version | La CI ne peut faire que ce dont chaque tâche a besoin (A03 de l'OWASP) | ES11, ES14 |
| **Dépendances** | Seulement celles du benchmark : SvelteKit, vite-plugin-pwa, Dexie.js, composants Hanko, outils de test et de lint. Chaque ajout est justifié | Moins de code tiers, moins de risque de dépendance piratée (MEN06) | ES14 |
| **Données** | Rien d'autre que les essais et les paramètres ; ni e-mail, ni nom, ni date de réception en base | Moins de données, moins à protéger ([dictionnaire](../04-specifications/bdd/dictionnaire.md)) | ES15 |
| **Poste du développeur** | **Aucun identifiant de production** ; le `.env` ne contient que ceux de la branche Neon de dev | Une erreur de commande ou un poste compromis ne touche jamais la production | ES09, ES19 |
| **Comptes des fournisseurs** | Aucun moyen de paiement ; double authentification active sur GitHub | Pas de facturation possible ; compte le plus exposé protégé ([défense en profondeur](defense-en-profondeur.md)) | ES16 |

## 3. Ce qui reste volontairement ouvert

| Élément | Pourquoi | Risque restant |
|---|---|---|
| **Repo public** | Choix du projet : il donne gratuitement les Actions, la détection des secrets et le blocage des pushs qui en contiennent ([contraintes techniques](../04-specifications/contraintes-techniques.md)) | Faible : rien de privé n'y entre (STRAT02) |
| **Data API accessible à tous** | Nécessaire pour que l'application fonctionne sans serveur maison | Faible : refus par défaut, testé dans l'[accès aux données](../04-specifications/acces.md) |
| **Rôles à mot de passe de Neon** | Nécessaires à la CI et au Worker | Faible : mots de passe uniquement dans leurs secrets, changés en cas de doute ([sécurité de la base](bdd.md)) |

## 4. À vérifier au sprint 0

| Réglage | Où |
|---|---|
| Inscription fermée, passkey seule, mot de passe et code par e-mail désactivés | Console Hanko |
| Prévisualisations désactivées, publication depuis `main` seulement | Cloudflare Pages |
| Aucune fonction Pages dans le build | Repo |
| Sous-domaine `workers.dev` désactivé, déclencheur planifié seul | Cloudflare Workers |
| Accès public et adresse `r2.dev` désactivés sur le bucket | Cloudflare R2 |
| Schéma `public` seul exposé par la Data API | Console Neon |
| Jeton par défaut des Actions en lecture seule ; actions tierces épinglées | GitHub |
| Scan des secrets et blocage des pushs actifs | GitHub, poste du développeur |
| Aucun moyen de paiement enregistré | Les quatre fournisseurs |
