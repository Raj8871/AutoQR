
'use server';
/**
 * @fileOverview AI Help Assistant flow for LinkSpark.
 *
 * - answerHelpQuestion - A function that takes a user's question and provides an answer based on LinkSpark features.
 * - HelpQuestionInput - The input type for the answerHelpQuestion function.
 * - HelpQuestionOutput - The return type for the answerHelpQuestion function.
 */

import {ai} from '@/ai/ai-instance'; // Corrected import path
import {z} from 'genkit';

const HelpQuestionInputSchema = z.object({
  question: z.string().describe('The user\'s question about the LinkSpark application.'),
});
export type HelpQuestionInput = z.infer<typeof HelpQuestionInputSchema>;

const HelpQuestionOutputSchema = z.object({
  answer: z.string().describe('The AI-generated answer to the user\'s question.'),
});
export type HelpQuestionOutput = z.infer<typeof HelpQuestionOutputSchema>;

export async function answerHelpQuestion(input: HelpQuestionInput): Promise<HelpQuestionOutput> {
  return helpAssistantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'helpAssistantPrompt',
  input: {schema: HelpQuestionInputSchema},
  output: {schema: HelpQuestionOutputSchema},
  prompt: `You are a helpful AI assistant for LinkSpark, a QR code generator website. Your goal is to answer user questions clearly and concisely based on the known features of the application.

  LinkSpark Features:
  - QR Code Types: Website URL, Plain Text, Email Address, Phone Number, WhatsApp Message, SMS Message, Google Maps Location, Calendar Event (ICS format), Wi-Fi Network, Contact (vCard), UPI Payment.
  - Customization: QR code color (dots, background, corners), dot style (square, dots, rounded, classy, etc.), corner style (square, extra-rounded, dot), logo integration (upload, size, shape - square/circle, opacity, hide dots behind logo).
  - Download: High-resolution PNG, JPEG, WEBP, and SVG formats.
  - History: Generated QR codes (with labels and previews) are saved locally in the user's browser. History can be searched, items can be loaded, duplicated, deleted, or have their labels edited.
  - Other: Live preview updates, responsive design, privacy-focused (data stored locally).

  User Question: {{{question}}}

  Based ONLY on the features listed above, provide a helpful answer to the user's question. If the question is about a feature not listed or outside the scope of LinkSpark, politely state that the feature is not available or you cannot help with that specific query. Keep the answer brief and to the point.`,
});

const helpAssistantFlow = ai.defineFlow(
  {
    name: 'helpAssistantFlow',
    inputSchema: HelpQuestionInputSchema,
    outputSchema: HelpQuestionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
