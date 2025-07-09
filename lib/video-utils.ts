import { spawn } from "child_process";
import ffmpegPath from "ffmpeg-static";
import sharp from "sharp";
import {
  createWriteStream,
  createReadStream,
  unlinkSync,
  writeFileSync,
} from "fs";
import { tmpdir } from "os";
import { join } from "path";

/**
 * Extrait la première frame d'une vidéo et la retourne comme Buffer d'image
 * @param videoBuffer - Buffer de la vidéo
 * @returns Promise<Buffer> - Buffer de l'image de la première frame
 */
export async function extractFirstFrameFromVideo(
  videoBuffer: Buffer
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    if (!ffmpegPath) {
      reject(new Error("FFmpeg binary not found"));
      return;
    }

    // Créer des fichiers temporaires
    const tempVideoPath = join(tmpdir(), `temp_video_${Date.now()}.mp4`);
    const tempImagePath = join(tmpdir(), `temp_frame_${Date.now()}.png`);

    try {
      // Écrire le buffer vidéo dans un fichier temporaire
      writeFileSync(tempVideoPath, videoBuffer);

      // Lancer FFmpeg pour extraire la première frame
      const ffmpeg = spawn(ffmpegPath, [
        "-i",
        tempVideoPath,
        "-vframes",
        "1",
        "-f",
        "image2",
        "-vf",
        "scale=1280:720:force_original_aspect_ratio=decrease:flags=lanczos",
        "-q:v",
        "2",
        tempImagePath,
      ]);

      ffmpeg.on("close", async (code) => {
        try {
          // Nettoyer le fichier vidéo temporaire
          unlinkSync(tempVideoPath);

          if (code !== 0) {
            reject(new Error(`FFmpeg exited with code ${code}`));
            return;
          }

          // Lire l'image générée
          const imageBuffer = await sharp(tempImagePath)
            .webp({ quality: 85 })
            .toBuffer();

          // Nettoyer le fichier image temporaire
          unlinkSync(tempImagePath);

          resolve(imageBuffer);
        } catch (error) {
          // Nettoyer les fichiers en cas d'erreur
          try {
            unlinkSync(tempVideoPath);
          } catch {}
          try {
            unlinkSync(tempImagePath);
          } catch {}
          reject(new Error(`Erreur lors du traitement de l'image: ${error}`));
        }
      });

      ffmpeg.on("error", (error) => {
        // Nettoyer les fichiers en cas d'erreur
        try {
          unlinkSync(tempVideoPath);
        } catch {}
        try {
          unlinkSync(tempImagePath);
        } catch {}
        reject(new Error(`Erreur FFmpeg: ${error.message}`));
      });

      ffmpeg.stderr.on("data", (data) => {
        console.log("FFmpeg stderr:", data.toString());
      });
    } catch (error) {
      // Nettoyer les fichiers en cas d'erreur
      try {
        unlinkSync(tempVideoPath);
      } catch {}
      try {
        unlinkSync(tempImagePath);
      } catch {}
      reject(
        new Error(
          `Erreur lors de la création des fichiers temporaires: ${error}`
        )
      );
    }
  });
}

/**
 * Génère une URL de frame depuis une URL vidéo Cloudinary
 * @param videoUrl - URL de la vidéo sur Cloudinary
 * @param transformations - Transformations à appliquer (optionnel)
 * @returns string - URL de la frame
 */
export function generateFrameUrlFromVideo(
  videoUrl: string,
  transformations: string = "w_1280,h_720,c_scale,q_auto:good,f_webp"
): string {
  console.log("Génération de l'URL de frame depuis:", videoUrl);

  // Extraire le public_id depuis l'URL
  const publicId = extractPublicIdFromUrl(videoUrl);

  if (!publicId) {
    throw new Error("Impossible d'extraire le public_id de l'URL vidéo");
  }

  // Vérifier que l'URL contient bien "/upload/"
  if (!videoUrl.includes("/upload/")) {
    throw new Error("URL Cloudinary invalide: '/upload/' non trouvé");
  }

  // Construire l'URL de la première frame avec les transformations
  // so_0 = start offset à 0 secondes (première frame)
  const baseUrl = videoUrl.substring(0, videoUrl.indexOf("/upload/") + 8);
  const frameUrl = `${baseUrl}so_0,${transformations}/${publicId}.jpg`;

  console.log("URL de frame générée:", frameUrl);
  return frameUrl;
}

