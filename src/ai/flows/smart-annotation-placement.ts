'use server';
/**
 * @fileOverview A Genkit flow for generating smart annotations from PDF text.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

export const SmartAnnotationInputSchema = z.object({
  pageText: z.string().describe('The full text content of a single PDF page.'),
});
export type SmartAnnotationInput = z.infer<typeof SmartAnnotationInputSchema>;

const SuggestedAnnotationSchema = z.object({
    quote: z.string().describe("The exact quote from the text to be annotated."),
    comment: z.string().describe("The insightful comment or summary for the annotation."),
    topic: z.string().describe("A one or two-word topic for the annotation (e.g., 'Key Insight', 'Character Development').")
});

export const SmartAnnotationOutputSchema = z.object({
  suggestions: z.array(SuggestedAnnotationSchema).describe('A list of suggested annotations for the page.'),
});
export type SmartAnnotationOutput = z.infer<typeof SmartAnnotationOutputSchema>;


export async function getSmartAnnotations(input: SmartAnnotationInput): Promise<SmartAnnotationOutput> {
  return smartAnnotationFlow(input);
}

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

const smartAnnotationFlow = ai.defineFlow(
  {
    name: 'smartAnnotationFlow',
    inputSchema: SmartAnnotationInputSchema,
    outputSchema: SmartAnnotationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt(input);
    return output!;
  }
);
