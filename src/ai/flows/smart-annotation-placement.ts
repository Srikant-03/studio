'use server';

/**
 * @fileOverview This file defines a Genkit flow for smart annotation placement in a book.
 *
 * It allows users to automatically detect important keyphrases or sections within the book using AI, 
 * making it easier to create annotations.
 *
 * @interface SmartAnnotationPlacementInput - The input type for the smartAnnotationPlacement function.
 * @interface SmartAnnotationPlacementOutput - The output type for the smartAnnotationPlacement function.
 * @function smartAnnotationPlacement - The main function that orchestrates the smart annotation placement process.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SmartAnnotationPlacementInputSchema = z.object({
  pdfText: z.string().describe('The text content of the PDF document.'),
});
export type SmartAnnotationPlacementInput = z.infer<typeof SmartAnnotationPlacementInputSchema>;

const SmartAnnotationPlacementOutputSchema = z.object({
  keyPhrases: z.array(z.string()).describe('An array of key phrases identified in the document.'),
});
export type SmartAnnotationPlacementOutput = z.infer<typeof SmartAnnotationPlacementOutputSchema>;

export async function smartAnnotationPlacement(input: SmartAnnotationPlacementInput): Promise<SmartAnnotationPlacementOutput> {
  return smartAnnotationPlacementFlow(input);
}

const prompt = ai.definePrompt({
  name: 'smartAnnotationPlacementPrompt',
  input: {schema: SmartAnnotationPlacementInputSchema},
  output: {schema: SmartAnnotationPlacementOutputSchema},
  prompt: `You are an AI assistant designed to identify key phrases in a document.

  Analyze the following text and identify the most important key phrases or sections that a user might want to annotate. Return a list of these key phrases.

  Text: {{{pdfText}}}

  Key Phrases:`, // Ensure this is valid Handlebars.
});

const smartAnnotationPlacementFlow = ai.defineFlow(
  {
    name: 'smartAnnotationPlacementFlow',
    inputSchema: SmartAnnotationPlacementInputSchema,
    outputSchema: SmartAnnotationPlacementOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
