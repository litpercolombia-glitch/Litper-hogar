import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { MODEL_EDIT, MODEL_GENERATE_PRO, MODEL_ANALYZE, MODEL_FAST_CHAT } from '../constants';
import { AspectRatio, ImageSize } from '../types';

// Helper to get the correct client. 
// For Pro models (Generation), we strictly prefer the user selected key if available to avoid quota issues.
const getClient = async (requireUserKey = false) => {
  let apiKey = process.env.API_KEY;

  if (requireUserKey && (window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (hasKey) {
      // If a key is selected in the AI Studio wrapper, we instantiate without passing a key string
      // The wrapper injects it, or we rely on process.env being updated by the wrapper.
      // However, the standard way in these environments is often just using process.env.API_KEY 
      // *after* selection. 
      // We will assume process.env.API_KEY is populated.
    }
  }
  
  return new GoogleGenAI({ apiKey });
};

// Utility to ensure image is in a supported format (PNG/JPEG/WEBP)
// Gemini does NOT support SVG. Since our templates are SVGs, we must rasterize them.
const ensureSupportedImageFormat = async (base64Image: string): Promise<{ data: string, mimeType: string }> => {
  // 1. Detect current mime type from header
  const match = base64Image.match(/^data:(image\/[a-z\+\-]+);base64,/);
  const originalMimeType = match ? match[1] : 'image/jpeg'; // Default fallthrough if no header
  
  // 2. If it's already a supported raster format, just strip header and return
  // Supported: png, jpeg, webp, heic
  if (['image/jpeg', 'image/png', 'image/webp', 'image/heic'].includes(originalMimeType)) {
     return {
       data: base64Image.replace(/^data:image\/[a-z\+\-]+;base64,/, ''),
       mimeType: originalMimeType
     };
  }

  // 3. If it is SVG (or unrecognized), convert to PNG via Canvas
  return new Promise((resolve, reject) => {
    const img = new Image();
    // Enable cross-origin for external images if needed, though usually base64 is local
    img.crossOrigin = "Anonymous"; 
    img.src = base64Image;
    
    img.onload = () => {
       try {
         const canvas = document.createElement('canvas');
         // Set dimensions
         canvas.width = img.width || 800; // Fallback width if SVG has no intrinsic size
         canvas.height = img.height || 600;
         
         const ctx = canvas.getContext('2d');
         if (!ctx) {
           reject(new Error('Canvas context not available'));
           return;
         }
         
         // Draw white background (SVGs are often transparent)
         ctx.fillStyle = '#FFFFFF';
         ctx.fillRect(0, 0, canvas.width, canvas.height);
         
         // Draw image
         ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
         
         // Convert to PNG
         const pngUrl = canvas.toDataURL('image/png');
         
         resolve({
            data: pngUrl.replace(/^data:image\/png;base64,/, ''),
            mimeType: 'image/png'
         });
       } catch (e) {
         reject(e);
       }
    };
    
    img.onerror = (e) => {
      console.error("Failed to load image for conversion", e);
      reject(new Error("Failed to load image for conversion"));
    };
  });
};

// 1. Edit Image (Visualizer) - Uses Gemini 2.5 Flash Image
export const editImageWithGemini = async (
  base64Image: string, 
  promptTerm: string,
  roomDescription?: string
): Promise<string> => {
  const ai = await getClient();
  const model = MODEL_EDIT;
  
  // Ensure we send a supported image format (Rasterize SVGs if needed)
  const { data: cleanBase64, mimeType } = await ensureSupportedImageFormat(base64Image);

  // Determine if we are just editing the bed or transforming the room too
  // The user specifically requested: "luego editaras el fondo depende del color que elija"
  const roomInstruction = roomDescription 
    ? `FULL ROOM TRANSFORMATION: The user has chosen a "${roomDescription}" style template.
       - IMPORTANT: The room's background, wall tint, and ambient lighting MUST be adjusted to perfectly match and compliment the new bed color (${promptTerm}).
       - If the bed is warm (e.g., Mustard, Beige), add subtle warm/golden lighting to the room.
       - If the bed is cool (e.g., Navy, Grey), add cooler, modern lighting to the room.
       - The goal is a unified color palette where the room feels like it was designed AROUND the bed color.` 
    : `Do NOT change the bed frame, headboard, floor, or walls. Only the mattress protector and pillows.`;

  // Updated prompt for Strict Visual Consistency AND Hyper-Realism based on JSON specs
  const prompt = `Edit this image.
  
  TASK 1: ${roomInstruction}
  
  TASK 2: Replace the current bedding with a ${promptTerm}.
  
  CRITICAL TECHNICAL SPECIFICATIONS (JSON COMPLIANCE):
  1. CLEAN THE BED: REMOVE any people, pets, laptops, trays, food, or loose objects sitting on the bed. The bed must be EMPTY and neatly made.
  2. PATTERN: The protector MUST have a uniform, small "Ultrasonic Diamond Quilted" pattern. It must appear 3D, fluffy, and soft.
  3. TEXTURE: The fabric has a Matte finish with a slight satin sheen. It is NOT shiny plastic.
  4. FIT (VERY IMPORTANT): "Fitted Sheet" style ONLY. The protector must wrap tightly around the top and sides of the mattress.
     - NO BED SKIRT.
     - NO HANGING FABRIC touching the floor.
     - NO LOOSE DRAPES or duvet-like overhangs.
     - It must look like it is tucked under the mattress, hugging the corners.
  5. COMPONENTS: Include 2 matching pillowcases with the exact same diamond pattern and color.
  6. REALISM: High-end interior design photography. Soft natural lighting, realistic fabric folds, shadows suitable for the room's light source.`;

  try {
    const response = await ai.models.generateContent({
      model: model,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType, 
            },
          },
          {
            text: prompt,
          },
        ],
      },
    });

    // Extract image from response
    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Error editing image:", error);
    throw error;
  }
};

