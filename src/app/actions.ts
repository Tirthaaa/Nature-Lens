'use server';

import { identifyPlant, IdentifyPlantInput, IdentifyPlantOutput } from '@/ai/flows/identify-plant';

export async function handleIdentifyPlant(
  imageDataUri: string
): Promise<IdentifyPlantOutput | { error: string }> {
  try {
    const input: IdentifyPlantInput = { photoDataUri: imageDataUri };
    const result = await identifyPlant(input);
    return result;
  } catch (e) {
    console.error('Error identifying plant:', e);
    const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred.';
    return { error: `Failed to identify the plant. Please try another image.` };
  }
}
