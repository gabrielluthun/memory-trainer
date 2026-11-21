# Stratégie de sécurisation

Elle ne contient aucune règle nouvelle : elle relie la [stratégie de l'analyse des menaces](../03-analyse-securite/menaces.md#4-stratégie-de-sécurisation), les [exigences de sécurité](../03-analyse-securite/exigences-securite.md) et les mesures décrites dans les six documents de sécurité de cette partie.

## En bref

- **5 règles** (STRAT01 à STRAT05) résument toute la sécurité du projet.
- Chaque règle mène à ses **menaces**, ses **exigences**, ses **mesures** et à la façon de la **vérifier**.
- **Les 19 exigences** ont chacune au moins une mesure décrite (section 3).
- Par où commencer : l'[introduction](introduction.md) pour le cadre, la [défense en profondeur](defense-en-profondeur.md) pour la vue d'ensemble par menace.

Les six documents de sécurité :

| Document | De quoi il parle |
|---|---|
| [Introduction](introduction.md) | Périmètre, principes, risques de l'OWASP adaptés au projet |
| [Défense en profondeur](defense-en-profondeur.md) | Les protections couche par couche, et au moins deux par menace forte |
| [Surface d'attaque](surface-attaque.md) | Ce qui est exposé, et tout ce qu'on désactive |
| [Sécurité de la base](bdd.md) | Accès, intégrité, secrets, sauvegardes, restauration |
| [Sécurité du front](front.md) | En-têtes, CSP, affichage sans injection, données sur l'appareil |
| [Sécurité du back](back.md) | Connexion Hanko, jeton de session, Worker, CI, alertes |

## 1. Les 5 règles

| Règle | Menaces | Exigences | Mesures | Vérification |
|---|---|---|---|---|
| **STRAT01** : La base fait la loi | MEN01, MEN02, MEN08 | ES04 à ES07 | Règles RLS et droits ([sécurité de la base](bdd.md#1-accès), [accès aux données](../04-specifications/acces.md)) ; contraintes, contrôles différés, essais immuables ([sécurité de la base](bdd.md#2-intégrité), [modèle physique](../04-specifications/bdd/mpd.md)) ; vérification du jeton ([sécurité du back](back.md#3-vérification-du-jeton-par-la-data-api)) | 31 cas de test de la base, à reprendre dans la CI ([sécurité de la base](bdd.md#8-tests-automatiques-de-la-base)) |
| **STRAT02** : Rien de privé dans le repo | MEN03, MEN11 | ES08 à ES11 | Aucun secret dans le front ([sécurité du front](front.md#5-aucune-clé-secrète-dans-le-front)) ; secrets rangés et procédure de changement ([sécurité de la base](bdd.md#3-mots-de-passe-clés-et-secrets)) ; aucun identifiant de production sur le poste ([surface d'attaque](surface-attaque.md)) ; CI au moindre privilège ([sécurité du back](back.md#6-ci-github-actions)) | Scan des secrets avant chaque commit et chaque push ; recherche de secrets dans le build ; relecture du diff avant `main` |
| **STRAT03** : Un seul compte, bien protégé | MEN01, MEN04, MEN12 | ES01 à ES03 | Inscription fermée, passkey seule, sessions de 12 heures révocables ([sécurité du back](back.md#1-connexion-hanko)) ; compte unique imposé par la base ([défense en profondeur](defense-en-profondeur.md#2-menaces-à-risque-fort--au-moins-deux-protections-indépendantes)) ; double authentification sur GitHub ([défense en profondeur](defense-en-profondeur.md#4-double-authentification-des-comptes-des-fournisseurs)) | Une inscription échoue ; un compte inconnu ne lit rien (testé dans l'[accès aux données](../04-specifications/acces.md)) ; « tout déconnecter » oblige à se reconnecter |
| **STRAT04** : Le moins de choses possible | MEN05, MEN06, MEN07 | ES12 à ES16 | Surface réduite élément par élément ([surface d'attaque](surface-attaque.md)) ; en-têtes, CSP, affichage sans HTML brut, dépendances ([sécurité du front](front.md)) ; polices auto-hébergées ([décision sur les polices](../04-specifications/adr/0020-polices-auto-hebergees.md)) ; aucun moyen de paiement, alertes de consommation ([sécurité du back](back.md#7-journalisation-et-alertes)) | Analyse des en-têtes en production ; audit des dépendances dans la CI ; inspection des requêtes réseau ; un texte avec `<script>` s'affiche tel quel |
| **STRAT05** : Toujours pouvoir revenir en arrière | MEN08, MEN09, MEN10 | ES17 à ES19 | Export quotidien par tâche cron, export complet avant migration, données sur l'appareil ([sécurité de la base](bdd.md#5-sauvegardes)) ; restauration ([sécurité de la base](bdd.md#6-restauration)) ; migrations par la CI seulement ([sécurité du back](back.md#6-ci-github-actions)) | Restauration testée à chaque lot dans une base locale ; alerte par e-mail si la sauvegarde échoue |

## 2. Principes transverses

| Principe | Où il est appliqué |
|---|---|
| **Défense en profondeur** : au moins deux protections indépendantes par menace forte | [Défense en profondeur](defense-en-profondeur.md) : 7 menaces fortes, 3 protections chacune |
| **Refus par défaut** : tout est interdit tant qu'une règle ne l'autorise pas | RLS et droits ([accès aux données](../04-specifications/acces.md)), CSP ([sécurité du front](front.md#2-politique-de-sécurité-du-contenu-csp)) |
| **Moindre privilège** : chaque rôle n'a que ce dont il a besoin | Rôles de la base ([sécurité de la base](bdd.md#1-accès)), secrets de la CI et du Worker ([sécurité du back](back.md)) |
| **Risques adaptés au projet** : l'OWASP Top 10:2025, filtré | [Introduction](introduction.md#4-risques-adaptés-au-projet-owasp-top-102025) |

## 3. Exigences et mesures

| Exigence | Mesures principales | Où |
|---|---|---|
| **ES01** : Inscription fermée | Inscription désactivée chez Hanko ; clé étrangère vers le seul compte autorisé | [Sécurité du back](back.md), [défense en profondeur](defense-en-profondeur.md) |
| **ES02** : Connexion par passkey | Passkey seule ; origine limitée à l'application | [Surface d'attaque](surface-attaque.md), [sécurité du back](back.md) |
| **ES03** : Sessions révocables | 12 heures ; « déconnecter toutes les sessions » ; jeton en cookie sécurisé | [Sécurité du back](back.md) |
| **ES04** : Accès réservé au propriétaire | RLS sur les 6 tables ; `anonymous` sans droit ; tests de la CI | [Sécurité de la base](bdd.md), [accès aux données](../04-specifications/acces.md) |
| **ES05** : Essais terminés immuables | Aucun droit de modification ; déclencheur qui refuse pour tous les rôles | [Sécurité de la base](bdd.md), [modèle physique](../04-specifications/bdd/mpd.md) |
| **ES06** : Synchronisation sans doublon | Identifiant créé sur l'appareil ; verrou d'envoi | [Sécurité de la base](bdd.md), [décision sur le repère de réception](../04-specifications/adr/0011-repere-numero-ordre-verrou.md) |
| **ES07** : Validation par la base | Contraintes, types ENUM, contrôles différés | [Sécurité de la base](bdd.md), [modèle physique](../04-specifications/bdd/mpd.md) |
| **ES08** : Aucune clé secrète côté client | Configuration publique seulement ; recherche de secrets dans le build | [Sécurité du front](front.md) |
| **ES09** : Secrets hors du repo | Scan avant commit et push ; secrets dans la CI et le Worker ; procédure de changement | [Sécurité de la base](bdd.md), [sécurité du back](back.md) |
| **ES10** : Aucune donnée réelle dans le repo | Compte autorisé tiré d'un secret ; sauvegardes et exports dans R2 ; aucune donnée dans les journaux | [Sécurité de la base](bdd.md), [sécurité du back](back.md) |
| **ES11** : CI au moindre privilège | Environnement de production réservé à `main` ; jeton en lecture seule par défaut ; Worker en lecture seule | [Surface d'attaque](surface-attaque.md), [sécurité du back](back.md) |
| **ES12** : Aucun HTML brut | Texte échappé par Svelte ; `{@html}` interdit par le lint | [Sécurité du front](front.md) |
| **ES13** : En-têtes de sécurité | HSTS, CSP, `nosniff`, `Referrer-Policy`, `Permissions-Policy` | [Sécurité du front](front.md) |
| **ES14** : Dépendances maîtrisées | Versions figées, audit, alertes, actions épinglées | [Surface d'attaque](surface-attaque.md), [sécurité du front](front.md) |
| **ES15** : Aucun traceur | Aucune ressource tierce ; aucun journal envoyé par l'application | [Surface d'attaque](surface-attaque.md), [sécurité du front](front.md), [sécurité du back](back.md) |
| **ES16** : Aucun moyen de paiement | Aucun moyen de paiement enregistré ; alertes de consommation | [Surface d'attaque](surface-attaque.md), [sécurité du back](back.md) |
| **ES17** : Sauvegardes externes | Export quotidien vers R2 par tâche cron ; restauration testée à chaque lot | [Sécurité de la base](bdd.md) |
| **ES18** : Export complet | Fichiers JSON des sauvegardes, au format ouvert | [Sécurité de la base](bdd.md) |
| **ES19** : Migrations sûres | Par la CI seulement ; export complet juste avant | [Sécurité de la base](bdd.md), [sécurité du back](back.md) |

## 4. À vérifier au sprint 0

Les points à vérifier relevés dans les documents de sécurité, regroupés pour le sprint 0.

| Point | Détail |
|---|---|
| Réglages de Hanko : inscription fermée, passkey seule, sessions de 12 heures, révocation | [Surface d'attaque](surface-attaque.md#4-à-vérifier-au-sprint-0), [sécurité du back](back.md) |
| Réglages de Cloudflare : prévisualisations désactivées, Worker sans route, R2 privé | [Surface d'attaque](surface-attaque.md#4-à-vérifier-au-sprint-0) |
| Réglages de GitHub : jeton en lecture seule, environnement de production, scan des secrets | [Surface d'attaque](surface-attaque.md#4-à-vérifier-au-sprint-0), [sécurité du back](back.md) |
| Chiffrement au repos de Neon et de R2 | [Sécurité de la base](bdd.md) |
| Empreinte du script de démarrage de SvelteKit dans la CSP ; adresses de Neon et de Hanko | [Sécurité du front](front.md) |
| Contrôle de l'émetteur des jetons par la Data API ; notifications d'erreur des Workers | [Sécurité du back](back.md) |