/**
 * Extrait la première frame d'une vidéo uploadée sur Cloudinary
 * @param videoUrl - URL de la vidéo sur Cloudinary
 * @returns Promise<string> - URL de la première frame générée par Cloudinary
 */
export async function extractFirstFrameFromCloudinaryVideo(
  videoUrl: string
): Promise<string> {
  try {
    // Extraire le public_id depuis l'URL Cloudinary
    const publicId = extractPublicIdFromUrl(videoUrl);

    if (!publicId) {
      throw new Error("Impossible d'extraire le public_id de l'URL vidéo");
    }

    // Générer l'URL de la première frame avec les transformations Cloudinary
    // so_0 = start offset à 0 secondes (première frame)
    const baseUrl = videoUrl.substring(0, videoUrl.indexOf("/upload/") + 8);
    const frameUrl = `${baseUrl}so_0,w_1280,h_720,c_scale,q_auto:good,f_webp/${publicId}.jpg`;

    // Vérifier que l'URL fonctionne en faisant une requête HEAD
    const response = await fetch(frameUrl, { method: "HEAD" });

    if (!response.ok) {
      throw new Error(
        `Échec de la génération de la frame: ${response.status} ${response.statusText}`
      );
    }

    return frameUrl;
  } catch (error) {
    console.error("Erreur lors de l'extraction de la frame:", error);
    throw new Error(`Erreur lors de l'extraction de la frame: ${error}`);
  }
}

/**
 * Extrait le public_id depuis une URL Cloudinary
 * @param url - URL Cloudinary
 * @returns string | null - Public ID ou null si non trouvé
 */
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    console.log("Extraction du public_id depuis:", url);

    // Nettoyer l'URL des paramètres de requête
    const cleanUrl = url.split("?")[0];

    // Patterns pour différents formats d'URLs Cloudinary
    const patterns = [
      // Format avec dossier: /upload/v1234567890/folder/subfolder/public_id.ext
      /\/upload\/(?:v\d+\/)?(.+?)(?:\.[^.]*)?$/,
      // Format simple: /upload/public_id.ext
      /\/upload\/([^/.]+)(?:\.[^.]*)?$/,
    ];

    for (const pattern of patterns) {
      const match = cleanUrl.match(pattern);
      if (match && match[1]) {
        // Enlever l'extension si présente
        const publicId = match[1].replace(/\.[^.]*$/, "");
        console.log("Public ID extrait:", publicId);
        return publicId;
      }
    }

    console.warn("Aucun public_id trouvé dans l'URL");
    return null;
  } catch (error) {
    console.error("Erreur lors de l'extraction du public_id:", error);
    return null;
  }
}

/**
 * Crée un File object à partir d'un Buffer pour l'upload
 * @param buffer - Buffer de l'image
 * @param filename - Nom du fichier
 * @returns File - Object File pour l'upload
 */
export function createFileFromBuffer(buffer: Buffer, filename: string): File {
  const blob = new Blob([buffer], { type: "image/webp" });
  return new File([blob], filename, { type: "image/webp" });
}

/**
 * Teste si FFmpeg est disponible et fonctionnel
 * @returns Promise<boolean> - true si FFmpeg fonctionne, false sinon
 */
export async function testFFmpegAvailability(): Promise<boolean> {
  return new Promise((resolve) => {
    if (!ffmpegPath) {
      console.error("FFmpeg binary not found");
      resolve(false);
      return;
    }

    const ffmpeg = spawn(ffmpegPath, ["-version"]);

    ffmpeg.on("close", (code) => {
      resolve(code === 0);
    });

    ffmpeg.on("error", (error) => {
      console.error("FFmpeg test error:", error);
      resolve(false);
    });
  });
}

