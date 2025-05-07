"use client";

import { useState } from "react";
import Image from "next/image";

interface Photo {
  id_pho: number;
  titre?: string;
  lien_low: string;
  lien_high: string;
  alt?: string;
}

interface AlbumPreviewMosaicProps {
  photos: Photo[];
}

const PORTFOLIO_BASE_URL = process.env.NEXT_PUBLIC_PORTFOLIO_URL || "";

export function AlbumPreview({ photos }: AlbumPreviewMosaicProps) {
  // Ne prendre que les 5 premières photos pour la prévisualisation
  const previewPhotos = photos.slice(0, 5);
  const photoCount = previewPhotos.length;

  // Fonction pour construire l'URL de l'image
  const getImageUrl = (path: string) => {
    if (!path) return "/placeholder-photo.jpg";

    if (path.startsWith("http")) {
      return path;
    }

    if (path.startsWith("/photos/") || path.startsWith("/uploads/")) {
      return `${PORTFOLIO_BASE_URL}${path}`;
    }

    return path;
  };

  // Pas de mosaïque si pas de photos
  if (photoCount === 0) {
    return null;
  }

  // Styles conditionnels basés sur le nombre de photos
  let gridLayout = "";

  switch (photoCount) {
    case 1:
      // Une seule photo: pleine largeur
      gridLayout = "grid-cols-1";
      break;
    case 2:
      // Deux photos: deux colonnes égales
      gridLayout = "grid-cols-2";
      break;
    case 3:
      // Trois photos: une grande à gauche, deux empilées à droite
      gridLayout = "grid-cols-2";
      break;
    case 4:
      // Quatre photos: grille 2x2
      gridLayout = "grid-cols-2";
      break;
    case 5:
    default:
      // Cinq photos: disposition spéciale
      gridLayout = "grid-cols-3";
      break;
  }

  return (
    <div
      className={`grid ${gridLayout} gap-1 overflow-hidden`}
      style={{
        height: photoCount <= 2 ? "200px" : photoCount <= 4 ? "250px" : "300px",
      }}
    >
      {photoCount === 1 && (
        // Une seule photo en plein écran
        <div className="w-full h-full relative overflow-hidden">
          <Image
            src={previewPhotos[0].lien_low}
            alt={previewPhotos[0].alt || "Photo d'album"}
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-cover"
          />
        </div>
      )}

      {photoCount === 2 && (
        // Deux photos côte à côte
        <>
          {previewPhotos.map((photo, index) => (
            <div
              key={photo.id_pho}
              className="w-full h-full relative overflow-hidden"
            >
              <Image
                src={photo.lien_low}
                alt={photo.alt || `Photo ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          ))}
        </>
      )}

      {photoCount === 3 && (
        // Une grande photo à gauche, deux empilées à droite
        <>
          <div className="row-span-2 w-full h-full relative overflow-hidden">
            <Image
              src={getImageUrl(previewPhotos[0].lien_low)}
              alt={previewPhotos[0].alt || "Photo principale"}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
          <div className="w-full h-full relative overflow-hidden">
            <Image
              src={getImageUrl(previewPhotos[1].lien_low)}
              alt={previewPhotos[1].alt || "Photo 2"}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
          <div className="w-full h-full relative overflow-hidden">
            <Image
              src={getImageUrl(previewPhotos[2].lien_low)}
              alt={previewPhotos[2].alt || "Photo 3"}
              fill
              sizes="(max-width: 768px) 50vw, 25vw"
              className="object-cover"
            />
          </div>
        </>
      )}

      {photoCount === 4 && (
        // Grille 2x2
        <>
          {previewPhotos.map((photo, index) => (
            <div
              key={photo.id_pho}
              className="w-full h-full relative overflow-hidden"
            >
              <Image
                src={getImageUrl(photo.lien_low)}
                alt={photo.alt || `Photo ${index + 1}`}
                fill
                sizes="(max-width: 768px) 50vw, 25vw"
                className="object-cover"
              />
            </div>
          ))}
        </>
      )}

      {photoCount === 5 && (
        // Layout spécial pour 5 photos (3 en haut, 2 en bas plus grandes)
        <>
          <div className="w-full h-full relative overflow-hidden">
            <Image
              src={getImageUrl(previewPhotos[0].lien_low)}
              alt={previewPhotos[0].alt || "Photo 1"}
              fill
              sizes="(max-width: 768px) 33vw, 16vw"
              className="object-cover"
            />
          </div>
          <div className="w-full h-full relative overflow-hidden">
            <Image
              src={getImageUrl(previewPhotos[1].lien_low)}
              alt={previewPhotos[1].alt || "Photo 2"}
              fill
              sizes="(max-width: 768px) 33vw, 16vw"
              className="object-cover"
            />
          </div>
          <div className="w-full h-full relative overflow-hidden">
            <Image
              src={getImageUrl(previewPhotos[2].lien_low)}
              alt={previewPhotos[2].alt || "Photo 3"}
              fill
              sizes="(max-width: 768px) 33vw, 16vw"
              className="object-cover"
            />
          </div>
          <div className="w-full h-full relative overflow-hidden col-span-2">
            <Image
              src={getImageUrl(previewPhotos[3].lien_low)}
              alt={previewPhotos[3].alt || "Photo 4"}
              fill
              sizes="(max-width: 768px) 67vw, 33vw"
              className="object-cover"
            />
          </div>
          <div className="w-full h-full relative overflow-hidden">
            <Image
              src={getImageUrl(previewPhotos[4].lien_low)}
              alt={previewPhotos[4].alt || "Photo 5"}
              fill
              sizes="(max-width: 768px) 33vw, 16vw"
              className="object-cover"
            />
          </div>
        </>
      )}
    </div>
  );
}
