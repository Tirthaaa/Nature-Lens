import { PlantIdentifier } from '@/components/plant-identifier';
import { Leaf } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center p-4 sm:p-8 md:p-12 lg:p-24 bg-background">
      <div className="w-full max-w-2xl">
        <header className="text-center mb-8">
          <div className="flex justify-center items-center gap-4 mb-2">
            <Leaf className="w-12 h-12 text-primary" />
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-headline font-bold text-primary">
              Nature Lens
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-md mx-auto">
            Discover the world of plants around you. Snap a photo to learn more.
          </p>
        </header>
        <PlantIdentifier />
      </div>
    </main>
  );
}
