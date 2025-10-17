'use client';

import { useSearchParams } from 'next/navigation';

export default function NextPage() {
  const searchParams = useSearchParams();
  const lang = searchParams.get('lang');

  return (
    <main className="flex items-center justify-center min-h-screen bg-background">
      <div className="text-center p-6">
        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground">Next Page</h1>
        <p className="text-3xl text-gray-700">Selected Language: {lang}</p>
      </div>
    </main>
  );
}
