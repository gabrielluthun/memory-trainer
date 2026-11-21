# SE2 — Défense en profondeur

Amont : [introduction](introduction.md), [menaces](../03-analyse-securite/menaces.md), [exigences de sécurité](../03-analyse-securite/exigences-securite.md), [MPD](../04-specifications/bdd/mpd.md), [accès aux données](../04-specifications/acces.md).

## En bref

- **8 couches de protection**, de l'appareil aux comptes des fournisseurs. Chacune est détaillée dans SE3 à SE6.
- **Les 7 menaces à risque fort ont chacune au moins 3 protections indépendantes.** Si l'une cède, les autres tiennent (section 2).
- **Les 5 menaces à risque moyen ou faible** ont chacune au moins 2 protections, ou un risque restant accepté (section 3).
- **Comptes des fournisseurs** : la double authentification est **active sur GitHub**, et **recommandée** sur Cloudflare, Neon et Hanko, au choix du développeur (section 4).

## 1. Couches de protection

| Couche | Protections | Exigences | Détail |
|---|---|---|---|
| **Appareil** (application, base locale) | Aucun texte inséré comme du HTML ; aucune clé secrète dans le code ; essai terminé et ajout à la file d'envoi dans une même transaction ; stockage persistant demandé | ES08, ES12, ENF07 | SE5 |
| **Hébergement** (Cloudflare Pages) | HTTPS imposé (HSTS) ; politique de sécurité du contenu qui n'autorise que l'application, Neon et Hanko ; fichiers statiques seulement, aucun code serveur | ES13 | SE3, SE5 |
| **Connexion** (Hanko) | Inscription fermée ; passkey seulement ; sessions de durée limitée, révocables depuis n'importe quel appareil | ES01 à ES03 | SE6 |
| **Point d'entrée de la base** (Data API) | Jeton vérifié avec les clés publiques de Hanko ; sans jeton, rôle `anonymous` sans aucun droit | ES04 | SE4, SE6 |
| **Base** (Neon) | RLS sur chaque table, refus par défaut ; clés étrangères vers le seul compte autorisé ; droits minimaux par rôle ; contraintes et types ENUM ; contrôles différés de chaque essai ; essais immuables pour tous les rôles | ES04 à ES07 | SE4 |
| **Sauvegarde** (Worker, R2) | Copie quotidienne chez un autre fournisseur que la base, en lecture seule, dans un espace privé ; export complet ; restauration testée à chaque lot | ES17, ES18 | SE4 |
| **Repo et CI** (GitHub) | Scan des secrets avant chaque commit et chaque push ; secrets uniquement dans la CI, limités par tâche ; versions figées des dépendances et audit ; fusion vers `main` seulement si la CI est verte ; migrations par la CI seulement, après une sauvegarde | ES09 à ES11, ES14, ES19 | SE3, SE6 |
| **Comptes des fournisseurs** | Aucun moyen de paiement ; alertes de consommation ; double authentification active sur GitHub, recommandée ailleurs (section 4) | ES16 | SE6 |

## 2. Menaces à risque fort : au moins deux protections indépendantes

