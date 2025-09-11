# Gestion de Carrière

## Mindmap

### Acteurs Clés
- **Salarié**
  - Consulte Plan Carrière
  - Reçoit propositions
  - Demande évolution
- **Manager**
  - Suit Progression
  - Propose promotions
  - Valide Demandes
- **RH**
  - Supervise plans
  - Analyse compétences
  - Définit critères
- **Admin**
  - Paramètres du module
  - Gère permissions

### Scénarios d'usage
### Remplacement poste clé
1. Poste vacant
2. Identification candidats
3. Validation RH
4. Nomination

#### Evolution interne
1. Demande salarié
2. Validation manager
3. Plan évolution RH

#### Plan de succession préventif
1. Définition postes critiques
2. Association candidats
3. Suivi préparation

### Liaisons avec autres modules
- **Module RH**
  - Fiches salariés
  - Contrats
- **Module Formation**
  - Catalogue formations
  - Inscriptions
- **Module évaluation**
  - Scores
  - Feedback
- **Base de données postes**
  - Fiches de postes
  - Compétences requises

### Fonctions Principales
- Plans de succession
  - Associer postes clés
  - Définir critères
  - Prioriser candidats
- Évaluations des compétences
  - Comparer compétences
  - Recommander formations
- Mobilité interne
  - Proposer postes (par salarié)
  - Permettre candidature
- Suivi de carrière
  - Historique évolutions
  - Objectifs/jalons
  - Recommendations
  - Formations
  - Mobilités

### Reporting et Statistiques
- Candidats/postes
- Taux réussite (based on the post and the employe's "compétences")

---
## Known inconsistencies that I'm leaving in, but should be looked into if further expansions to the project were to occur
#### Anything can send requests to the API
Currently anything can send requests to our API, which is very bad, ideally, you'd pass an authorization token thingy? (I dunno what the correct term is) which validates our requests to the API.
In extension to this, I think it would be nice for the API to allow/disallow certain requests based on the role of the user requesting them. Currently, we do this in the client to protect routes, viewing, editing, etc. But considering anything can send requests to our API, not having the permission checks in the API further increase the security issues.
Alas, this still remains a 6 week internship project, and I can't really cover everything. I might adress this if I have enough time, if not, well, let it be known that I'm aware of the issue.
#### Pagination and filtering in backend vs frontend
The backend already supports pagination and filtering for most big GET requests for all services, but currently in the fontend, I'm choosing to ignore this completely, and do all fitering and pagination client-side. This feels like the better option because it decreases the number of api calls needed, so it's what I went with, but I'm leaving the filtering and pagination in the backend, cuz I can't be bothered to remove it + it might be useful?
#### Salary inputs in client-side forms
Salary inputs in client-side forms currently accept text, but when submitted, they are nulled and are saved to the db as such, doesn't seem like a huge issue, and I might fix it, or just as equally ignore it.