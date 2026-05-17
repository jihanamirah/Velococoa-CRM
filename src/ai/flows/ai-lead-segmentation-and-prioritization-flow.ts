'use server';
/**
 * @fileOverview This file defines a Genkit flow for AI-driven lead segmentation and prioritization.
 *
 * - aiLeadSegmentationAndPrioritization - A function that analyzes lead details to suggest a business segment and follow-up priority.
 * - AiLeadSegmentationAndPrioritizationInput - The input type for the aiLeadSegmentationAndPrioritization function.
 * - AiLeadSegmentationAndPrioritizationOutput - The return type for the aiLeadSegmentationAndPrioritization function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AiLeadSegmentationAndPrioritizationInputSchema = z.object({
  namaLengkap: z.string().describe('Full name of the lead contact.'),
  namaPerusahaan: z.string().describe('Name of the lead\'s company.'),
  email: z.string().email().describe('Email address of the lead.'),
  telepon: z.string().describe('Phone number of the lead.'),
  kota: z.string().describe('City where the lead\'s business is located.'),
  kategoriBisnis: z
    .string()
    .describe(
      'Business category as initially provided by the lead, for AI context. The AI should map this to one of the predefined segments.'
    ),
  promoMinat: z
    .string()
    .describe('Promotional interest expressed by the lead.'),
  estimasiVolume: z
    .string()
    .describe('Estimated volume or size of potential business from the lead.'),
  catatan: z.string().describe('Any additional notes or comments about the lead.'),
});
export type AiLeadSegmentationAndPrioritizationInput = z.infer<
  typeof AiLeadSegmentationAndPrioritizationInputSchema
>;

const AiLeadSegmentationAndPrioritizationOutputSchema = z.object({
  suggestedBusinessSegment: z
    .enum(['Kafe & Kedai Kopi', 'Bakery & Pastry', 'Hotel & Korporasi'])
    .describe('The AI-suggested business segment for the lead.'),
  followUpPriority: z
    .enum(['High', 'Medium', 'Low'])
    .describe('The AI-suggested follow-up priority for the lead.'),
  reasoning: z
    .string()
    .describe('Explanation for the suggested business segment and priority.'),
});
export type AiLeadSegmentationAndPrioritizationOutput = z.infer<
  typeof AiLeadSegmentationAndPrioritizationOutputSchema
>;

export async function aiLeadSegmentationAndPrioritization(
  input: AiLeadSegmentationAndPrioritizationInput
): Promise<AiLeadSegmentationAndPrioritizationOutput> {
  return aiLeadSegmentationAndPrioritizationFlow(input);
}

const aiLeadSegmentationAndPrioritizationPrompt = ai.definePrompt({
  name: 'aiLeadSegmentationAndPrioritizationPrompt',
  input: { schema: AiLeadSegmentationAndPrioritizationInputSchema },
  output: { schema: AiLeadSegmentationAndPrioritizationOutputSchema },
  prompt: `You are an AI sales analyst for PT VeloCocoa, a premium chocolate manufacturer. Your task is to analyze new lead details and suggest the most appropriate business segment from a predefined list and a preliminary follow-up priority. This will help in efficient lead routing and identification of high-potential opportunities.

Available Business Segments:
- 'Kafe & Kedai Kopi'
- 'Bakery & Pastry'
- 'Hotel & Korporasi'

Available Follow-Up Priorities:
- 'High' (e.g., large estimated volume, specific promotional interest, clear business need)
- 'Medium' (e.g., moderate estimated volume, general interest)
- 'Low' (e.g., small estimated volume, unclear interest, missing details)

Analyze the following lead information:
Nama Lengkap: {{{namaLengkap}}}
Nama Perusahaan: {{{namaPerusahaan}}}
Email: {{{email}}}
Telepon: {{{telepon}}}
Kota: {{{kota}}}
Kategori Bisnis (as provided by the lead, for reference): {{{kategoriBisnis}}}
Minat Promo: {{{promoMinat}}}
Estimasi Volume: {{{estimasiVolume}}}
Catatan Tambahan: {{{catatan}}}

Based on the above details, determine the best 'suggestedBusinessSegment' from the allowed list, the 'followUpPriority', and provide a 'reasoning' for your choices.`,
});

const aiLeadSegmentationAndPrioritizationFlow = ai.defineFlow(
  {
    name: 'aiLeadSegmentationAndPrioritizationFlow',
    inputSchema: AiLeadSegmentationAndPrioritizationInputSchema,
    outputSchema: AiLeadSegmentationAndPrioritizationOutputSchema,
  },
  async (input) => {
    const { output } = await aiLeadSegmentationAndPrioritizationPrompt(input);
    return output!;
  }
);
