import { ImageAnnotatorClient } from "@google-cloud/vision";

// Configuration du client Google Vision
const client = new ImageAnnotatorClient({
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  keyFilename: "./lib/portfolio-458718-ffe32580c850.json",
});

export async function analyzeImageWithGoogleVision(
  imageBase64: string
): Promise<string> {
  try {
    // Analyse des labels/étiquettes de l'image
    const [labelResult] = await client.labelDetection({
      image: {
        content: imageBase64,
      },
    });

    // Analyse des objets dans l'image
    const [objectResult] = await client.objectLocalization({
      image: {
        content: imageBase64,
      },
    });

    // Traitement des résultats
    const labels = labelResult.labelAnnotations || [];
    const objects = objectResult.localizedObjectAnnotations || [];

    // Extraire les mots anglais avec un score élevé
    const englishLabels = labels
      .filter((label: any) => (label.score || 0) > 0.8)
      .map((label: any) => label.description)
      .slice(0, 5);

    const englishObjects = objects
      .filter((obj: any) => (obj.score || 0) > 0.7)
      .map((obj: any) => obj.name)
      .slice(0, 3);

    // Combiner tous les mots anglais en évitant les doublons
    const allEnglishWords = [...new Set([...englishObjects, ...englishLabels])];

    // Traduire tous les mots en français
    const frenchWords = await translateMultipleWords(allEnglishWords);

    return frenchWords.length > 0
      ? frenchWords.join(", ")
      : "Image analysée automatiquement";
  } catch (error) {
    console.error("Erreur lors de l'analyse avec Google Vision:", error);
    throw new Error("Erreur lors de l'analyse de l'image");
  }
}

// Fonction simplifiée pour une analyse rapide
export async function analyzeImageForAltText(
  imageBase64: string
): Promise<string> {
  try {
    const [result] = await client.labelDetection({
      image: {
        content: imageBase64,
      },
    });

    const labels = result.labelAnnotations || [];

    // Extraire les mots anglais avec un score élevé
    const englishLabels = labels
      .filter((label: any) => (label.score || 0) > 0.7)
      .map((label: any) => label.description)
      .slice(0, 5);

    if (englishLabels.length > 0) {
      // Traduire tous les mots anglais en français
      const frenchLabels = await translateMultipleWords(englishLabels);
      return frenchLabels.join(", ");
    }

    return "Image analysée automatiquement";
  } catch (error) {
    console.error("Erreur lors de l'analyse rapide:", error);
    throw new Error("Erreur lors de l'analyse de l'image");
  }
}

// Fonction pour traduire avec LibreTranslate (avec gestion d'erreur améliorée)
async function translateWithLibreTranslate(text: string): Promise<string> {
  try {
    const response = await fetch("https://libretranslate.de/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        q: text,
        source: "en",
        target: "fr",
      }),
    });

    if (!response.ok) {
      console.error(
        `Erreur HTTP LibreTranslate: ${response.status} ${response.statusText}`
      );
      return translateLabel(text); // Fallback immédiat
    }

    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      console.error("LibreTranslate n'a pas retourné du JSON:", contentType);
      return translateLabel(text); // Fallback immédiat
    }

    const data = await response.json();

    if (data.translatedText) {
      return data.translatedText;
    } else if (data.error) {
      console.error("Erreur LibreTranslate:", data.error);
      return translateLabel(text);
    } else {
      console.error("Réponse LibreTranslate inattendue:", data);
      return translateLabel(text);
    }
  } catch (error) {
    console.error("Erreur lors de la traduction LibreTranslate:", error);
    return translateLabel(text); // Fallback sur dictionnaire local
  }
}

