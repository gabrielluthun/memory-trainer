# A2 — Menaces principales

Amont : [statut RGPD](rgpd.md), [exigences](../01-besoin/exigences.md), [risques projet](../02-projet/risques.md).

Méthode : inspirée d'EBIOS RM (Expression des Besoins et Identification des Objectifs de Sécurité - Risk Manager, ANSSI), très allégée.

## En bref

- Le plus grave serait de **perdre ou de modifier l'historique des essais**. Qu'un inconnu lise les scores serait sans importance.
- Les attaques réalistes viennent de **robots** qui balaient internet. Elles exploitent deux erreurs classiques : **une base de données mal protégée** et **un secret publié sur GitHub**.
- Les autres risques sérieux sont **internes** : un bug de synchronisation, une erreur de migration ou la fin d'une offre gratuite.

## 1. Ce qui est en jeu

| Si… | Gravité | Pourquoi |
|---|---|---|
| un essai ou un système est **perdu ou modifié** | **Forte** | C'est la raison d'être de l'application (RG18, ENF07). |
| quelqu'un **prend le contrôle du compte** | **Forte** | Il peut tout modifier ou tout supprimer. |
| quelqu'un **lit** les essais ou les systèmes | **Faible** | Ce ne sont que des scores et des images mentales. |
| le site est **en panne** | **Moyenne** | Le mode hors ligne permet de continuer à s'entraîner. |

> Hypothèse à valider : une panne du site est de gravité **moyenne**, grâce au hors ligne (ENF02).

## 2. Ce qui est visible depuis internet

| Élément | Ce qu'un inconnu peut faire |
|---|---|
| **Code du front** | Le lire en entier, y compris la **clé publique** d'accès à la base. C'est normal : cette clé n'est pas un secret. |
| **Base de données** | Lui envoyer des requêtes avec cette clé. Seules les **règles d'accès définies dans la base** décident de ce qui passe. |
| **Service de connexion** | Essayer de se connecter, ou de s'inscrire si l'inscription n'est pas désactivée. |
| **Repo GitHub (public)** | Lire le code, la configuration et **tout l'historique des commits**. |
| **CI/CD** | Rien directement, mais elle détient les secrets de déploiement. |

## 3. Menaces et parades

Le niveau de risque combine la gravité et la probabilité : **fort**, **moyen** ou **faible**.

### Attaques extérieures

| Menace                                       | Risque    | Ce qui se passe                                                                                                                                                                                                     | Parade                                                                                                                                                                                      |
| -------------------------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **MEN01** : Inscription d'un inconnu         | **Fort**  | L'inscription est souvent ouverte par défaut. Un robot crée un compte et lit ou écrit toute table mal protégée.                                                                                                     | Désactiver l'inscription publique. Créer le compte unique à la main.                                                                                                                        |
| **MEN02** : Base mal protégée                | **Fort**  | Une table sans règle d'accès peut être lue, modifiée ou vidée par n'importe qui avec la clé publique. C'est la faille la plus courante quand le front appelle la base directement.                                  | Sur **chaque** table : accès réservé au propriétaire connecté, tout le reste refusé par défaut. Des tests automatiques vérifient qu'un accès sans connexion échoue.                         |
| **MEN03** : Secret publié sur GitHub         | **Fort**  | Une clé d'administration ou un jeton de déploiement est commité. Des robots le trouvent en quelques minutes. Supprimer le commit ne suffit pas : il reste dans l'historique.                                        | Secrets uniquement dans des fichiers locaux ignorés par git et dans les secrets de la CI. Un scan bloque tout commit ou push qui contient un secret. En cas de fuite : **révoquer la clé**. |
| **MEN04** : Vol du compte                    | **Moyen** | Hameçonnage, mot de passe réutilisé, ou piratage de la boîte mail ou du compte GitHub/Google qui sert à se connecter.                                                                                               | Connexion forte (passkey). Possibilité de déconnecter toutes les sessions.                                                                                                                  |
| **MEN05** : Injection de script (XSS)        | **Moyen** | Un texte contenant du code est affiché comme du HTML et s'exécute. Il peut venir d'une saisie ou d'un contenu importé (mots, prénoms Wikidata). Le script vole la session.                                          | Ne jamais insérer de texte comme du HTML brut. Politique de sécurité du contenu (CSP) qui bloque les scripts non prévus.                                                                    |
| **MEN06** : Dépendance piratée               | **Fort**  | Une nouvelle version d'un paquet npm contient du code malveillant, qui s'exécute dans l'application ou la CI.                                                                                                       | Peu de dépendances, versions figées par le fichier de verrouillage, alertes de vulnérabilité, mises à jour relues, secrets de CI limités. Risque restant **moyen, accepté**.                |
| **MEN07** : Consommation anormale des quotas | **Moyen** | Les offres gratuites ont des plafonds mensuels, que ton usage normal n'atteint pas. Des robots, ou un bug qui boucle, peuvent les dépasser. Le service est alors suspendu, ou facturé si une carte est enregistrée. | **Aucun moyen de paiement enregistré** : le service s'arrête au lieu de facturer. Alertes de consommation. Mode hors ligne en secours.                                                      |

