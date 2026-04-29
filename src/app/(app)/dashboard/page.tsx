'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch current user
    const token = localStorage.getItem('accessToken');

    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          router.push('/login');
          return;
        }

        const data = await response.json();
        setUser(data.user);

        // Redirect based on role
        if (data.user.role === 'WORKER') {
          router.push('/heures');
        } else if (data.user.role === 'TEAM_LEAD') {
          router.push('/equipe');
        } else if (data.user.role === 'HR') {
          router.push('/rapports');
        } else if (data.user.role === 'ADMIN') {
          router.push('/admin/clients');
        }
      } catch (err) {
        console.error('Error fetching user:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p className="text-gray-600">Redirection en cours...</p>
    </div>
  );
}
