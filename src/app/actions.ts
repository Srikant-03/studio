"use server";

import { smartAnnotationPlacement } from "@/ai/flows/smart-annotation-placement";
import { z } from "zod";

const inputSchema = z.object({
  pdfText: z.string(),
});

export async function extractTextFromPdf(input: { pdfText: string }) {
  const validatedInput = inputSchema.safeParse(input);
  if (!validatedInput.success) {
    throw new Error("Invalid input");
  }

  try {
    const output = await smartAnnotationPlacement(validatedInput.data);
    return output;
  } catch (error) {
    console.error("Error in smart annotation placement flow:", error);
    return { keyPhrases: [] };
  }
}
