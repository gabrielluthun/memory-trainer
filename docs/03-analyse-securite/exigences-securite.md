# A3 — Exigences de sécurité (ES)

Amont : [statut RGPD](rgpd.md), [menaces et stratégie](menaces.md). Aval : [exigences](../01-besoin/exigences.md#exigences-de-sécurité-es), partie 5 (mesures techniques).

## En bref

- **19 exigences**, de ES01 à ES19, regroupées selon les cinq règles de la [stratégie](menaces.md#4-stratégie-de-sécurisation) (STRAT01 à STRAT05).
- Elles disent **quoi** garantir, sans nommer d'outil. La partie 5 dira **comment** le faire avec la pile choisie au benchmark.
- Chaque exigence est **vérifiable** : la colonne « Vérification » deviendra un test ou un contrôle de recette.
- Le lot 1 met l'application en ligne : toutes les ES s'appliquent **dès le sprint 0 et le lot 1**.

## 1. Un seul compte, bien protégé (STRAT03)

| Exigence | Description | Menaces | Vérification |
|---|---|---|---|
| **ES01** : Inscription fermée | Le service de connexion refuse toute création de compte. Le compte unique est créé à la main par le développeur. | MEN01 | Une tentative d'inscription échoue. |
| **ES02** : Connexion par passkey | La connexion se fait par passkey (WebAuthn), qui résiste à l'hameçonnage. Aucune connexion par mot de passe seul. | MEN04 | Contrôle de la configuration du service de connexion. |
| **ES03** : Sessions révocables | Une session expire après une durée limitée. Le développeur peut fermer toutes ses sessions depuis n'importe quel appareil. | MEN04, MEN12 | Après « tout déconnecter », un autre appareil doit se reconnecter. |

> Hypothèse à valider : si aucune offre gratuite ne propose les passkeys, ES02 devient « double authentification obligatoire ». Le choix se fait au benchmark (S1).

## 2. La base fait la loi (STRAT01)

| Exigence | Description | Menaces | Vérification |
|---|---|---|---|
| **ES04** : Accès réservé au propriétaire | Chaque table a des règles d'accès **dans la base** : lecture et écriture réservées au propriétaire connecté, tout le reste refusé par défaut. Aucune table sans règle. | MEN01, MEN02 | Tests automatiques : une requête sans connexion échoue sur chaque table, et un test liste les tables sans règle. |
| **ES05** : Essais terminés immuables | La base refuse toute modification ou suppression d'un essai terminé, quelle que soit la requête (RG18). | MEN08 | Test automatique : une modification et une suppression sont refusées. |
| **ES06** : Synchronisation sans doublon | Chaque essai porte un identifiant unique créé sur l'appareil. Un deuxième envoi du même essai ne crée pas de doublon (RG22). | MEN08 | Test automatique : deux envois successifs donnent un seul essai. |
| **ES07** : Validation par la base | La base vérifie les valeurs reçues (types, bornes, formats). Le front n'est jamais le seul contrôle. | MEN02, MEN08 | Test automatique : une valeur hors bornes est refusée. |

## 3. Rien de privé dans le repo (STRAT02)

| Exigence | Description | Menaces | Vérification |
|---|---|---|---|
| **ES08** : Aucune clé secrète côté client | Le front ne contient que la clé publique. Les clés d'administration restent dans les secrets de la CI ou du serveur. | MEN02, MEN03 | Recherche de clés secrètes dans le code produit par le build. |
| **ES09** : Secrets hors du repo | Les secrets ne vivent que dans des fichiers locaux ignorés par git et dans les secrets de la CI. Un scan bloque tout commit et tout push qui contient un secret. La procédure de révocation est écrite. | MEN03 | Scan en local et dans la CI ; un secret de test est bloqué. |
| **ES10** : Aucune donnée réelle dans le repo | Ni essai, ni système, ni sauvegarde, ni export dans le repo. Les tests utilisent des données fictives (RGPD02). | MEN11 | Relecture du diff de chaque pull request vers `main`. |
| **ES11** : CI au moindre privilège | Chaque tâche de la CI n'a que les droits et les secrets dont elle a besoin. | MEN03, MEN06 | Relecture de la configuration de la CI. |

## 4. Le moins de choses possible (STRAT04)

| Exigence | Description | Menaces | Vérification |
|---|---|---|---|
| **ES12** : Aucun HTML brut | Aucun texte saisi ou importé n'est inséré comme du HTML : tout est affiché comme du texte. | MEN05 | Test : un texte contenant `<script>` s'affiche tel quel. |
| **ES13** : En-têtes de sécurité | HTTPS obligatoire (HSTS), et une politique de sécurité du contenu (CSP) qui n'autorise que les scripts de l'application. | MEN05 | Analyse des en-têtes du site en production. |
| **ES14** : Dépendances maîtrisées | Versions figées par le fichier de verrouillage, alertes de vulnérabilité activées, chaque nouvelle dépendance justifiée. | MEN06 | Audit des dépendances dans la CI. |
| **ES15** : Aucun traceur | Ni mesure d'audience, ni cookie tiers, ni service tiers en dehors de l'hébergeur, de la base et de la connexion (RGPD03). | — (A1) | Inspection des requêtes réseau de l'application. |
| **ES16** : Facturation maîtrisée | Aucun moyen de paiement chez les fournisseurs, **sauf chez Cloudflare**, où R2 l'exige ([ADR 0024](../04-specifications/adr/0024-moyen-de-paiement-cloudflare-r2.md)). Chez Cloudflare : offre gratuite seulement (aucun abonnement payant), alertes de facturation activées, clé R2 limitée au seul bucket de sauvegarde. Les alertes de consommation sont activées partout. | MEN07 | Contrôle des comptes fournisseurs : moyens de paiement, abonnements, alertes. |

## 5. Toujours pouvoir revenir en arrière (STRAT05)

| Exigence | Description | Menaces | Vérification |
|---|---|---|---|
| **ES17** : Sauvegardes externes | Sauvegarde automatique et régulière de la base, dans un espace **privé chez un autre fournisseur**, jamais dans le repo. La fréquence est fixée en Q5. | MEN08, MEN09, MEN10 | Restauration testée à chaque lot. |
| **ES18** : Export complet | Le développeur peut exporter toutes ses données à tout moment, dans un format ouvert. | MEN10 | Export puis réimport dans une base locale. |
| **ES19** : Migrations sûres | Migrations versionnées, testées en local, appliquées en production **uniquement par la CI**, avec une sauvegarde juste avant. | MEN09 | Relecture de la pipeline ; aucune migration manuelle. |

## 6. Couverture des menaces

Chaque menace à risque fort est couverte par **au moins deux exigences** (défense en profondeur).

| Menace | Risque | Exigences |
|---|---|---|
| **MEN01** : Inscription d'un inconnu | Fort | ES01, ES04 |
| **MEN02** : Base mal protégée | Fort | ES04, ES07, ES08 |
| **MEN03** : Secret publié sur GitHub | Fort | ES08, ES09, ES11 |
| **MEN04** : Vol du compte | Moyen | ES02, ES03 |
| **MEN05** : Injection de script (XSS) | Moyen | ES12, ES13 |
| **MEN06** : Dépendance piratée | Fort | ES11, ES14 |
| **MEN07** : Consommation anormale des quotas | Moyen | ES16 |
| **MEN08** : Historique abîmé par un bug | Fort | ES05, ES06, ES07, ES17 |
| **MEN09** : Erreur de manipulation | Fort | ES17, ES19 |
| **MEN10** : Panne ou fin du fournisseur | Fort | ES17, ES18 |
| **MEN11** : Données réelles publiées par erreur | Moyen | ES10 |
| **MEN12** : Appareil perdu ou volé | Faible | ES03 |
