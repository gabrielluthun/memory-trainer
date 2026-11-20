# B7 — Règles de gestion : détails et sources

Annexe de [regles-de-gestion.md](regles-de-gestion.md), qui contient les règles elles-mêmes.

## Statuts des règles

- **Officiel** : instructions Memory League [S0], ou règlement et calculateur IAM [S4], [S5].
- **Source** : source secondaire [S1]–[S3].
- **Déduit** : conséquence directe d'une règle officielle.
- **Décision** : choix ou confirmation du développeur.
- **Hypothèse** : à valider.

## RG10 — saisie du rappel par discipline (officiel [S0])

| Discipline | Saisie |
|---|---|
| Numbers | Cliquer sur une case ou la sélectionner avec les flèches ; taper un chiffre (0–9) pour remplir la case sélectionnée ; Retour arrière efface le chiffre à gauche de la case sélectionnée ; + insère, − supprime. |
| Words | Cliquer sur une case ou la sélectionner avec ↑ / ↓ ; taper le mot ; Entrée passe au mot suivant ; + insère, − supprime. |
| Cards | Cliquer sur une case de rappel vide pour la sélectionner ; cliquer sur une carte de la rangée du bas pour la placer à la position sélectionnée ; cliquer sur une carte des rangées du haut pour la renvoyer en bas ; + (ou clic sur le numéro au-dessus d'une position) insère, − supprime. |
| Images | Comme Cards, avec des rangées d'images en bas. |
| Names, International Names | Cliquer sur le champ sous une photo pour le sélectionner ; taper le prénom. |

## RG16 — points IAM

### Formules IAM (calculateur officiel [S5], relevé le 2026-11-20)

| Formule | Épreuves IAM |
|---|---|
| `score ÷ standard × 1000` | Toutes, sauf Speed Cards et Spoken Numbers |
| `6862 ÷ temps^0,75` (temps de mémorisation en secondes, jeu complet de 52 cartes) | Speed Cards, jeu complet |
| `cartes ÷ 52 × 95,19` | Speed Cards, jeu incomplet |
| `√chiffres × 47,3` | Spoken Numbers |

Les standards (score qui vaut 1000 points) ne sont pas recopiés ici : ce sont des données datées et modifiables (RG17), relevées sur [S5].

### Correspondance Memory League → IAM

Notation : National / International / World.

| Discipline ML | Onglet « épreuve la plus courte » | Onglet « épreuve emblématique » |
|---|---|---|
| Numbers | 5-min Numbers / 5-min Numbers / 5-min Numbers | 15-min Numbers / 30-min Numbers / Hour Numbers |
| Cards | Speed Cards (×3) | 10-min Cards / 30-min Cards / Hour Cards |
| Images | 5-min Images (×3) | 5-min Images (×3) |
| Words | 5-min Words / 15-min Words / 15-min Words | identique |
| Names, International Names | 5-min Names & Faces / 15-min Names & Faces / 15-min Names & Faces | identique |

## Points reportés

- **À définir en partie 4** (maquettes S12, S13) :
  - RG11 : les tailles de groupe proposées et la valeur par défaut de chaque épreuve ;
  - **tactile** : les instructions officielles décrivent clavier et souris ; sur téléphone et tablette (ENF03), chaque raccourci aura un équivalent tactile (boutons, glissements).
- **Base de prénoms** de Names (par langue) et d'International Names : provenance et taille. Recherche de sources libres de droits et vérification des licences en partie 3 (A1), choix en partie 4.

## Sources et niveau de confiance

Le format doit être **identique à Memory League** (contrainte forte). Les règles officielles ne sont pas publiques : elles s'affichent dans l'application, à l'ouverture de chaque épreuve.

- [S0] **Memory League, instructions de chaque épreuve** (Numbers, Cards, Images, Words, Names, International Names), affichées dans l'application memoryleague.com. Captures d'écran fournies par le développeur le 2026-11-20. **Source de référence.**
- [S1] B. Wiederhold, *An introduction to memory competitions, records and techniques*, arXiv 2504.06747v2 (2025) : https://arxiv.org/html/2504.06747v2 (section 1, tableau 2, annexe B). Source secondaire, utilisée pour les quantités.
- [S2] Art of Memory, *Memory League Numbers Game* : https://artofmemory.com/memory-league/numbers-game/. Page non consultable (accès refusé) : seul l'extrait affiché par un moteur de recherche a pu être lu. Remplacée par [S0].
- [S3] Art of Memory, *Memory League* : https://artofmemory.com/memory-league/. Même situation que S2. Remplacée par [S0].
- [S4] IAM, *The IAM Rulebook*, novembre 2019 : https://www.iam-memory.org/wp-content/uploads/2019/11/IAM_Rulebook_Nov2019.pdf (§ 8 « Scoring »). Ses constantes Speed Cards (8030 et 111,4) sont remplacées par celles de [S5].
- [S5] IAM Stats, *Score Calculator* : https://iam-stats.org/calculator.php, relevé le 2026-11-20 dans le code de la page (formules et standards actuels, onglets World, International, National).
