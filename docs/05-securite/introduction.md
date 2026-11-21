# SE1 — Introduction et principes

Amont : [statut RGPD](../03-analyse-securite/rgpd.md), [menaces](../03-analyse-securite/menaces.md), [exigences de sécurité](../03-analyse-securite/exigences-securite.md), [architecture](../04-specifications/architecture.md), [accès aux données](../04-specifications/acces.md).

## En bref

- **La partie 5 transforme les exigences ES01 à ES19 en mesures techniques**, couche par couche. Elle ne crée pas de nouvelle menace ni de nouvelle exigence : elle part de l'analyse de la partie 3.
- **Le plus grave serait de perdre ou de modifier l'historique des essais.** Que quelqu'un lise les scores serait sans importance. Les protections suivent cette échelle.
- **Cinq règles guident tout** (STRAT01 à STRAT05) : la base fait la loi, rien de privé dans le repo, un seul compte bien protégé, le moins de choses possible, toujours pouvoir revenir en arrière.
- **Les risques sont vérifiés avec l'OWASP Top 10:2025**, filtré pour ce projet (section 4) : 8 risques s'appliquent, 2 en partie.
- **Référentiels** : ANSSI, CNIL et OWASP. L'analyse RGPD du projet n'est **pas un avis juridique**.

## 1. Périmètre

| Élément | Couvert | Pourquoi |
|---|---|---|
| **Application** (PWA SvelteKit, service worker, base locale Dexie.js) | Oui | Tout le code s'exécute sur l'appareil ; il peut être lu et contourné. |
| **Base Neon et Data API** | Oui | Elle garde la copie de référence et décide de chaque accès (STRAT01). |
| **Connexion Hanko** | Oui, sa configuration | Inscription fermée, passkeys, durée des sessions. Le service lui-même est géré par Hanko. |
| **Cloudflare** : Pages, Worker de sauvegarde, R2 | Oui, leur configuration | En-têtes de sécurité, secrets du Worker, espace privé des sauvegardes. |
| **GitHub** : repo public et CI | Oui | Le repo est public, et la CI détient les secrets de déploiement. |
| **Poste du développeur** | En partie | Fichier `.env`, clés GPG et SSH, accès aux comptes des fournisseurs. |
| **Infrastructure des fournisseurs** | Non | HTTPS, saturation massive, accès physique : pris en charge par les fournisseurs ([menaces](../03-analyse-securite/menaces.md), section 3). |
| **Appareils du pratiquant** | Non | Leur verrouillage relève du pratiquant ; un appareil perdu est un risque faible, accepté (MEN12). |

## 2. Ce qu'on protège

| Si… | Gravité | Mesures en priorité |
|---|---|---|
| un essai est **perdu ou modifié** | **Forte** | Essais immuables en base, sauvegardes hors du fournisseur, restauration testée |
| quelqu'un **prend le contrôle du compte** | **Forte** | Passkey, inscription fermée, sessions révocables |
| le site est **en panne** | Moyenne | Mode hors ligne : l'entraînement continue |
| quelqu'un **lit** les essais | Faible | Règles d'accès en base, sans chiffrement supplémentaire |

## 3. Principes

| Principe | Concrètement | Exigences |
|---|---|---|
| **STRAT01** : La base fait la loi | Le front peut être lu et contourné. Les règles RLS, les contraintes et les déclencheurs de la base décident de tout. | ES04 à ES07 |
| **STRAT02** : Rien de privé dans le repo | Ni secret ni donnée réelle ; un scan bloque les commits et les pushs fautifs. | ES08 à ES11 |
| **STRAT03** : Un seul compte, bien protégé | Inscription fermée, passkey, sessions révocables, compte autorisé seul accepté par la base. | ES01 à ES03 |
| **STRAT04** : Le moins de choses possible | Peu de dépendances, peu de services, aucun moyen de paiement, aucune ressource tierce (polices auto-hébergées). | ES12 à ES16 |
| **STRAT05** : Toujours pouvoir revenir en arrière | Sauvegarde quotidienne chez un autre fournisseur, export complet, restauration testée à chaque lot. | ES17 à ES19 |
| **Défense en profondeur** | Chaque menace à risque fort a **au moins deux protections indépendantes**. | [défense en profondeur](defense-en-profondeur.md) |
| **Refus par défaut** | Tout est interdit tant qu'une règle ne l'autorise pas : RLS sur chaque table, droits retirés à tous puis donnés un par un. | ES04, [accès aux données](../04-specifications/acces.md) |
| **Moindre privilège** | Chaque rôle n'a que ce dont il a besoin : l'application insère et lit, la sauvegarde lit, la CI migre. | ES11, [accès aux données](../04-specifications/acces.md) |

## 4. Risques adaptés au projet (OWASP Top 10:2025)

