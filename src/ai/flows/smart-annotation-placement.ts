'use server';
/**
 * @fileOverview A Genkit flow for generating smart annotations from PDF text.
 */

import {ai} from '@/ai/genkit';
import { SmartAnnotationInputSchema, SmartAnnotationOutputSchema, type SmartAnnotationInput } from './smart-annotation.types';


export async function getSmartAnnotations(input: SmartAnnotationInput) {
  const smartAnnotationFlow = ai.defineFlow(
    {
      name: 'smartAnnotationFlow',
      inputSchema: SmartAnnotationInputSchema,
      outputSchema: SmartAnnotationOutputSchema,
    },
    async (input) => {
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
  return smartAnnotationFlow(input);
}
