
"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePageRedirect() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/produtos');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <p className="text-lg text-muted-foreground">Redirecionando para a página de produtos...</p>
    </div>
  );
}