### Erreurs et pannes

| Menace | Risque | Ce qui se passe | Parade |
|---|---|---|---|
| **MEN08** : Historique abîmé par un bug | **Fort** | Un bug de synchronisation envoie deux fois le même essai (doublon) ou modifie un essai terminé. | La **base refuse** toute modification ou suppression d'un essai terminé (RG18). Chaque essai a un **identifiant unique créé sur l'appareil** : un deuxième envoi ne crée pas de doublon (RG22). |
| **MEN09** : Erreur de manipulation | **Fort** | Une migration destructrice ou une suppression est lancée sur la production au lieu du local (R5). | Migrations versionnées, testées en local, appliquées par la CI. Sauvegarde avant chaque migration en production. Aucune commande manuelle sur la production. |
| **MEN10** : Panne ou fin du fournisseur | **Fort** | Panne longue, perte de données, fin de l'offre gratuite, ou suspension d'un projet inactif, que pratiquent certaines offres (R4). | Sauvegarde automatique et régulière **chez un autre fournisseur**. Export complet des données. Restauration testée. |
| **MEN11** : Données réelles publiées par erreur | **Moyen** | Une sauvegarde, un export ou des données de test copiées de la production arrivent dans le repo public. RGPD02 n'est alors plus respectée ([A1](rgpd.md)). | Sauvegardes et exports **hors du dossier du repo**. Tests avec des données fictives uniquement. |
| **MEN12** : Appareil perdu ou volé | **Faible** | Un inconnu utilise la session ouverte ou lit les données en cache. | Verrouiller ses appareils. Déconnecter toutes les sessions depuis un autre appareil. Risque restant accepté. |

### Pris en charge par les fournisseurs

| Menace | Prise en charge |
|---|---|
| Écoute du trafic | HTTPS imposé par les hébergeurs |
| Saturation massive (DDoS) | Absorbée par l'infrastructure du fournisseur |
| Accès physique aux serveurs | Sécurité des centres de données du fournisseur |

Le benchmark (S1) vérifie que chaque fournisseur retenu couvre bien ces trois points.

## 4. Stratégie de sécurisation

Cinq règles résument les parades. Elles seront traduites en exigences en [A3](exigences-securite.md), puis en mesures techniques en partie 5.

| Règle | Concrètement | Menaces traitées |
|---|---|---|
| **STRAT01** : La base fait la loi | Le front peut être lu et contourné. C'est la base qui vérifie qui accède à quoi, et qui refuse de modifier un essai terminé. | MEN01, MEN02, MEN08 |
| **STRAT02** : Rien de privé dans le repo | Ni secret ni donnée réelle. Un scan automatique le vérifie avant chaque push. | MEN03, MEN11 |
| **STRAT03** : Un seul compte, bien protégé | Inscription fermée, connexion forte, sessions révocables. | MEN01, MEN04, MEN12 |
| **STRAT04** : Le moins de choses possible | Peu de dépendances, peu de services, rien d'activé sans besoin, aucun moyen de paiement enregistré. | MEN05, MEN06, MEN07 |
| **STRAT05** : Toujours pouvoir revenir en arrière | Sauvegardes hors du fournisseur, export complet, restauration testée. | MEN08, MEN09, MEN10 |

**Défense en profondeur** : la parade de chaque menace à risque fort combine **au moins deux protections indépendantes**. Par exemple, pour MEN03, un scan bloque le push, puis la révocation rend la clé inutile si elle a fui malgré tout. Si une protection cède, l'autre tient.
