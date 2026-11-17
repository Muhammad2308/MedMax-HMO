'use client';

import React, { useState } from 'react';
import { Plus, Mail, RotateCw, Ban } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { InviteStaffModal } from './InviteStaffModal';
import { useOrgInvitations, useResendInvitation, useRevokeInvitation } from '@/hooks/useOrgInvitations';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/context/ToastContext';
import type { OrgInvitation } from '@/api/orgInvitations';

const STATUS_TONE: Record<OrgInvitation['status'], { label: string; bg: string; border: string; text: string }> = {
  pending:  { label: 'Pending',  bg: 'rgba(6,182,212,0.1)',   border: 'rgba(6,182,212,0.25)',   text: '#06b6d4' },
  accepted: { label: 'Accepted', bg: 'rgba(16,185,129,0.1)',  border: 'rgba(16,185,129,0.25)',  text: '#10b981' },
  expired:  { label: 'Expired',  bg: 'rgba(100,116,139,0.1)', border: 'rgba(100,116,139,0.25)', text: '#64748b' },
  revoked:  { label: 'Revoked',  bg: 'rgba(239,68,68,0.1)',   border: 'rgba(239,68,68,0.25)',   text: '#ef4444' },
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
}

export function InvitationsGrid() {
  const { user: me, hasOrgPermission } = useAuth();
  const { toast } = useToast();
  const { data: invitations = [], isLoading } = useOrgInvitations();
  const resendInvitation = useResendInvitation();
  const revokeInvitation = useRevokeInvitation();
  const [showInvite, setShowInvite] = useState(false);

  const canInvite = me?.is_org_admin || hasOrgPermission('create_users');
  const canManage = me?.is_org_admin || hasOrgPermission('manage_users');

  const handleResend = async (id: number) => {
    try {
      await resendInvitation.mutateAsync(id);
      toast('Invitation resent', 'success');
    } catch { toast('Failed to resend invitation.', 'error'); }
  };

  const handleRevoke = async (id: number) => {
    try {
      await revokeInvitation.mutateAsync(id);
      toast('Invitation revoked', 'success');
    } catch { toast('Failed to revoke invitation.', 'error'); }
  };

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#e2e8f0' }}>Pending Invitations</h2>
        {canInvite && (
          <Button onClick={() => setShowInvite(true)} size="sm" style={{ gap: 7 }}>
            <Plus size={14} /> Invite Staff Member
          </Button>
        )}
      </div>

      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 120px auto', gap: 0, padding: '10px 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['Email', 'Status', 'Invited By', 'Expires', ''].map((h) => (
            <div key={h} style={{ fontSize: '0.68rem', fontWeight: 700, color: '#334155', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{h}</div>
          ))}
        </div>

        {isLoading && (
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 20, borderRadius: 6 }} />
            ))}
          </div>
        )}

        {!isLoading && invitations.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 12 }}>
            <Mail size={28} color="#334155" />
            <p style={{ color: '#475569', fontSize: '0.85rem' }}>No invitations sent yet.</p>
          </div>
        )}

        {!isLoading && invitations.map((inv, index) => (
          <div key={inv.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 160px 120px auto', gap: 0, padding: '12px 20px', alignItems: 'center', borderBottom: index < invitations.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none' }}>
            <span style={{ fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 12 }}>{inv.email}</span>
            <span style={{ display: 'inline-flex', width: 'fit-content', padding: '2px 10px', borderRadius: 99, background: STATUS_TONE[inv.status].bg, border: `1px solid ${STATUS_TONE[inv.status].border}`, color: STATUS_TONE[inv.status].text, fontSize: '0.7rem', fontWeight: 600 }}>
              {STATUS_TONE[inv.status].label}
            </span>
            <span style={{ fontSize: '0.78rem', color: '#475569' }}>{inv.invited_by?.name ?? '—'}</span>
            <span style={{ fontSize: '0.78rem', color: '#475569' }}>{formatDate(inv.expires_at)}</span>
            {canManage && inv.status === 'pending' ? (
              <div style={{ display: 'flex', gap: 6, justifySelf: 'end' }}>
                <button onClick={() => handleResend(inv.id)} disabled={resendInvitation.isPending} title="Resend" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(255,255,255,0.07)', background: 'rgba(255,255,255,0.03)', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <RotateCw size={12} />
                </button>
                <button onClick={() => handleRevoke(inv.id)} disabled={revokeInvitation.isPending} title="Revoke" style={{ width: 26, height: 26, borderRadius: 7, border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Ban size={12} />
                </button>
              </div>
            ) : <div />}
          </div>
        ))}
      </div>

      {showInvite && <InviteStaffModal onClose={() => setShowInvite(false)} />}
    </div>
  );
}
