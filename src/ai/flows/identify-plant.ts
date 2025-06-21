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
  isPlant: z.boolean().describe('Whether the image contains a plant.'),
  commonName: z.string().describe('The common name of the plant. Returns "Unknown" if not a plant or cannot be identified.'),
  scientificName: z.string().describe('The scientific name of the plant. Returns "Unknown" if not a plant or cannot be identified.'),
  habitat: z.string().describe('The natural environment of the plant. Returns "Unknown" if not a plant or cannot be identified.'),
  species: z.string().describe('The species of the plant. Returns "Unknown" if not a plant or cannot be identified.'),
  lifespan: z.string().describe('The typical lifespan of the plant. Returns "Unknown" if not a plant or cannot be identified.'),
  description: z.string().describe('A detailed description. If it is a plant, describe the plant. If not, describe what is in the image.'),
});
export type IdentifyPlantOutput = z.infer<typeof IdentifyPlantOutputSchema>;

export async function identifyPlant(input: IdentifyPlantInput): Promise<IdentifyPlantOutput> {
  return identifyPlantFlow(input);
}

const prompt = ai.definePrompt({
  name: 'identifyPlantPrompt',
  input: {schema: IdentifyPlantInputSchema},
  output: {schema: IdentifyPlantOutputSchema},
  prompt: `You are an expert botanist. Your task is to analyze the provided photo.

  First, determine if the image contains a plant. Set the 'isPlant' field accordingly.

  If it is a plant, identify it and fill in all the details: common name, scientific name, habitat, species, lifespan, and a detailed description. If any detail is unknown, use the string "Unknown".

  If it is not a plant, set 'isPlant' to false, fill the plant-specific fields with "Unknown", and provide a description of what you see in the image.
  
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
