import { v2 as cloudinary, UploadApiOptions } from "cloudinary";
import sharp from "sharp";

// Configuration de Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper pour compresser une image si elle dépasse 10MB
async function compressImageIfNeeded(file: File): Promise<Buffer> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  // Si le fichier fait moins de 10MB, on le retourne tel quel
  if (file.size <= 10 * 1024 * 1024) {
    return buffer;
  }

  console.log(
    `Fichier trop volumineux (${(file.size / (1024 * 1024)).toFixed(2)}MB), compression légère nécessaire...`
  );

  try {
    // Déterminer le format original
    const originalFormat = file.type.split("/")[1] || "jpeg";

    // Calculer le ratio de compression nécessaire pour arriver à environ 9.5MB
    const targetSize = 9.5 * 1024 * 1024; // 9.5MB pour avoir une marge minimale
    const compressionRatio = targetSize / file.size;

    let sharpInstance = sharp(buffer);

    // Ne réduire les dimensions que si le fichier est vraiment énorme (plus de 20MB)
    if (file.size > 20 * 1024 * 1024) {
      const metadata = await sharp(buffer).metadata();
      // Réduction très légère des dimensions (seulement 5%)
      const newWidth = Math.floor((metadata.width || 1920) * 0.95);
      const newHeight = Math.floor((metadata.height || 1080) * 0.95);

      sharpInstance = sharpInstance.resize(newWidth, newHeight, {
        fit: "inside",
        withoutEnlargement: true,
      });
    }

    // Appliquer la compression selon le format original avec des paramètres très légers
    let compressedBuffer: Buffer;

    switch (originalFormat.toLowerCase()) {
      case "jpeg":
      case "jpg":
        // Qualité très élevée, juste assez pour passer sous 10MB
        compressedBuffer = await sharpInstance
          .jpeg({
            quality: Math.max(95, Math.floor(compressionRatio * 100)), // Qualité très élevée
            progressive: true,
          })
          .toBuffer();
        break;

      case "png":
        // Compression PNG très légère
        compressedBuffer = await sharpInstance
          .png({
            compressionLevel: 1, // Compression minimale
            palette: false, // Pas de palette pour garder la qualité
          })
          .toBuffer();
        break;

      case "webp":
        // WebP avec qualité très élevée
        compressedBuffer = await sharpInstance
          .webp({
            quality: Math.max(92, Math.floor(compressionRatio * 100)), // Qualité très élevée
            effort: 1, // Effort minimal
          })
          .toBuffer();
        break;

      default:
        // Pour les autres formats, on convertit en JPEG avec une qualité très élevée
        compressedBuffer = await sharpInstance
          .jpeg({
            quality: Math.max(95, Math.floor(compressionRatio * 100)), // Qualité très élevée
            progressive: true,
          })
          .toBuffer();
        break;
    }

    console.log(
      `Image compressée: ${(compressedBuffer.length / (1024 * 1024)).toFixed(2)}MB (format: ${originalFormat})`
    );

    return compressedBuffer;
  } catch (error) {
    console.error("Erreur lors de la compression avec Sharp:", error);
    // En cas d'erreur, on retourne le buffer original
    return buffer;
  }
}

