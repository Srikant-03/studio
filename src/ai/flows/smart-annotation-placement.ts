'use server';
/**
 * @fileOverview This file is now deprecated. The Genkit flow has been moved to src/app/actions.ts
 * to ensure a proper server/client boundary and prevent bundling server-side dependencies with the client.
 */

import type { SmartAnnotationInput, SmartAnnotationOutput } from './smart-annotation.types';

export async function getSmartAnnotations(input: SmartAnnotationInput): Promise<SmartAnnotationOutput> {
  throw new Error("This function is deprecated. The smart annotation flow is now defined directly in 'src/app/actions.ts'.");
}
