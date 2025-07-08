import { NextResponse } from "next/server";
import sharp from "sharp";

export async function GET(request, { params }) {
  try {
    const { id } = params;

    // Récupérer les données de l'album depuis votre base de données
    const album = await fetchAlbumData(id); // Remplacez par votre logique de récupération

    if (!album || !album.photos || album.photos.length === 0) {
      return NextResponse.json({ error: "Album not found" }, { status: 404 });
    }

    // Dimensions de l'image composite
    const width = 416; // Largeur de la carte (h-52 = 208px * 2)
    const height = 208;

    // Télécharger toutes les images
    const imagePromises = album.photos.slice(0, 5).map(async (photo, index) => {
      try {
        const response = await fetch(photo.lien_low);
        const buffer = await response.arrayBuffer();
        return { buffer: Buffer.from(buffer), index };
      } catch (error) {
        console.error(`Error loading image ${index}:`, error);
        return null;
      }
    });

    const images = (await Promise.all(imagePromises)).filter(Boolean);

    if (images.length === 0) {
      return NextResponse.json({ error: "No images loaded" }, { status: 500 });
    }

    // Créer l'image composite
    const composite = await createComposite(images, width, height);

    return new NextResponse(composite, {
      headers: {
        "Content-Type": "image/jpeg",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Error generating composite:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

async function createComposite(images, width, height) {
  const gap = 2; // Équivalent à gap-0.5
  const padding = 2; // Équivalent à p-0.5

  // Calculer les dimensions des zones
  const leftWidth = Math.floor((width - padding * 2 - gap) / 2);
  const rightWidth = width - padding * 2 - leftWidth - gap;
  const topHeight = Math.floor((height - padding * 2 - gap) / 2);
  const bottomHeight = height - padding * 2 - topHeight - gap;

  // Créer le canvas de base
  const canvas = sharp({
    create: {
      width,
      height,
      channels: 3,
      background: { r: 241, g: 245, b: 249 }, // bg-slate-100
    },
  });

  const overlays = [];

  // Image 1 - grande image à gauche (2 lignes)
  if (images[0]) {
    const resized = await sharp(images[0].buffer)
      .resize(leftWidth, height - padding * 2, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();

    overlays.push({
      input: resized,
      top: padding,
      left: padding,
    });
  }

  // Image 2 - colonne droite ligne 1
  if (images[1]) {
    const resized = await sharp(images[1].buffer)
      .resize(rightWidth, topHeight, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();

    overlays.push({
      input: resized,
      top: padding,
      left: padding + leftWidth + gap,
    });
  }

  // Image 3 - colonne droite ligne 2
  if (images[2]) {
    const resized = await sharp(images[2].buffer)
      .resize(rightWidth, bottomHeight, { fit: "cover" })
      .jpeg({ quality: 80 })
      .toBuffer();

    overlays.push({
      input: resized,
      top: padding + topHeight + gap,
      left: padding + leftWidth + gap,
    });
  }

  // Pour mobile/tablette, on peut ajouter d'autres images si nécessaire
  // Images 4 et 5 peuvent être ajoutées selon la logique responsive

  return await canvas.composite(overlays).jpeg({ quality: 85 }).toBuffer();
}

// Fonction à adapter selon votre base de données
async function fetchAlbumData(id) {
  // Remplacez par votre logique de récupération des données
  const res = await fetch(`http://localhost:3001/api/creations/photos_albums`);
  const albums = await res.json();
  return albums.find((album) => album.id_alb === parseInt(id));
}
