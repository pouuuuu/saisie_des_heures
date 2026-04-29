'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
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
      } catch (err) {
        console.error('Error:', err);
        router.push('/login');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchUser();
    } else {
      router.push('/login');
    }
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Navigation mobile (bottom)
  const navItems = [
    {
      label: '📊 Heures',
      href: '/heures',
      roles: ['WORKER', 'TEAM_LEAD', 'HR'],
    },
    {
      label: '🏗️ Chantiers',
      href: '/chantiers',
      roles: ['WORKER', 'TEAM_LEAD', 'HR'],
    },
    {
      label: '👥 Équipe',
      href: '/equipe',
      roles: ['TEAM_LEAD'],
    },
    {
      label: '✅ Validation',
      href: '/validation',
      roles: ['TEAM_LEAD', 'HR'],
    },
    {
      label: '📈 Rapports',
      href: '/rapports',
      roles: ['HR'],
    },
    {
      label: '⚙️ Admin',
      href: '/admin/clients',
      roles: ['ADMIN'],
    },
    {
      label: '👤 Profil',
      href: '/profil',
      roles: ['WORKER', 'TEAM_LEAD', 'HR', 'ADMIN'],
    },
  ];

  const visibleNavItems = navItems.filter(
    item => user && item.roles.includes(user.role)
  );

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Top bar */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold text-blue-600">Saisie des Heures</h1>
          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-600">{user?.name}</span>
            <button
              onClick={() => {
                localStorage.removeItem('accessToken');
                router.push('/login');
              }}
              className="text-sm text-red-600 hover:text-red-700 font-semibold"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto pb-20 md:pb-0">
        {children}
      </main>

      {/* Bottom navigation (mobile) */}
      <nav className="fixed bottom-0 left-0 right-0 md:hidden bg-white border-t border-gray-200 shadow-lg">
        <div className="flex overflow-x-auto">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`flex-1 py-3 px-2 text-xs font-semibold text-center transition min-h-touch ${
                pathname === item.href
                  ? 'text-blue-600 border-t-2 border-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Side navigation (desktop) */}
      <nav className="hidden md:block absolute left-0 top-20 w-48 bg-white border-r border-gray-200 h-[calc(100vh-80px)]">
        <div className="p-4 space-y-2">
          {visibleNavItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`block px-4 py-2 rounded-lg transition ${
                pathname === item.href
                  ? 'bg-blue-100 text-blue-600 font-semibold'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>

      {/* Content area (desktop with sidebar) */}
      <style jsx>{`
        @media (min-width: 768px) {
          main {
            margin-left: 12rem;
          }
        }
      `}</style>
    </div>
  );
}