// Helper pour uploader une image vers Cloudinary (pour les photos)
export async function uploadToCloudinary(
  file: File,
  type: "low" | "high" = "high",
  folder: string = "portfolio/photos",
  originalPublicId?: string
): Promise<{ url: string; publicId: string }> {
  try {
    // Compresser l'image si nécessaire
    const buffer = await compressImageIfNeeded(file);

    // Utiliser le même nom de base que l'original s'il est fourni
    let publicId: string;
    if (originalPublicId) {
      const baseName = originalPublicId.split("/").pop() || originalPublicId;
      publicId = `${baseName}_${type}`;
    } else {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      publicId = `img_${timestamp}_${randomId}_${type}`;
    }

    // Options d'upload selon le type
    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: "image",
      public_id: publicId,
      use_filename: false,
      unique_filename: false,
      format: "webp", // Force la conversion en WebP lors de l'upload
    };

    // Configuration pour les images basse résolution
    if (type === "low") {
      uploadOptions.transformation = [
        {
          width: 800,
          height: 800,
          crop: "limit",
          quality: "auto:low",
        },
      ];
    } else {
      uploadOptions.transformation = [
        {
          width: "iw_div_2",
          height: "ih_div_2",
          crop: "scale",
          quality: "auto:eco",
        },
      ];
    }

    // Upload standard puisque le fichier fait maintenant moins de 10MB
    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Erreur Cloudinary:", error);
            reject(error);
          } else {
            console.log("Upload réussi:", result?.secure_url);
            resolve(result);
          }
        })
        .end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Erreur lors de l'upload vers Cloudinary:", error);
    throw new Error(
      `Erreur d'upload Cloudinary: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Helper pour uploader une image de journal vers Cloudinary
export async function uploadJournalImageToCloudinary(
  file: File,
  folder: string = "portfolio/journal"
): Promise<{ url: string; publicId: string }> {
  try {
    console.log(`Upload journal vers Cloudinary - Taille: ${file.size} bytes`);

    // Compresser l'image si nécessaire
    const buffer = await compressImageIfNeeded(file);

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const publicId = `journal_${timestamp}_${randomId}`;

    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: "image",
      public_id: publicId,
      use_filename: false,
      unique_filename: false,
      format: "webp", // Force la conversion en WebP lors de l'upload
      transformation: [
        {
          width: 600,
          crop: "limit",
          quality: "auto:low",
        },
      ],
    };

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Erreur Cloudinary journal:", error);
            reject(error);
          } else {
            console.log("Upload journal réussi:", result?.secure_url);
            resolve(result);
          }
        })
        .end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Erreur lors de l'upload journal vers Cloudinary:", error);
    throw new Error(
      `Erreur d'upload journal Cloudinary: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Helper pour uploader une image d'autre projet vers Cloudinary
export async function uploadAutreImageToCloudinary(
  file: File,
  folder: string = "portfolio/autres"
): Promise<{ url: string; publicId: string }> {
  try {
    console.log(
      `Upload autre projet vers Cloudinary - Taille: ${file.size} bytes`
    );

    // Compresser l'image si nécessaire
    const buffer = await compressImageIfNeeded(file);

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const publicId = `autre_${timestamp}_${randomId}`;

    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: "image",
      public_id: publicId,
      use_filename: false,
      unique_filename: false,
      format: "webp", // Force la conversion en WebP lors de l'upload
      transformation: [
        {
          width: 1200,
          crop: "limit",
          quality: "auto:good",
        },
      ],
    };

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Erreur Cloudinary autre projet:", error);
            reject(error);
          } else {
            console.log("Upload autre projet réussi:", result?.secure_url);
            resolve(result);
          }
        })
        .end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(
      "Erreur lors de l'upload autre projet vers Cloudinary:",
      error
    );
    throw new Error(
      `Erreur d'upload autre projet Cloudinary: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Nouvelle fonction pour sauvegarder l'image originale sans retouche
export async function uploadOriginalToCloudinary(
  file: File,
  folder: string = "portfolio/photos/originals"
): Promise<{ url: string; publicId: string }> {
  try {
    // Compresser l'image si nécessaire
    const buffer = await compressImageIfNeeded(file);

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const uniqueFileName = `img_${timestamp}_${randomId}`;

    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: "image",
      public_id: uniqueFileName,
      use_filename: false,
      unique_filename: false,
    };

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Erreur Cloudinary pour l'original:", error);
            reject(error);
          } else {
            console.log("Upload original réussi:", result?.secure_url);
            resolve(result);
          }
        })
        .end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error(
      "Erreur lors de l'upload de l'original vers Cloudinary:",
      error
    );
    throw new Error(
      `Erreur d'upload original Cloudinary: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Helper pour supprimer une image de Cloudinary
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === "ok";
  } catch (error) {
    console.error("Erreur lors de la suppression depuis Cloudinary:", error);
    return false;
  }
}

