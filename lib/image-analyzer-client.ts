/**
 * Analyse une image en utilisant l'API Google Vision via une route API
 * @param imageBase64 - Image encodée en base64 (sans le préfixe data:image/...)
 * @returns Promise<string> - Texte alternatif généré
 */
export async function analyzeImageClient(imageBase64: string): Promise<string> {
  try {
    const response = await fetch("/api/analyze-image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageBase64 }),
    });

    if (!response.ok) {
      throw new Error(`Erreur HTTP: ${response.status}`);
    }

    const data = await response.json();
    return data.altText || "Erreur lors de l'analyse";
  } catch (error) {
    console.error("Erreur lors de l'analyse côté client:", error);
    throw error;
  }
}
