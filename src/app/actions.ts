'use server';

import { identifyPlant, IdentifyPlantInput, IdentifyPlantOutput } from '@/ai/flows/identify-plant';

export async function handleIdentifyPlant(
  imageDataUri: string
): Promise<IdentifyPlantOutput | { error: string }> {
  try {
    const input: IdentifyPlantInput = { photoDataUri: imageDataUri };
    const result = await identifyPlant(input);
    if (result.commonName === 'N/A') {
      return { error: `Could not identify a plant in the image. The AI saw: ${result.description}` };
    }
    return result;
  } catch (e) {
    console.error('Error identifying plant:', e);
    return { error: `An unexpected error occurred during identification. Please try again.` };
  }
}