// Helper pour extraire le public_id depuis une URL Cloudinary
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    return match ? match[1] : null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du public_id:", error);
    return null;
  }
}

// Helper pour uploader une image à propos avec compression personnalisée
export async function uploadAProposImageToCloudinary(
  file: File,
  folder: string = "portfolio/apropos/general",
  customTransformation?: {
    width?: number;
    height?: number;
    crop?: string;
    quality?: string;
    format?: string;
  }
): Promise<{ url: string; publicId: string }> {
  try {
    console.log(`Upload à propos vers Cloudinary - Taille: ${file.size} bytes`);

    // Compresser l'image si nécessaire
    const buffer = await compressImageIfNeeded(file);

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const publicId = `apropos_${timestamp}_${randomId}`;

    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: "image",
      public_id: publicId,
      use_filename: false,
      unique_filename: false,
      format: customTransformation?.format || "webp", // Format par défaut WebP
    };

    // Configuration des transformations personnalisées
    if (customTransformation) {
      uploadOptions.transformation = [
        {
          width: customTransformation.width || 400,
          height: customTransformation.height,
          crop: customTransformation.crop || "scale",
          quality: customTransformation.quality || "auto:good",
        },
      ];
    } else {
      // Configuration par défaut pour les images à propos : 400px de largeur en WebP
      uploadOptions.transformation = [
        {
          width: 400,
          crop: "scale",
          quality: "auto:good",
        },
      ];
    }

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Erreur Cloudinary à propos:", error);
            reject(error);
          } else {
            console.log("Upload à propos réussi:", result?.secure_url);
            resolve(result);
          }
        })
        .end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Erreur lors de l'upload à propos vers Cloudinary:", error);
    throw new Error(
      `Erreur d'upload à propos Cloudinary: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

// Helper pour uploader une vidéo vers Cloudinary
export async function uploadVideoToCloudinary(
  file: File,
  folder: string = "portfolio/accueil/general/videos",
  customTransformation?: {
    quality?: string;
    format?: string;
    width?: number;
    height?: number;
  }
): Promise<{ url: string; publicId: string }> {
  try {
    console.log(`Upload vidéo vers Cloudinary - Taille: ${file.size} bytes`);

    // Convertir le fichier en buffer sans compression (pas de Sharp pour les vidéos)
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const timestamp = Date.now();
    const randomId = Math.random().toString(36).substr(2, 9);
    const publicId = `video_${timestamp}_${randomId}`;

    const uploadOptions: UploadApiOptions = {
      folder,
      resource_type: "video", // Important : spécifier que c'est une vidéo
      public_id: publicId,
      use_filename: false,
      unique_filename: false,
    };

    // Configuration des transformations personnalisées pour vidéos
    if (customTransformation) {
      uploadOptions.transformation = [
        {
          quality: customTransformation.quality || "auto:good",
          format: customTransformation.format || "mp4",
          width: customTransformation.width,
          height: customTransformation.height,
        },
      ];
    } else {
      // Configuration par défaut pour les vidéos
      uploadOptions.transformation = [
        {
          quality: "auto:good",
          format: "mp4",
        },
      ];
    }

    const result = await new Promise<any>((resolve, reject) => {
      cloudinary.uploader
        .upload_stream(uploadOptions, (error, result) => {
          if (error) {
            console.error("Erreur Cloudinary vidéo:", error);
            reject(error);
          } else {
            console.log("Upload vidéo réussi:", result?.secure_url);
            resolve(result);
          }
        })
        .end(buffer);
    });

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    console.error("Erreur lors de l'upload vidéo vers Cloudinary:", error);
    throw new Error(
      `Erreur d'upload vidéo Cloudinary: ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

export default cloudinary;
