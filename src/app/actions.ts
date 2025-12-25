'use server';

import { ai } from '@/ai/genkit';
import type { SmartAnnotationInput, SmartAnnotationOutput } from '@/ai/flows/smart-annotation.types';
import { SmartAnnotationInputSchema, SmartAnnotationOutputSchema } from '@/ai/flows/smart-annotation.types';

// Define the flow directly within the server action file to prevent it from being bundled with client code.
const smartAnnotationFlow = ai.defineFlow(
  {
    name: 'smartAnnotationFlow',
    inputSchema: SmartAnnotationInputSchema,
    outputSchema: SmartAnnotationOutputSchema,
  },
  async (input) => {
    // The prompt can be defined here or imported if it's in a separate, non-server-logic file.
    // For simplicity and clear separation, it's defined here.
    const prompt = ai.definePrompt({
        name: 'smartAnnotationPrompt',
        input: {schema: SmartAnnotationInputSchema},
        output: {schema: SmartAnnotationOutputSchema},
        prompt: `You are a literary expert and a helpful reading assistant. Your task is to analyze the text from a page of a book and generate insightful annotations.

Analyze the following text content:
---
{{{pageText}}}
---

Based on the text, identify up to 3 key passages that are interesting, thematically important, or confusing. For each passage, provide:
1.  The exact quote from the text.
2.  A concise, insightful comment explaining its significance or asking a thought-provoking question.
3.  A brief topic for the annotation.

Return your response in the specified JSON format. If no interesting passages are found, return an empty list of suggestions.`,
    });
    
    const { output } = await prompt(input);
    return output!;
  }
);


export async function runSmartAnnotations(
  input: SmartAnnotationInput
): Promise<SmartAnnotationOutput> {
  try {
    // Call the flow defined in this server context.
    return await smartAnnotationFlow(input);
  } catch (error) {
    console.error('Error running smart annotations flow:', error);
    // In a real app, you might want more robust error handling or a custom error type.
    throw new Error('Failed to generate smart annotations.');
  }
}