// Alternative : Fonction pour traduire avec MyMemory (API gratuite alternative)
async function translateWithMyMemory(text: string): Promise<string> {
  try {
    const response = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|fr`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      return translateLabel(text);
    }

    const data = await response.json();

    if (data.responseData && data.responseData.translatedText) {
      return data.responseData.translatedText;
    } else {
      return translateLabel(text);
    }
  } catch (error) {
    console.error("Erreur lors de la traduction MyMemory:", error);
    return translateLabel(text);
  }
}

// Fonction pour traduire plusieurs mots avec tentatives multiples
async function translateMultipleWords(words: string[]): Promise<string[]> {
  const translations = await Promise.all(
    words.map(async (word) => {
      // Essayer d'abord LibreTranslate
      let translated = await translateWithLibreTranslate(word);

      // Si LibreTranslate a échoué (retourne le mot original), essayer MyMemory
      if (
        translated === translateLabel(word) &&
        translated === word.toLowerCase()
      ) {
        translated = await translateWithMyMemory(word);
      }

      return translated;
    })
  );

  // Retourner les traductions en supprimant les doublons
  return [...new Set(translations)];
}

// Fonction pour traduire les labels anglais en français (dictionnaire local comme fallback)
function translateLabel(englishLabel: string): string {
  const translations: { [key: string]: string } = {
    // Personnes et corps
    Person: "personne",
    People: "personnes",
    Human: "être humain",
    Face: "visage",
    Child: "enfant",
    Adult: "adulte",
    Man: "homme",
    Woman: "femme",
    Baby: "bébé",
    Smile: "sourire",
    Hand: "main",
    Eye: "œil",
    Hair: "cheveux",

    // Animaux
    Dog: "chien",
    Cat: "chat",
    Bird: "oiseau",
    Horse: "cheval",
    Fish: "poisson",
    Animal: "animal",
    Pet: "animal domestique",

    // Nature
    Tree: "arbre",
    Flower: "fleur",
    Plant: "plante",
    Garden: "jardin",
    Forest: "forêt",
    Mountain: "montagne",
    Sky: "ciel",
    Cloud: "nuage",
    Sun: "soleil",
    Moon: "lune",
    Water: "eau",
    River: "rivière",
    Ocean: "océan",
    Beach: "plage",
    Sunset: "coucher de soleil",
    Sunrise: "lever de soleil",

    // Objets du quotidien
    Car: "voiture",
    House: "maison",
    Building: "bâtiment",
    Food: "nourriture",
    Table: "table",
    Chair: "chaise",
    Book: "livre",
    Phone: "téléphone",
    Computer: "ordinateur",
    Camera: "appareil photo",
    Clothing: "vêtement",
    Furniture: "meuble",
    Window: "fenêtre",
    Door: "porte",
    Road: "route",
    Street: "rue",

    // Activités
    Sport: "sport",
    Music: "musique",
    Art: "art",
    Photography: "photographie",
    Travel: "voyage",
    Work: "travail",
    Party: "fête",
    Wedding: "mariage",
    Concert: "concert",

    // Lieux
    Restaurant: "restaurant",
    Park: "parc",
    School: "école",
    Office: "bureau",
    Hospital: "hôpital",
    Shop: "magasin",
    Kitchen: "cuisine",
    Bedroom: "chambre",
    Bathroom: "salle de bain",
    "Living room": "salon",

    // Événements et temps
    Night: "nuit",
    Day: "jour",
    Morning: "matin",
    Evening: "soir",
    Winter: "hiver",
    Summer: "été",
    Spring: "printemps",
    Autumn: "automne",
    Christmas: "Noël",
    Birthday: "anniversaire",

    // Couleurs
    Red: "rouge",
    Blue: "bleu",
    Green: "vert",
    Yellow: "jaune",
    Black: "noir",
    White: "blanc",
    Purple: "violet",
    Pink: "rose",
    Orange: "orange",
    Brown: "marron",
    Gray: "gris",

    // Émotions et expressions
    Happy: "heureux",
    Sad: "triste",
    Angry: "en colère",
    Surprised: "surpris",
    Excited: "excité",
    Calm: "calme",
    Beautiful: "beau",
    Cute: "mignon",

    // Autres
    Indoor: "intérieur",
    Outdoor: "extérieur",
    Vintage: "vintage",
    Modern: "moderne",
    Traditional: "traditionnel",
    Fashion: "mode",
    Style: "style",
    Design: "design",
    Architecture: "architecture",
    Landscape: "paysage",
    Portrait: "portrait",
    Abstract: "abstrait",
    Pattern: "motif",
    Texture: "texture",

    // Mots techniques souvent détectés
    Technology: "technologie",
    Electronic: "électronique",
    Device: "appareil",
    Screen: "écran",
    Light: "lumière",
    Shadow: "ombre",
    Color: "couleur",
    Shape: "forme",
    Line: "ligne",
    Circle: "cercle",
    Square: "carré",
    Triangle: "triangle",
    Metal: "métal",
    Wood: "bois",
    Glass: "verre",
    Plastic: "plastique",
    Paper: "papier",
    Fabric: "tissu",
    Stone: "pierre",
    Concrete: "béton",
  };

  return translations[englishLabel] || englishLabel.toLowerCase();
}

// Fonction pour générer une description naturelle (simplifiée)
function generateNaturalDescription(elements: string[]): string {
  if (elements.length === 0) return "";

  // Retourner simplement les mots-clés uniques séparés par des virgules
  const uniqueElements = [...new Set(elements)];
  return uniqueElements.join(", ");
}

// Fonction utilitaire pour déterminer le nom de la couleur
function getColorName(red: number, green: number, blue: number): string {
  const colors = [
    { name: "rouges", r: 255, g: 0, b: 0 },
    { name: "bleus", r: 0, g: 0, b: 255 },
    { name: "verts", r: 0, g: 255, b: 0 },
    { name: "jaunes", r: 255, g: 255, b: 0 },
    { name: "oranges", r: 255, g: 165, b: 0 },
    { name: "violets", r: 128, g: 0, b: 128 },
    { name: "roses", r: 255, g: 192, b: 203 },
    { name: "marrons", r: 139, g: 69, b: 19 },
    { name: "gris", r: 128, g: 128, b: 128 },
    { name: "noirs", r: 0, g: 0, b: 0 },
    { name: "blancs", r: 255, g: 255, b: 255 },
  ];

  let closestColor = colors[0];
  let minDistance = Infinity;

  colors.forEach((color) => {
    const distance = Math.sqrt(
      Math.pow(red - color.r, 2) +
        Math.pow(green - color.g, 2) +
        Math.pow(blue - color.b, 2)
    );
    if (distance < minDistance) {
      minDistance = distance;
      closestColor = color;
    }
  });

  return minDistance < 100 ? closestColor.name : "";
}
