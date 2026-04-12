import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth-session";
import { batchUploadPhotosWithMetadataAction } from "@/actions/photos-actions";

export const maxDuration = 300; // Allows the function to run longer on Vercel

export async function POST(request: Request) {
  try {
    // Vérification de la session directement dans l'API Route où les cookies sont préservés !
    await requireUser();

    // Récupération de la FormData via la requête native (pas de parsage destructif de Next.js Server Actions)
    const formData = await request.formData();

    // Appel de la logique métier (qui n'aura plus besoin de valider l'utilisateur si elle le refait,
    // l'appel requireUser interne pourrait throw si le contexte d'exécution de la Server Action perd les headers ?
    // Attention: si batchUploadPhotosWithMetadataAction est une Server Action, l'appeler d'ici fera qu'il
    // refera requireUser() à l'intérieur de MAIS en tant que fonction serveur appelée depuis une API,
    // le contexte des headers est préservé.

    // Le plus sûr est d'exécuter l'action et de renvoyer le résultat.
    const result = await batchUploadPhotosWithMetadataAction(formData);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Erreur API Upload:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Erreur interne" },
      { status: error.name === "AuthRequiredError" ? 401 : 500 },
    );
  }
}
