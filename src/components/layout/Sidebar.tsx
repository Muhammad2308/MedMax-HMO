'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard, PhoneCall, QrCode, Users,
  CreditCard, Building2, BarChart3, Settings,
  LogOut, X, UserCog,
} from 'lucide-react';
import Image from 'next/image';
import { useMenu } from './MenuContext';
import { useAuth } from '@/context/AuthContext';
import { logoutApi } from '@/api/auth';

function NavContent({
  isActive,
  onClose,
  showClose,
}: {
  isActive: (href: string) => boolean;
  onClose?: () => void;
  showClose?: boolean;
}) {
  const { user, hasOrgPermission, clearAuth } = useAuth();
  const router = useRouter();

  const canAccessCallCenter = !user || user.is_org_admin || hasOrgPermission('call_center_access');
  const canAccessCodes = !user || user.is_org_admin || hasOrgPermission('operations_access');
  const canAccessVetting = !user || user.is_org_admin || hasOrgPermission('operations_access');
  const canAccessBilling = !user || user.is_org_admin || hasOrgPermission('accounts_access');
  const canAccessReports = !user || user.is_org_admin || hasOrgPermission('accounts_access');
  const canManageUsers = !user || user.is_org_admin || hasOrgPermission('manage_users');

  const MENU_ITEMS = [
    { label: 'Dashboard', icon: LayoutDashboard, href: '/', show: true },
    { label: 'Call Center', icon: PhoneCall, href: '/call-center', show: canAccessCallCenter },
    { label: 'Manage Codes', icon: QrCode, href: '/manage-codes', show: canAccessCodes },
    { label: 'Enrollees', icon: Users, href: '/enrollees', show: true },
    { label: 'Billing', icon: CreditCard, href: '/billing', show: canAccessBilling },
    { label: 'Providers', icon: Building2, href: '/marketing/providers', show: true },
    { label: 'Intelligence', icon: BarChart3, href: '/reports', show: canAccessReports },
    { label: 'Manage Users', icon: UserCog, href: '/manage-users', show: canManageUsers },
  ];

  const BOTTOM_ITEMS = [
    { label: 'Settings', icon: Settings, href: '/settings' },
  ];

  const handleLogout = async () => {
    try { await logoutApi(); } catch { /* ignore */ }
    clearAuth();
    router.replace('/landing');
  };

  const initials = user
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AD';

  return (
    <>
      {/* Logo row */}
      <div style={{ padding: '24px 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, overflow: 'hidden', flexShrink: 0, boxShadow: '0 0 20px rgba(6,182,212,0.3)' }}>
            <Image src="/logo.png" alt="MEDX Logo" width={38} height={38} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', letterSpacing: '-0.04em', color: '#f1f5f9', lineHeight: 1.1 }}>MEDX</div>
            <div style={{ fontSize: '0.65rem', color: '#475569', fontWeight: 600, letterSpacing: '0.12em', textTransform: 'uppercase' }}>HMO Portal</div>
          </div>
        </div>
        {showClose && (
          <button onClick={onClose} aria-label="Close menu" style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 150ms ease' }}>
            <X size={16} />
          </button>
        )}
      </div>

      <div style={{ padding: '4px 20px 8px', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#334155' }}>
        Navigation
      </div>

      <nav style={{ flex: 1, padding: '0 12px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {MENU_ITEMS.filter((item) => item.show).map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'all 180ms cubic-bezier(0.16,1,0.3,1)', background: active ? 'linear-gradient(90deg,rgba(6,182,212,0.12),rgba(6,182,212,0.04))' : 'transparent', color: active ? '#06b6d4' : '#64748b', fontWeight: active ? 600 : 500, fontSize: '0.875rem', border: active ? '1px solid rgba(6,182,212,0.2)' : '1px solid transparent' }}
              onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; } }}
              onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; } }}
            >
              {active && <span style={{ position: 'absolute', left: 0, top: '50%', transform: 'translateY(-50%)', width: 3, height: '60%', background: '#06b6d4', borderRadius: '0 4px 4px 0', boxShadow: '0 0 8px #06b6d4' }} />}
              <item.icon size={18} strokeWidth={active ? 2.5 : 2} style={{ flexShrink: 0, filter: active ? 'drop-shadow(0 0 5px rgba(6,182,212,0.5))' : 'none' }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div style={{ margin: '0 12px', height: 1, background: 'rgba(255,255,255,0.06)' }} />

      <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {BOTTOM_ITEMS.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, textDecoration: 'none', transition: 'all 180ms ease', background: active ? 'rgba(6,182,212,0.10)' : 'transparent', color: active ? '#06b6d4' : '#64748b', fontWeight: 500, fontSize: '0.875rem', border: '1px solid transparent' }}
              onMouseEnter={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.color = '#cbd5e1'; } }}
              onMouseLeave={(e) => { if (!active) { (e.currentTarget as HTMLElement).style.background = 'transparent'; (e.currentTarget as HTMLElement).style.color = '#64748b'; } }}
            >
              <item.icon size={18} strokeWidth={2} style={{ flexShrink: 0 }} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>

      <div style={{ padding: 12, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <button
          onClick={handleLogout}
          style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', cursor: 'pointer', transition: 'all 180ms ease', fontFamily: 'inherit' }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; }}
        >
          <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'linear-gradient(135deg,#06b6d4,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#fff', flexShrink: 0 }}>
            {initials}
          </div>
          <div style={{ flex: 1, overflow: 'hidden', textAlign: 'left' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name ?? 'User'}
            </div>
            <div style={{ fontSize: '0.65rem', color: '#475569', marginTop: 1 }}>
              {user?.is_org_admin ? 'HMO Admin' : (user?.roles[0]?.title ?? 'Staff')}
            </div>
          </div>
          <LogOut size={14} style={{ color: '#475569', flexShrink: 0 }} />
        </button>
      </div>
    </>
  );
}

export const Sidebar = () => {
  const pathname = usePathname();
  const { isOpen, close: onClose } = useMenu();
  const isActive = (href: string) => href === '/' ? pathname === '/' : pathname.startsWith(href);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  const panelBase: React.CSSProperties = {
    width: 240, flexShrink: 0, flexDirection: 'column',
    background: 'rgba(11,17,32,0.95)',
    backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
    borderRight: '1px solid rgba(255,255,255,0.07)',
  };

  return (
    <>
      <aside className="sidebar-desktop" style={{ ...panelBase, height: '100vh', position: 'sticky', top: 0, zIndex: 40 }}>
        <NavContent isActive={isActive} />
      </aside>

      <div className="sidebar-backdrop" onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', opacity: isOpen ? 1 : 0, pointerEvents: isOpen ? 'auto' : 'none', transition: 'opacity 250ms ease' }} />

      <aside className="sidebar-drawer" style={{ ...panelBase, position: 'fixed', top: 0, left: 0, height: '100dvh', zIndex: 61, overflowY: 'auto', boxShadow: '8px 0 40px rgba(0,0,0,0.5)', transform: isOpen ? 'translateX(0)' : 'translateX(-100%)', transition: 'transform 280ms cubic-bezier(0.16,1,0.3,1)' }}>
        <NavContent isActive={isActive} onClose={onClose} showClose />
      </aside>
    </>
  );
};
