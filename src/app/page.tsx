'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LandingPage() {
  const router = useRouter();

  useEffect(() => {
    // For now, we skip login and go directly to the dashboard
    // as per the new requirements.
    router.replace('/dashboard');
  }, [router]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center">
      <p>Loading...</p>
    </div>
  );
}
