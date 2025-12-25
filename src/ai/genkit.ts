import { genkit } from 'genkit';
import {googleAI} from '@genkit-ai/googleai';
import {devLogger, startDevServer} from '@genkit-ai/dotprompt';

export const ai = genkit({
  plugins: [
    googleAI({
      apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY,
    }),
  ],
  // Use a simple file-based trace store for development.
  // For production, use a more robust storage option.
  traceStore: {
    type: 'file',
    options: {
      path: '.genkit-traces',
    },
  },
  // Enable a development-time logger to see traces in the console.
  enableDevLogger: true,
});
