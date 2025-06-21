'use server';

/**
 * @fileOverview Identifies a plant from a picture and provides a description.
 *
 * - identifyPlant - A function that handles the plant identification process.
 * - IdentifyPlantInput - The input type for the identifyPlant function.
 * - IdentifyPlantOutput - The return type for the identifyPlant function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const IdentifyPlantInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      "A photo of a plant, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
    ),
});
export type IdentifyPlantInput = z.infer<typeof IdentifyPlantInputSchema>;

const IdentifyPlantOutputSchema = z.object({
  scientificName: z.string().describe('The scientific name of the plant. Returns "N/A" if not a plant or if unknown.'),
  commonName: z.string().describe('The common name of the plant. Returns "N/A" if not a plant or if unknown.'),
  habitat: z.string().describe('The natural environment of the plant. Returns "N/A" if not a plant or if unknown.'),
  species: z.string().describe('The species of the plant. Returns "N/A" if not a plant or if unknown.'),
  lifespan: z.string().describe('The typical lifespan of the plant. Returns "N/A" if not a plant or if unknown.'),
  description: z.string().describe('A detailed description of the plant. If the image is not a plant, describe what is in the image instead.'),
});
export type IdentifyPlantOutput = z.infer<typeof IdentifyPlantOutputSchema>;

export async function identifyPlant(input: IdentifyPlantInput): Promise<IdentifyPlantOutput> {
  return identifyPlantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPlantPrompt',
  input: {schema: IdentifyPlantInputSchema},
  output: {schema: IdentifyPlantOutputSchema},
  prompt: `You are an expert botanist. Your task is to identify the plant in the provided photo. 
  
  If the image contains a plant, provide its common and scientific names, habitat, species, lifespan, and a detailed description.
  
  If you are certain the image does not contain a plant, or if you cannot identify the plant, return "N/A" for all fields except for the description. In the description, explain what you see in the image.
  
  Photo: {{media url=photoDataUri}}`,
});

const identifyPlantFlow = ai.defineFlow(
  {
    name: 'identifyPlantFlow',
    inputSchema: IdentifyPlantInputSchema,
    outputSchema: IdentifyPlantOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
