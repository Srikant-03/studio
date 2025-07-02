'use server';

import { getSmartAnnotations, SmartAnnotationInput, SmartAnnotationOutput } from '@/ai/flows/smart-annotation-placement';

export async function runSmartAnnotations(
  input: SmartAnnotationInput
): Promise<SmartAnnotationOutput> {
  try {
    return await getSmartAnnotations(input);
  } catch (error) {
    console.error('Error running smart annotations flow:', error);
    // In a real app, you might want more robust error handling or a custom error type.
    throw new Error('Failed to generate smart annotations.');
  }
}
