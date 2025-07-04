import { NextRequest, NextResponse } from "next/server";
import { analyzeImageForAltText } from "@/lib/image-analyzer";

export async function POST(request: NextRequest) {
  try {
    const { imageBase64 } = await request.json();

    if (!imageBase64) {
      return NextResponse.json(
        { error: "Image base64 manquante" },
        { status: 400 }
      );
    }

    const altText = await analyzeImageForAltText(imageBase64);

    return NextResponse.json({ altText });
  } catch (error) {
    console.error("Erreur lors de l'analyse de l'image:", error);
    return NextResponse.json(
      { error: "Erreur lors de l'analyse de l'image" },
      { status: 500 }
    );
  }
}
