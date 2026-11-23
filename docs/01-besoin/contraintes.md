# B4 — Contraintes et opportunités

Amont : [contexte](contexte.md), [besoins](besoins.md).

## Contraintes

| Domaine | Contrainte |
|---|---|
| Temps | Temps de développement **très variable** d'une semaine à l'autre, **sans échéance**. Le découpage en lots doit permettre de s'arrêter à tout moment avec une application utilisable. |
| Budget | **Gratuit uniquement** : application en ligne sur des offres gratuites (hébergement, base de données, authentification). |
| Appareils | Ordinateur, téléphone et tablette : clavier, souris et tactile. |
| Connexion | Les exercices doivent rester possibles **hors connexion**. |
| Langues | Mots et noms en **français et en anglais** ; interface en **français et en anglais**. |
| Règles métier | Formats et scores **identiques à Memory League**. Les règles officielles ne sont pas publiques : elles s'affichent dans l'application, et le développeur les a fournies en captures. Au format IAM, formats et scores **identiques au règlement IAM**, public. Voir [règles de gestion](regles-de-gestion.md) et leurs [sources](regles-de-gestion-details.md#sources-et-niveau-de-confiance). |
| Contenus | Il faut des contenus libres de droits : **visages générés par IA** pour Names et International Names, **photos libres de droits et images générées par IA** pour Images, **listes de mots** FR/EN, **listes de prénoms** FR/EN et internationaux. Pour le format IAM et les exercices : **noms de famille** FR/EN et internationaux, **événements fictifs** FR/EN pour Dates, une **voix** FR/EN pour Spoken Numbers, des **mots avec leur prononciation** FR/EN pour le système majeur. La licence de chaque source est à vérifier en partie 3 (A1). |
| Technique | Aucune contrainte imposée : le choix se fera au benchmark (partie 4). |
## Opportunités

- **Projet d'apprentissage** : chaque partie du process est l'occasion de pratiquer (conception, modélisation, sécurité, CI/CD).
- **Les offres gratuites actuelles** (bases de données managées, hébergement statique, authentification) couvrent l'usage d'un seul utilisateur.
- **Applications web installables (PWA)** : une même base de code pour l'ordinateur, le téléphone et la tablette, avec le hors ligne. Piste à confirmer au benchmark.
- **Visages générés par IA** : ils évitent toute donnée personnelle de tiers et préservent le profil Solo.
