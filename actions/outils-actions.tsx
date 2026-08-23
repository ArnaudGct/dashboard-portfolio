"use server";

import { revalidatePath } from "next/cache";
import prisma from "@/lib/prisma";
import {
  uploadOutilImageToCloudinary,
  deleteFromCloudinary,
  extractPublicIdFromUrl,
} from "@/lib/cloudinary";

// Action pour ajouter un outil
export async function addOutilAction(formData: FormData) {
  try {
    // Récupérer et traiter les fichiers image
    const imageMiniature = formData.get("miniature") as File;
    const imageLogo = formData.get("logo") as File;
    
    let miniaturePath = "";
    let logoPath = "";

    if (imageMiniature && imageMiniature.size > 0) {
      console.log("Upload d'une nouvelle miniature d'outil...");
      const result = await uploadOutilImageToCloudinary(imageMiniature, "portfolio/outils/screens");
      miniaturePath = result.url;
    }

    if (imageLogo && imageLogo.size > 0) {
      console.log("Upload d'un nouveau logo d'outil...");
      const result = await uploadOutilImageToCloudinary(imageLogo, "portfolio/outils/logos");
      logoPath = result.url;
    }

    // 1. Créer l'outil d'abord
    const outil = await prisma.outils.create({
      data: {
        titre: formData.get("titre")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        miniature: miniaturePath,
        logo: logoPath,
        lien_github: formData.get("lien_github")?.toString() || "",
        derniere_modification: new Date(),
      },
    });

    // 2. Récupérer les tags sélectionnés
    const selectedTags = formData.getAll("tags") as string[];

    // 3. Pour chaque tag sélectionné
    for (const tagId of selectedTags) {
      try {
        let tag = await prisma.outils_tags.findFirst({
          where: {
            titre: tagId,
          },
        });

        if (!tag) {
          tag = await prisma.outils_tags.create({
            data: {
              titre: tagId,
              important: 0,
            },
          });
        }

        await prisma.outils_tags_link.create({
          data: {
            id_outils: outil.id_outil,
            id_tags: tag.id_tags,
          },
        });
      } catch (tagError) {
        console.error("Erreur lors du traitement du tag:", tagId, tagError);
      }
    }

    revalidatePath("/outils");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de l'ajout de l'outil:", error);
    throw error;
  }
}

// Action pour mettre à jour un outil
export async function updateOutilAction(formData: FormData) {
  try {
    const outilId = parseInt(formData.get("id")?.toString() || "");

    if (isNaN(outilId)) {
      throw new Error("ID d'outil invalide");
    }

    // Récupérer l'outil existant pour obtenir le chemin actuel des images
    const existingOutil = await prisma.outils.findUnique({
      where: { id_outil: outilId },
    });

    if (!existingOutil) {
      throw new Error("Outil non trouvé");
    }

    // Vérifier s'il y a de nouvelles images
    const imageMiniature = formData.get("miniature") as File;
    const imageLogo = formData.get("logo") as File;
    
    let miniaturePath = existingOutil.miniature;
    let logoPath = existingOutil.logo;

    const oldMiniaturePublicId = existingOutil.miniature
      ? extractPublicIdFromUrl(existingOutil.miniature)
      : null;
      
    const oldLogoPublicId = existingOutil.logo
      ? extractPublicIdFromUrl(existingOutil.logo)
      : null;

    if (imageMiniature && imageMiniature.size > 0) {
      console.log("Upload d'une nouvelle miniature d'outil...");
      const result = await uploadOutilImageToCloudinary(imageMiniature, "portfolio/outils/screens");
      miniaturePath = result.url;

      if (oldMiniaturePublicId) {
        await deleteFromCloudinary(oldMiniaturePublicId);
      }
    }

    if (imageLogo && imageLogo.size > 0) {
      console.log("Upload d'un nouveau logo d'outil...");
      const result = await uploadOutilImageToCloudinary(imageLogo, "portfolio/outils/logos");
      logoPath = result.url;

      if (oldLogoPublicId) {
        await deleteFromCloudinary(oldLogoPublicId);
      }
    }

    // 1. Mettre à jour l'outil
    await prisma.outils.update({
      where: {
        id_outil: outilId,
      },
      data: {
        titre: formData.get("titre")?.toString() || "",
        description: formData.get("description")?.toString() || "",
        miniature: miniaturePath,
        logo: logoPath,
        lien_github: formData.get("lien_github")?.toString() || "",
        derniere_modification: new Date(),
      },
    });

    // 2. Gérer les tags
    await prisma.outils_tags_link.deleteMany({
      where: {
        id_outils: outilId,
      },
    });

    const selectedTags = formData.getAll("tags") as string[];

    for (const tagId of selectedTags) {
      let tag = await prisma.outils_tags.findFirst({
        where: {
          titre: tagId,
        },
      });

      if (!tag) {
        tag = await prisma.outils_tags.create({
          data: {
            titre: tagId,
            important: 0,
          },
        });
      }

      await prisma.outils_tags_link.create({
        data: {
          id_outils: outilId,
          id_tags: tag.id_tags,
        },
      });
    }

    revalidatePath("/outils");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour de l'outil:", error);
    throw error;
  }
}

// Action pour supprimer un outil
export async function deleteOutilAction(outilId: number) {
  try {
    if (isNaN(outilId)) {
      throw new Error("ID d'outil invalide");
    }

    const outil = await prisma.outils.findUnique({
      where: { id_outil: outilId },
    });

    if (!outil) {
      throw new Error("Outil non trouvé");
    }

    if (outil.miniature) {
      const publicId = extractPublicIdFromUrl(outil.miniature);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    if (outil.logo) {
      const publicId = extractPublicIdFromUrl(outil.logo);
      if (publicId) {
        await deleteFromCloudinary(publicId);
      }
    }

    await prisma.outils_tags_link.deleteMany({
      where: {
        id_outils: outilId,
      },
    });

    await prisma.outils.delete({
      where: {
        id_outil: outilId,
      },
    });

    revalidatePath("/outils");
    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression de l'outil:", error);
    throw error;
  }
}

// Action pour mettre à jour un tag
export async function updateOutilTagAction(
  id: number,
  title: string,
  important: number = 0
) {
  try {
    await prisma.outils_tags.update({
      where: { id_tags: id },
      data: {
        titre: title,
        important: important,
      },
    });

    revalidatePath("/outils/tags");
    revalidatePath("/outils");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la mise à jour du tag:", error);
    throw error;
  }
}

// Action pour supprimer un tag
export async function deleteOutilTagAction(id: number) {
  try {
    await prisma.outils_tags_link.deleteMany({
      where: { id_tags: id },
    });

    await prisma.outils_tags.delete({
      where: { id_tags: id },
    });

    revalidatePath("/outils/tags");
    revalidatePath("/outils");

    return { success: true };
  } catch (error) {
    console.error("Erreur lors de la suppression du tag:", error);
    throw error;
  }
}

// Action pour créer un nouveau tag
export async function createOutilTagAction(
  title: string,
  important: number = 0
) {
  try {
    const existingTag = await prisma.outils_tags.findFirst({
      where: { titre: title },
    });

    if (existingTag) {
      return {
        success: false,
        error: "Ce tag existe déjà",
        tag: existingTag,
      };
    }

    const newTag = await prisma.outils_tags.create({
      data: {
        titre: title,
        important: important,
      },
    });

    revalidatePath("/outils/tags");
    revalidatePath("/outils");

    return {
      success: true,
      tag: newTag,
    };
  } catch (error) {
    console.error("Erreur lors de la création du tag:", error);
    throw error;
  }
}