// 2. Generate Marketing Copy (Persuasive Sales Text)
export const generateMarketingCopy = async (base64Image: string, colorName: string): Promise<string> => {
  const ai = await getClient();
  
  // Ensure we send a supported image format (Rasterize SVGs if needed)
  const { data: cleanBase64, mimeType } = await ensureSupportedImageFormat(base64Image);
  
  const prompt = `
    Act as a professional interior design sales expert for 'Litper Hogar'.
    Analyze the attached bedroom photo. The user is interested in the '${colorName}' bed protector.
    
    Output a BULLET POINT LIST (HTML or Markdown) of exactly 3 persuasive reasons why this color is perfect for this specific room.
    
    Requirements:
    - Use emojis for each bullet point.
    - Mention 'Últimas unidades' in one point.
    - Mention 'Envío Gratis hoy' in one point.
    - Total length MUST be under 600 characters.
    - Be professional, organized, and persuasive.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          { inlineData: { data: cleanBase64, mimeType: mimeType } },
          { text: prompt },
        ],
      },
    });
    return response.text || "Excelente elección para tu hogar.";
  } catch (error) {
    console.error("Error generating copy:", error);
    return "- ✨ Excelente combinación con tu espacio.\n- ⏳ Últimas unidades disponibles.\n- 🚚 Envío Gratis hoy mismo.";
  }
};

// 3. Generate Image (Inspiration) - Uses Gemini 3 Pro Image Preview
// Requires Paid/User Key Selection
export const generateImageWithGemini = async (
  prompt: string,
  aspectRatio: AspectRatio,
  imageSize: ImageSize
): Promise<string> => {
  
  // Ensure we have a key for Pro models
  if ((window as any).aistudio) {
    const hasKey = await (window as any).aistudio.hasSelectedApiKey();
    if (!hasKey) {
      throw new Error("KEY_REQUIRED");
    }
  }

  const ai = await getClient(true);
  
  try {
    const response = await ai.models.generateContent({
      model: MODEL_GENERATE_PRO,
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: aspectRatio,
          imageSize: imageSize
        }
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image generated.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

// 4. Analyze Image - Uses Gemini 3 Pro Preview
export const analyzeImageWithGemini = async (base64Image: string): Promise<string> => {
  const ai = await getClient();
  const { data: cleanBase64, mimeType } = await ensureSupportedImageFormat(base64Image);

  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_ANALYZE,
      contents: {
        parts: [
          {
            inlineData: {
              data: cleanBase64,
              mimeType: mimeType,
            },
          },
          {
            text: "Analyze this bedroom photo. Suggest which 'LITPER' bed protector color (White, Grey, Beige, Navy, Black) would fit best with the current decor and why. Keep it brief and persuasive.",
          },
        ],
      },
    });
    return response.text || "Could not analyze image.";
  } catch (error) {
    console.error("Error analyzing image:", error);
    throw error;
  }
};

// 5. Fast Chat - Uses Gemini 2.5 Flash Lite
export const sendChatMessage = async (message: string): Promise<string> => {
  const ai = await getClient();
  try {
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: MODEL_FAST_CHAT,
      contents: `You are a helpful assistant for LITPER, a premium bed protector brand. Answer briefly and politely. User asks: ${message}`,
    });
    return response.text || "";
  } catch (error) {
    console.error("Error in chat:", error);
    return "Lo siento, hubo un error de conexión.";
  }
};

export const promptForApiKey = async () => {
  if ((window as any).aistudio) {
    await (window as any).aistudio.openSelectKey();
  }
};