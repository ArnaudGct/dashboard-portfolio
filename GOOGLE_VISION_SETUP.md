# Configuration Google Cloud Vision API

## Prérequis

1. **Créer un projet Google Cloud**

   - Aller sur https://console.cloud.google.com/
   - Créer un nouveau projet ou sélectionner un projet existant

2. **Activer l'API Vision**

   - Dans la console Google Cloud, aller sur "API et services" > "Bibliothèque"
   - Rechercher "Cloud Vision API"
   - Cliquer sur "Activer"

3. **Créer un compte de service**

   - Aller sur "API et services" > "Identifiants"
   - Cliquer sur "Créer des identifiants" > "Compte de service"
   - Donner un nom au compte de service
   - Attribuer le rôle "Propriétaire" ou "Utilisateur Cloud Vision"

4. **Télécharger la clé du compte de service**
   - Dans la liste des comptes de service, cliquer sur le compte créé
   - Aller sur l'onglet "Clés"
   - Cliquer sur "Ajouter une clé" > "Créer une clé"
   - Choisir le format JSON
   - Télécharger le fichier JSON

## Configuration du projet

1. **Placer le fichier de clé**

   - Créer un dossier `credentials` à la racine du projet
   - Placer le fichier JSON téléchargé dans ce dossier
   - Exemple : `credentials/google-vision-key.json`

2. **Configurer les variables d'environnement**

   - Copier `.env.local.example` vers `.env.local`
   - Remplir les variables :
     ```
     GOOGLE_CLOUD_PROJECT_ID=votre-project-id
     GOOGLE_CLOUD_KEY_FILE=./credentials/google-vision-key.json
     ```

3. **Sécurité**
   - Ajouter `credentials/` au `.gitignore`
   - Ne jamais commiter les clés d'API

## Alternative : Utiliser GOOGLE_APPLICATION_CREDENTIALS

Vous pouvez aussi utiliser la variable d'environnement standard de Google Cloud :

```bash
GOOGLE_APPLICATION_CREDENTIALS=./credentials/google-vision-key.json
```

Dans ce cas, vous n'avez pas besoin de spécifier `GOOGLE_CLOUD_PROJECT_ID` et `GOOGLE_CLOUD_KEY_FILE`.

## Test

Pour tester la configuration :

1. Uploader une image dans le formulaire
2. Vérifier que le texte alternatif est généré automatiquement
3. Vérifier les logs de la console pour les erreurs éventuelles

## Tarification

- Google Cloud Vision API est payante après les premiers 1000 requêtes par mois
- Consulter la tarification sur https://cloud.google.com/vision/pricing

## Fonctionnalités disponibles

L'intégration actuelle utilise :

- **Label Detection** : Détection d'objets et de concepts dans l'image
- **Object Localization** : Localisation d'objets spécifiques
- **Text Detection** : Reconnaissance de texte dans l'image (OCR)
- **Image Properties** : Analyse des couleurs dominantes

Ces analyses sont combinées pour générer un texte alternatif descriptif et pertinent.
