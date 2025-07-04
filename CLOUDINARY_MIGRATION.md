# Migration vers Cloudinary pour la gestion des photos

## Changements effectués

### 1. Installation de Cloudinary

```bash
npm install cloudinary
```

### 2. Configuration Cloudinary

- Nouveau fichier `lib/cloudinary.ts` avec helpers pour :
  - Upload d'images avec compression automatique
  - Suppression d'images
  - Extraction des public_id depuis les URLs

### 3. Modifications du système de photos

- Remplacement complet de l'API portfolio par Cloudinary
- Compression automatique :
  - **Images haute résolution** : `quality: auto:best`, format automatique
  - **Images basse résolution** : Redimensionnement à 800px max, `quality: auto:good`
  - Format automatique (WebP si supporté)

### 4. Variables d'environnement requises

Ajoutez à votre fichier `.env` :

```env
CLOUDINARY_CLOUD_NAME="your_cloudinary_cloud_name"
CLOUDINARY_API_KEY="your_cloudinary_api_key"
CLOUDINARY_API_SECRET="your_cloudinary_api_secret"
```

## Configuration Cloudinary

### 1. Créer un compte

1. Allez sur [cloudinary.com](https://cloudinary.com)
2. Créez un compte gratuit
3. Récupérez vos credentials dans le dashboard

### 2. Configuration des transformations

Cloudinary applique automatiquement :

- **Optimisation de qualité** : `auto:best` pour high-res, `auto:good` pour low-res
- **Format automatique** : WebP si supporté par le navigateur
- **Redimensionnement intelligent** : 800px max pour les images basse résolution

### 3. Structure des dossiers

Les images sont organisées dans : `portfolio/photos/`

## Avantages de cette migration

1. **Simplicité** : Plus besoin d'API externe complexe
2. **Performance** : CDN mondial de Cloudinary
3. **Optimisation automatique** : Compression et formats adaptatifs
4. **Fiabilité** : Infrastructure robuste de Cloudinary
5. **Fonctionnalités** : Transformations avancées disponibles

## Tests recommandés

1. **Upload d'images** : Tester l'ajout de nouvelles photos
2. **Modification** : Tester la mise à jour avec nouvelles images
3. **Suppression** : Vérifier que les images sont supprimées de Cloudinary
4. **Performance** : Vérifier les temps de chargement

## Rollback (si nécessaire)

Si vous souhaitez revenir à l'ancien système :

1. Restaurer l'ancienne version de `photos-actions.tsx`
2. Supprimer `lib/cloudinary.ts`
3. Désinstaller : `npm uninstall cloudinary`
