
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import type { UserRole } from '@/lib/data';

const withAuth = <P extends object>(
  WrappedComponent: React.ComponentType<P>,
  allowedRoles?: UserRole[]
) => {
  const WithAuthComponent: React.FC<P> = (props) => {
    const { appUser, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (loading) {
        // Do nothing while loading to prevent premature redirects.
        return;
      }

      if (!appUser) {
        router.push('/login');
        return;
      }

      if (allowedRoles && allowedRoles.length > 0 && (!appUser.role || !allowedRoles.includes(appUser.role))) {
        router.push('/'); // Redirect to a safe page if role is not allowed
      }
    }, [appUser, loading, router]);

    if (loading || !appUser) {
      return (
        <div className="flex h-screen items-center justify-center">
          <div>Loading...</div>
        </div>
      );
    }
    
    if (allowedRoles && allowedRoles.length > 0 && (!appUser.role || !allowedRoles.includes(appUser.role))) {
         return (
            <div className="flex h-screen items-center justify-center">
                <div>Restricted Access. Redirecting...</div>
            </div>
        );
    }

    return <WrappedComponent {...props} />;
  };

  WithAuthComponent.displayName = `WithAuth(${WrappedComponent.displayName || WrappedComponent.name || 'Component'})`;

  return WithAuthComponent;
};

export default withAuth;