| Risque OWASP | S'applique | Ici, concrètement | Menaces | Traité en |
|---|---|---|---|---|
| **A01** : Contrôle d'accès défaillant | Oui | Une table sans règle RLS, ou un compte inconnu qui lit ou écrit. La falsification de requête côté serveur (SSRF), rattachée à A01, est sans objet : il n'y a aucun serveur maison qui appelle d'autres adresses. | MEN01, MEN02 | [sécurité de la base](bdd.md), [accès aux données](../04-specifications/acces.md) |
| **A02** : Mauvaise configuration | Oui | Inscription Hanko laissée ouverte, en-têtes de sécurité absents, bucket R2 public. | MEN01, MEN02, MEN05 | [surface d'attaque](surface-attaque.md), [sécurité du front](front.md) |
| **A03** : Failles de la chaîne d'approvisionnement logicielle | Oui | Paquet npm ou action GitHub piratés, qui s'exécutent dans l'application ou la CI. | MEN06 | [surface d'attaque](surface-attaque.md), [sécurité du front](front.md) |
| **A04** : Défaillances cryptographiques | En partie | Le chiffrement est assuré par les fournisseurs (HTTPS, stockage), les jetons sont signés par Hanko, les passkeys ne quittent pas l'appareil. L'application ne chiffre rien elle-même. | MEN04 | [sécurité du back](back.md) |
| **A05** : Injection | En partie | Injection de script (XSS) par un texte affiché comme du HTML. L'injection SQL est écartée : l'application ne construit aucune requête SQL, et les fonctions SQL n'utilisent pas de SQL dynamique. | MEN05 | [sécurité du front](front.md), [sécurité de la base](bdd.md) |
| **A06** : Conception non sécurisée | Oui | Traité par la démarche elle-même : [menaces](../03-analyse-securite/menaces.md), [exigences de sécurité](../03-analyse-securite/exigences-securite.md), puis cette partie, avant le code. | Toutes | Analyse des menaces, partie 5 |
| **A07** : Échecs d'authentification | Oui | Vol du compte, session trop longue, session restée ouverte sur un appareil perdu. | MEN04, MEN12 | [sécurité du back](back.md) |
| **A08** : Intégrité des logiciels et des données | Oui | Essai modifié ou en double, migration destructrice, version piratée de l'application servie aux appareils. | MEN08, MEN09 | [sécurité de la base](bdd.md), [sécurité du back](back.md) |
| **A09** : Journalisation et alertes défaillantes | Oui | Une panne de sauvegarde ou une consommation anormale passent inaperçues. Pas d'observabilité complète en version Solo : seules les alertes utiles sont prévues. | MEN07, MEN10 | [sécurité du back](back.md) |
| **A10** : Mauvaise gestion des situations exceptionnelles | Oui | Coupure réseau pendant la synchronisation, essai refusé par la base, interruption pendant un essai : aucune ne doit perdre ni dupliquer un essai. | MEN08 | [sécurité du back](back.md), [séquence de synchronisation](../04-specifications/uml/sequences.md) |

## 5. Référentiels

| Référentiel | Utilisé pour |
|---|---|
| **ANSSI**, *EBIOS Risk Manager* | Méthode de l'analyse des menaces, allégée ([menaces](../03-analyse-securite/menaces.md)) |
| **ANSSI**, *Guide d'hygiène informatique* | Secrets, mises à jour, sauvegardes, moindre privilège |
| **ANSSI**, recommandations pour la mise en œuvre d'un site web (sécurité côté navigateur) | En-têtes HTTP, politique de sécurité du contenu, cookies ([sécurité du front](front.md)) |
| **CNIL**, *Guide de la sécurité des données personnelles* | Bonnes pratiques, même si le RGPD ne s'applique pas ([statut RGPD](../03-analyse-securite/rgpd.md)) |
| **OWASP Top 10:2025** | Liste de contrôle des risques, filtrée pour le projet (section 4) |

**Avertissement** : le statut RGPD du projet (usage strictement personnel, [statut RGPD](../03-analyse-securite/rgpd.md)) est une analyse, pas un avis juridique.

## 6. Organisation de la partie 5

| Élément | Contenu |
|---|---|
| **SE1** : Introduction et principes | Ce document |
| **SE2** : Défense en profondeur | Les protections, couche par couche, et les deux protections indépendantes de chaque menace forte |
| **SE3** : Réduction de la surface d'attaque | Ce qui est exposé, et tout ce qu'on désactive ou retire |
| **SE4** : Sécurisation de la base | Règles d'accès, clés, sauvegardes et restauration |
| **SE5** : Sécurisation du front | En-têtes, dépendances, stockage local, aucune clé secrète |
| **SE6** : Sécurisation du back et de l'authentification | Hanko, jetons et sessions, Worker, CI, alertes |
| **Stratégie de sécurisation** (ajout du développeur) | Page pivot : de chaque règle STRAT aux exigences ES et aux mesures des six documents de sécurité |

## Sources

- OWASP, [Top 10:2025](https://owasp.org/Top10/2025/0x00_2025-Introduction/)