| Menace | Protection 1 | Protection 2 | Protection 3 | Si une protection cède |
|---|---|---|---|---|
| **MEN01** : Inscription d'un inconnu | Inscription fermée chez Hanko | La base n'accepte que le compte autorisé : clé étrangère vers `accounts` | RLS : un inconnu ne voit aucune ligne | Si l'inscription s'ouvre par erreur, l'inconnu ne peut ni lire ni écrire (testé, S11). |
| **MEN02** : Base mal protégée | RLS sur chaque table, refus par défaut | Droits retirés à tous, puis donnés un par un | Tests de la CI : une requête sans connexion échoue sur chaque table, et aucune table n'est sans RLS | Si une règle manque, les droits bloquent encore ; si les deux manquent, le test de la CI échoue avant la mise en ligne. |
| **MEN03** : Secret publié sur GitHub | Scan local avant chaque commit | Blocage des pushs contenant un secret par GitHub | Secrets limités à une tâche et révocables, procédure écrite ; le front ne contient aucun secret | Si un secret passe malgré tout, sa révocation le rend inutile. |
| **MEN06** : Dépendance piratée | Peu de dépendances, versions figées par le fichier de verrouillage | Audit et alertes de vulnérabilité ; chaque nouvelle dépendance justifiée et chaque mise à jour relue | La politique de sécurité du contenu limite les adresses que le code peut appeler ; les secrets de la CI sont limités par tâche | Risque restant **moyen, accepté** ([A2](../03-analyse-securite/menaces.md)) : un code piraté peut encore agir dans l'application, mais il ne peut envoyer les données qu'à Neon ou à Hanko. |
| **MEN08** : Historique abîmé par un bug | Essais immuables : aucun droit de modification ni de suppression, et un déclencheur qui refuse pour tous les rôles | Identifiant unique créé sur l'appareil et verrou d'envoi : jamais de doublon ni d'essai sauté | Contrôles différés : un essai incomplet ou incohérent est refusé ; sauvegarde quotidienne | Si un bug envoie un essai faux, la base le refuse ; s'il passait, la sauvegarde permet de revenir en arrière. |
| **MEN09** : Erreur de manipulation | Migrations seulement par la CI, jamais à la main | Sauvegarde juste avant chaque migration | Le déclencheur d'immuabilité refuse même au rôle de migration ; historique de restauration de Neon sur 6 heures | Si une migration est fausse, elle ne peut pas effacer d'essai ; si elle casse la structure, la sauvegarde la répare. |
| **MEN10** : Panne ou fin du fournisseur | Sauvegarde quotidienne chez un autre fournisseur (R2) | Toutes les données sont aussi sur l'appareil, utilisables hors ligne | Export complet ; restauration testée à chaque lot | Si Neon disparaît, l'appareil et la sauvegarde ont tout ; l'entraînement continue hors ligne. |

## 3. Menaces à risque moyen ou faible

| Menace | Risque | Protections | Risque restant |
|---|---|---|---|
| **MEN04** : Vol du compte | Moyen | Passkey, qui résiste à l'hameçonnage ; sessions limitées et révocables ; double authentification sur GitHub | Faible |
| **MEN05** : Injection de script (XSS) | Moyen | Aucun texte inséré comme du HTML ; politique de sécurité du contenu qui bloque les scripts non prévus | Faible |
| **MEN07** : Consommation anormale des quotas | Moyen | Aucun moyen de paiement : le service s'arrête au lieu de facturer ; alertes de consommation ; mode hors ligne en secours | Faible |
| **MEN11** : Données réelles publiées par erreur | Moyen | Sauvegardes et exports hors du repo ; tests avec des données fictives ; relecture du diff avant `main` | Faible |
| **MEN12** : Appareil perdu ou volé | Faible | Verrouillage de l'appareil ; révocation de toutes les sessions depuis un autre appareil | **Accepté** |

## 4. Double authentification des comptes des fournisseurs

| Compte | État | Ce qu'un attaquant pourrait faire avec |
|---|---|---|
| **GitHub** | **Active** | Publier une version piratée de l'application, lire les secrets de la CI |
| **Neon** | Recommandée, au choix du développeur | Lire ou vider la base, en dehors des règles RLS |
| **Cloudflare** | Recommandée, au choix du développeur | Remplacer le site, lire ou effacer les sauvegardes R2 |
| **Hanko** | Recommandée, au choix du développeur | Ouvrir l'inscription, ajouter une passkey au compte |

Décision (2026-11-21) : ce n'est **pas une exigence**. Elle est appliquée sur GitHub, le compte le plus exposé, et laissée au choix du développeur pour les trois autres. Si l'un d'eux est pris, les autres protections limitent les dégâts : sauvegardes chez un autre fournisseur que la base, essais immuables, inscription refusée par la base même si Hanko l'ouvrait.
