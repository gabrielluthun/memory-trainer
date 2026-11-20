# A1 — Statut RGPD

Amont : [profil du projet](../00-cadrage/profil-projet.md), [contraintes](../01-besoin/contraintes.md), [risques](../02-projet/risques.md) (R7).

> Cette analyse n'est pas un avis juridique.

## En bref

- **Le RGPD ne s'applique pas** à cette application : c'est un usage strictement personnel.
- Cette exemption tient **tant que les quatre conditions RGPD01 à RGPD04 sont respectées**.
- Les **contenus** (mots, images, prénoms, visages) doivent avoir une licence compatible avec une diffusion en ligne : critères **LIC01 à LIC07**.
- Le **profil Solo est maintenu**.

## 1. Quelles données personnelles ?

| Donnée | De qui ? |
|---|---|
| Compte de connexion (e-mail ou compte GitHub, Google…) | Le développeur |
| Essais : réponses, scores, temps, dates | Le développeur |
| Systèmes : PAO et table de rappel | Le développeur, et parfois **des tiers** (célébrités, proches) |
| Journaux techniques des fournisseurs (adresse IP, navigateur) | Le développeur |

> Hypothèse à valider : le **téléversement d'images** dans les systèmes sera décidé avant le lot 5. S'il est retenu, une photo de proche sera traitée comme un proche cité en texte.

## 2. Pourquoi le RGPD ne s'applique pas

Le RGPD exclut les traitements faits par une personne **pour un usage strictement personnel ou domestique** (article 2.2.c).

C'est le cas ici :
- une seule personne utilise l'application ;
- pour son propre entraînement ;
- sans but professionnel ni commercial.

Les proches cités dans un PAO sont couverts par cette exemption.

En revanche, **les fournisseurs** (hébergeur, base de données, authentification) restent soumis au RGPD pour leurs propres traitements (considérant 18). Le benchmark (S1) vérifiera leurs politiques de confidentialité.

## 3. Conditions à respecter

Si l'une de ces conditions n'est plus vraie, l'exemption tombe et il faut refaire cette analyse.

**RGPD01** : Utilisateur unique\
Aucun autre compte, aucun partage de données. Sinon, le projet passe en version Complète (voir [profil](../00-cadrage/profil-projet.md#bascule-vers-la-version-complète)).

**RGPD02** : Aucune publication\
Les essais et les systèmes ne sont **jamais dans le repo**, qui est public, ni visibles sans connexion. La justice européenne considère que publier des données sur internet n'est plus un usage personnel (CJUE, arrêt *Lindqvist*, 2003).

**RGPD03** : Aucun traceur\
Pas de mesure d'audience, pas de cookie tiers. Les seuls services tiers sont l'hébergeur, la base de données et l'authentification.

**RGPD04** : Visages fictifs\
Uniquement des visages générés par IA, jamais de photo d'une personne réelle.

RGPD02 et RGPD03 seront reprises comme exigences de sécurité en A3.

## 4. Autres points

**Stockage sur l'appareil** (cache hors ligne, session) : il sert au fonctionnement de l'application. La CNIL n'exige donc **ni consentement ni bandeau cookies**.

**Mentions légales** : la page de connexion sera visible par tous.
> Hypothèse à valider : on publie une page de mentions légales minimale, qui indique seulement l'hébergeur. La loi (LCEN, article 6 III) le permet à un particulier.

**Visages IA** : un visage généré peut, par hasard, ressembler à une personne réelle. Le risque est faible. Si cela arrive, le visage est retiré.

## 5. Licences des contenus

Le repo est public et l'application est en ligne : les contenus sont donc **diffusés publiquement**. Chaque source doit respecter les critères suivants.

**LIC01** : Diffusion\
La licence autorise la reproduction et la diffusion en ligne.

**LIC02** : Modification\
La licence autorise les modifications nécessaires (redimensionner, recadrer, translittérer). Les licences « pas de modification » (CC ND) sont donc exclues.

**LIC03** : Attribution\
Si la licence exige de citer l'auteur, on le fait dans une page de crédits de l'application et dans un fichier de crédits du repo.

**LIC04** : Partage à l'identique\
Les licences CC BY-SA et ODbL sont acceptées. Elles s'appliquent aux données redistribuées, pas au code.

**LIC05** : Licence explicite\
Une source sans licence clairement indiquée est écartée.

**LIC06** : Personnes identifiables\
Les photos de la discipline Images ne montrent personne de reconnaissable. Le droit à l'image s'applique même si la licence de la photo est libre.

**LIC07** : Traçabilité\
Pour chaque source, on note le nom, l'adresse, la licence, la version et la date de récupération.

### Sources candidates

Ce ne sont que des pistes. La licence de chacune sera vérifiée au moment du choix.

**Lot 2 — Words et Images**
- Mots en français : Lexique 3 (CC BY-SA 4.0).
- Mots en anglais : WordNet (licence permissive) ou une liste de fréquence sous licence libre, à trouver.
- Images : Wikimedia Commons ou Openverse, en ne gardant que le CC0 et le domaine public ; ou des images générées par IA en local (licence du modèle à vérifier).
- À éviter : Pexels et Unsplash. Leurs licences limitent la redistribution en masse, ce qui est probablement contraire à LIC01.

**Lot 3 — Names et International Names**
- Prénoms français : fichier des prénoms de l'INSEE (Licence Ouverte Etalab 2.0).
- Prénoms anglais : prénoms de la SSA aux États-Unis (domaine public) ou de l'ONS au Royaume-Uni (Open Government Licence).
- Prénoms internationaux : Wikidata (CC0).
- Visages : générés par IA en local, ou issus d'une banque de visages IA avec une licence claire.

Le choix final de chaque source se fait **juste avant son lot** et il est consigné dans un ADR. Cela répond à la question ouverte du [PRD](../PRD.md#9-questions-ouvertes).
