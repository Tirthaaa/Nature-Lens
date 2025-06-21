'use server';

import { identifyPlant, IdentifyPlantInput, IdentifyPlantOutput } from '@/ai/flows/identify-plant';

export async function handleIdentifyPlant(
  imageDataUri: string
): Promise<IdentifyPlantOutput | { error: string }> {
  try {
    if (!process.env.GOOGLE_API_KEY || process.env.GOOGLE_API_KEY.includes('YOUR_GOOGLE_API_KEY')) {
      return { error: 'Google API key is not configured. Please follow the instructions in the .env file.' };
    }

    const input: IdentifyPlantInput = { photoDataUri: imageDataUri };
    const result = await identifyPlant(input);
    
    if (!result) {
      return { error: 'Identification failed: The AI model did not return a valid response. This can happen with an invalid API key. Please check your key and try again.' };
    }
    
    if (!result.isPlant) {
      return { error: `This doesn't look like a plant. The AI saw: ${result.description}` };
    }
    return result;
  } catch (e: any) {
    console.error('Error identifying plant:', e);
    // The Genkit/Google AI SDK often wraps API errors.
    // Let's try to provide a more specific message.
    let errorMessage = e.message || 'An unexpected error occurred.';
    if (e.cause?.message) {
      errorMessage = e.cause.message;
    }
    if (errorMessage.includes('API key not valid')) {
      errorMessage = 'Your Google API key is not valid. Please get a new key from Google AI Studio and update your .env file.';
    }

    return { error: `Identification failed: ${errorMessage}` };
  }
}
