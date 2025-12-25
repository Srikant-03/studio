// src/ai/dev.ts
import './genkit';
// Note: We don't import the flow here anymore because it's used as a server action
// and importing it in the Genkit dev server can cause conflicts.
// The flow is still registered with Genkit via the 'use server' context when called.
