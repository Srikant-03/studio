/**
 * @fileOverview Types and schemas for the smart-annotation-placement flow.
 */
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
