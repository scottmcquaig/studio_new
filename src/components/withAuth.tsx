
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

const withAuth = <P extends object>(WrappedComponent: React.ComponentType<P>) => {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { currentUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !currentUser) {
        router.push('/login');
      }
    }, [currentUser, loading, router]);

    if (loading || !currentUser) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      );
    }

    return <WrappedComponent {...props} />;
  };

  return WithAuthComponent;
};

export default withAuth;
