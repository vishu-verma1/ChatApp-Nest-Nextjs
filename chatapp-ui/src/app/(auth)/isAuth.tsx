"use client"

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

const isAuth = (Component: any) => {
  return function ProtectedComponent(props: any) {
    const router = useRouter();
    const [token, setToken] = useState<string | null>(null);

    useEffect(() => {
    
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        router.push('/sign-in');
      } else {
        setToken(storedToken);
      }
    }, [router]);

    if (!token) {
      
      return null;
    }

    return <Component {...props} />;
  };
};

export default isAuth;