/**
 * Valide qu'une URL de frame Cloudinary est accessible
 * @param frameUrl - URL de la frame à valider
 * @returns Promise<boolean> - true si l'URL est accessible
 */
export async function validateFrameUrl(frameUrl: string): Promise<boolean> {
  try {
    // Créer un AbortController pour le timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes

    const response = await fetch(frameUrl, {
      method: "HEAD",
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.error("Erreur lors de la validation de l'URL de frame:", error);
    return false;
  }
}

/**
 * Génère et valide une URL de frame depuis une vidéo Cloudinary avec retry
 * @param videoUrl - URL de la vidéo sur Cloudinary
 * @param transformations - Transformations à appliquer (optionnel)
 * @param maxRetries - Nombre maximum de tentatives
 * @returns Promise<string> - URL de la frame validée
 */
export async function generateValidatedFrameUrl(
  videoUrl: string,
  transformations: string = "w_1280,h_720,c_scale,q_auto:good,f_webp",
  maxRetries: number = 3
): Promise<string> {
  console.log("Génération de l'URL de frame validée...");

  const frameUrl = generateFrameUrlFromVideo(videoUrl, transformations);

  // Essayer plusieurs fois avec des délais progressifs
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    console.log(`Tentative ${attempt}/${maxRetries} de validation de l'URL`);

    const isValid = await validateFrameUrl(frameUrl);

    if (isValid) {
      console.log("URL de frame validée avec succès:", frameUrl);
      return frameUrl;
    }

    if (attempt < maxRetries) {
      // Attendre avant la prochaine tentative (délai progressif)
      const delay = attempt * 2000; // 2s, 4s, 6s...
      console.log(`Attente de ${delay}ms avant la prochaine tentative...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // Si toutes les tentatives échouent, essayer avec d'autres transformations
  console.log("Tentative avec des transformations alternatives...");

  const alternativeTransformations = [
    "w_800,h_450,c_scale,q_auto:good,f_webp",
    "w_1280,h_720,c_fit,q_auto:good,f_webp",
    "w_1920,h_1080,c_scale,q_auto:good,f_webp",
  ];

  for (const altTransform of alternativeTransformations) {
    const altFrameUrl = generateFrameUrlFromVideo(videoUrl, altTransform);
    const isValid = await validateFrameUrl(altFrameUrl);

    if (isValid) {
      console.log(
        "URL de frame validée avec transformations alternatives:",
        altFrameUrl
      );
      return altFrameUrl;
    }
  }

  throw new Error(
    `L'URL de frame générée n'est pas accessible après ${maxRetries} tentatives avec différentes transformations`
  );
}

/**
 * Diagnostique une URL vidéo Cloudinary
 * @param videoUrl - URL de la vidéo à diagnostiquer
 * @returns Promise<object> - Informations de diagnostic
 */
export async function diagnoseVideoUrl(videoUrl: string): Promise<{
  isValidUrl: boolean;
  publicId: string | null;
  baseUrl: string | null;
  frameUrl: string | null;
  frameAccessible: boolean;
}> {
  console.log("=== DIAGNOSTIC URL VIDÉO ===");
  console.log("URL vidéo:", videoUrl);

  const isValidUrl = videoUrl.includes("/upload/");
  const publicId = extractPublicIdFromUrl(videoUrl);
  const baseUrl = isValidUrl
    ? videoUrl.substring(0, videoUrl.indexOf("/upload/") + 8)
    : null;

  let frameUrl = null;
  let frameAccessible = false;

  if (publicId && baseUrl) {
    try {
      frameUrl = generateFrameUrlFromVideo(videoUrl);
      frameAccessible = await validateFrameUrl(frameUrl);
    } catch (error) {
      console.error("Erreur lors de la génération de frame:", error);
    }
  }

  const result = {
    isValidUrl,
    publicId,
    baseUrl,
    frameUrl,
    frameAccessible,
  };

  console.log("Résultat du diagnostic:", result);
  console.log("=== FIN DIAGNOSTIC ===");

  return result;
}
