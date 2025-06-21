'use server';

/**
 * @fileOverview Describes a plant based on the provided information.
 *
 * - describePlantDetails - A function that takes plant information and returns a detailed description.
 * - DescribePlantDetailsInput - The input type for the describePlantDetails function.
 * - DescribePlantDetailsOutput - The return type for the describePlantDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DescribePlantDetailsInputSchema = z.object({
  plantName: z.string().describe('The common name of the plant.'),
});
export type DescribePlantDetailsInput = z.infer<typeof DescribePlantDetailsInputSchema>;

const DescribePlantDetailsOutputSchema = z.object({
  scientificName: z.string().describe('The scientific name of the plant.'),
  habitat: z.string().describe('The typical habitat of the plant.'),
  species: z.string().describe('The species of the plant.'),
  lifespan: z.string().describe('The typical lifespan of the plant.'),
  description: z.string().describe('A detailed description of the plant.'),
});
export type DescribePlantDetailsOutput = z.infer<typeof DescribePlantDetailsOutputSchema>;

export async function describePlantDetails(input: DescribePlantDetailsInput): Promise<DescribePlantDetailsOutput> {
  return describePlantDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'describePlantDetailsPrompt',
  input: {schema: DescribePlantDetailsInputSchema},
  output: {schema: DescribePlantDetailsOutputSchema},
  prompt: `You are an expert botanist. Provide a detailed description of the plant named {{{plantName}}}, including its scientific name, habitat, species, lifespan, and a general description.\n\nOutput the response in JSON format.`,
});

const describePlantDetailsFlow = ai.defineFlow(
  {
    name: 'describePlantDetailsFlow',
    inputSchema: DescribePlantDetailsInputSchema,
    outputSchema: DescribePlantDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
