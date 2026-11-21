'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Building2, Plus, ShieldCheck, Stethoscope, AlertTriangle, Pencil, Trash2, Check, X as XIcon } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ModalOverlay, ModalHeader } from '@/app/manage-users/users/CreateUserModal';
import { providersApi, type Schema, type SchemaProvider } from '@/api/providers';
import { schemaPlansApi, type PlanTier, type PricedService, type PricedTreatment, type PricedDrug } from '@/api/schemaPlans';
import { useToast } from '@/context/ToastContext';

function errorMessage(err: unknown): string {
  const ax = err as { response?: { data?: { message?: string; errors?: Record<string, string[]> } } };
  const errs = ax.response?.data?.errors;
  return (errs && Object.values(errs)[0]?.[0]) || ax.response?.data?.message || 'Something went wrong. Please try again.';
}

export default function SchemesPage() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [selectedSchemaId, setSelectedSchemaId] = useState<number | null>(null);
  const [selectedProviderId, setSelectedProviderId] = useState<number | null>(null);
  const [showCreateSchema, setShowCreateSchema] = useState(false);
  const [showAddProvider, setShowAddProvider] = useState(false);

  const { data: schemes = [], isLoading: schemesLoading } = useQuery<Schema[]>({
    queryKey: ['hmo-schemes-full'],
    queryFn: () => providersApi.getSchemas().then((res) => res.data),
  });

  const selectedSchema = schemes.find((s) => s.id === selectedSchemaId) ?? null;

  const { data: panelProviders = [], isLoading: providersLoading } = useQuery<SchemaProvider[]>({
    queryKey: ['schema-providers', selectedSchemaId],
    queryFn: () => providersApi.getSchemaProviders(selectedSchemaId as number).then((res) => res.data),
    enabled: !!selectedSchemaId,
  });

  return (
    <div style={{ padding: '32px clamp(20px, 4vw, 48px)', maxWidth: 1200, margin: '0 auto' }}>
      <header style={{ marginBottom: 28 }}>
        <h1 style={{ margin: '0 0 6px', fontSize: '1.6rem', fontWeight: 800, color: '#f1f5f9', letterSpacing: '-0.02em' }}>
          Informal Sector
        </h1>
        <p style={{ margin: 0, color: '#64748b', fontSize: '0.9rem' }}>
          Your HMO&apos;s own private health plans — no government scheme involved. Create a scheme, then add the providers on its panel.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px, 0.9fr) minmax(0, 1.6fr)', gap: 24, alignItems: 'start' }}>
        {/* ── Schemes list ─────────────────────────────── */}
        <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 700, color: '#e2e8f0' }}>Your schemes</h2>
            <Button type="button" size="sm" onClick={() => setShowCreateSchema(true)}>
              <Plus size={14} /> New
            </Button>
          </div>

          {schemesLoading && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading…</p>}
          {!schemesLoading && schemes.length === 0 && (
            <p style={{ color: '#64748b', fontSize: '0.85rem', lineHeight: 1.6 }}>
              No private schemes yet. Create one to start adding providers and plans.
            </p>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {schemes.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => { setSelectedSchemaId(s.id); setSelectedProviderId(null); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, width: '100%', textAlign: 'left',
                  padding: '10px 12px', borderRadius: 10, cursor: 'pointer', fontFamily: 'inherit',
                  border: `1px solid ${selectedSchemaId === s.id ? 'rgba(6,182,212,0.4)' : 'transparent'}`,
                  background: selectedSchemaId === s.id ? 'rgba(6,182,212,0.08)' : 'transparent',
                }}
              >
                <ShieldCheck size={16} color={selectedSchemaId === s.id ? '#06b6d4' : '#475569'} style={{ flexShrink: 0 }} />
                <span style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                  <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#e2e8f0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.title}</span>
                  <span style={{ fontSize: '0.72rem', color: '#64748b', fontFamily: 'monospace' }}>{s.package_code}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* ── Selected scheme's provider panel ────────────── */}
        <section style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
          {!selectedSchema && (
            <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
              <Building2 size={28} style={{ marginBottom: 10, opacity: 0.5 }} />
              <p style={{ margin: 0, fontSize: '0.88rem' }}>Select a scheme to manage its provider panel.</p>
            </div>
          )}

          {selectedSchema && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>{selectedSchema.title}</h2>
                  <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Provider panel</p>
                </div>
                <Button type="button" size="sm" onClick={() => setShowAddProvider(true)}>
                  <Plus size={14} /> Add Provider
                </Button>
              </div>

              <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {providersLoading && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading providers…</p>}
                {!providersLoading && panelProviders.length === 0 && (
                  <div style={{ display: 'flex', gap: 10, padding: '12px 14px', borderRadius: 10, background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.2)', color: '#fbbf24', fontSize: '0.8rem' }}>
                    <AlertTriangle size={16} style={{ flexShrink: 0, marginTop: 1 }} />
                    <span>No providers on this scheme&apos;s panel yet. Enrollees under this scheme won&apos;t have a facility to choose until you add one.</span>
                  </div>
                )}
                {panelProviders.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelectedProviderId(p.id)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 10,
                      border: `1px solid ${selectedProviderId === p.id ? 'rgba(6,182,212,0.45)' : 'rgba(255,255,255,0.06)'}`,
                      background: selectedProviderId === p.id ? 'rgba(6,182,212,0.08)' : 'rgba(255,255,255,0.02)',
                      cursor: 'pointer', textAlign: 'left', fontFamily: 'inherit', width: '100%',
                    }}
                  >
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(6,182,212,0.1)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                      <Stethoscope size={16} color="#06b6d4" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '0.86rem', fontWeight: 600, color: '#e2e8f0' }}>{p.name}</p>
                      <p style={{ margin: '2px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                        {[p.city, p.state].filter(Boolean).join(', ') || 'No address on file'}
                        {p.provider_code ? ` · ${p.provider_code}` : ''}
                      </p>
                    </div>
                    <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
                      {p.registration_status}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      </div>

      {selectedSchema && selectedProviderId && (
        <PlanPricingPanel
          schemaId={selectedSchema.id}
          providerId={selectedProviderId}
          providerName={panelProviders.find((p) => p.id === selectedProviderId)?.name ?? ''}
        />
      )}

      {showCreateSchema && (
        <CreateSchemeModal
          onClose={() => setShowCreateSchema(false)}
          onCreated={(schema) => {
            qc.invalidateQueries({ queryKey: ['hmo-schemes-full'] });
            qc.invalidateQueries({ queryKey: ['hmo-schemes'] });
            setSelectedSchemaId(schema.id);
            setShowCreateSchema(false);
            toast('Private scheme created.', 'success');
          }}
        />
      )}

      {showAddProvider && selectedSchema && (
        <AddProviderModal
          schemaId={selectedSchema.id}
          onClose={() => setShowAddProvider(false)}
          onCreated={() => {
            qc.invalidateQueries({ queryKey: ['schema-providers', selectedSchema.id] });
            setShowAddProvider(false);
            toast('Provider added to the scheme panel.', 'success');
          }}
        />
      )}
    </div>
  );
}

function CreateSchemeModal({ onClose, onCreated }: { onClose: () => void; onCreated: (schema: Schema) => void }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<{ title: string }>();

  const onSubmit = handleSubmit(async (data) => {
    try {
      const res = await providersApi.createSchema(data.title);
      onCreated(res.data);
    } catch (err: unknown) {
      setError('title', { message: errorMessage(err) });
    }
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 440 }}>
        <ModalHeader title="New private scheme" onClose={onClose} />
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input
            label="Scheme name"
            placeholder="e.g. Gold Family Plan"
            error={errors.title?.message}
            {...register('title', { required: 'A name is required' })}
          />
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>
            This creates a private scheme owned only by your organization — no government scheme is involved.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} style={{ flex: 2 }}>
              {isSubmitting ? 'Creating…' : 'Create scheme'}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

type ProviderFields = { name: string; email: string; phone: string; state: string; city: string; address: string };

function AddProviderModal({ schemaId, onClose, onCreated }: { schemaId: number; onClose: () => void; onCreated: () => void }) {
  const { register, handleSubmit, setError, formState: { errors, isSubmitting } } = useForm<ProviderFields>();

  const onSubmit = handleSubmit(async (data) => {
    try {
      await providersApi.createSchemaProvider(schemaId, data);
      onCreated();
    } catch (err: unknown) {
      setError('name', { message: errorMessage(err) });
    }
  });

  return (
    <ModalOverlay onClose={onClose}>
      <div style={{ width: '100%', maxWidth: 480 }}>
        <ModalHeader title="Add provider to scheme" onClose={onClose} />
        <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input label="Facility name" placeholder="e.g. Lagoon Specialist Hospital" error={errors.name?.message}
            {...register('name', { required: 'Facility name is required' })} />
          <Input label="Email" type="email" placeholder="facility@example.com"
            {...register('email')} />
          <Input label="Phone" type="tel" placeholder="080XXXXXXXX"
            {...register('phone')} />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
            <Input label="State" {...register('state')} />
            <Input label="City" {...register('city')} />
          </div>
          <Input label="Address" {...register('address')} />
          <p style={{ margin: 0, color: '#64748b', fontSize: '0.78rem', lineHeight: 1.5 }}>
            This adds the facility to your scheme&apos;s panel right away. Inviting the facility&apos;s own staff to sign in is a separate step, coming later.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <Button type="button" variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancel</Button>
            <Button type="submit" isLoading={isSubmitting} style={{ flex: 2 }}>
              {isSubmitting ? 'Adding…' : 'Add provider'}
            </Button>
          </div>
        </form>
      </div>
    </ModalOverlay>
  );
}

// ── Plan pricing (tiers × services/treatments/drugs) ─────────────────

const rowInputStyle: React.CSSProperties = {
  flex: 1, minWidth: 140, padding: '8px 12px', border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 8, background: 'rgba(255,255,255,0.04)', color: '#f1f5f9', fontSize: '0.85rem', fontFamily: 'inherit',
};
const rowStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 8,
  border: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.02)',
};
const rowLabelStyle: React.CSSProperties = { flex: 1, fontSize: '0.85rem', color: '#e2e8f0', fontWeight: 600, minWidth: 0 };
const rowPriceStyle: React.CSSProperties = { fontSize: '0.84rem', color: '#06b6d4', fontWeight: 700, fontVariantNumeric: 'tabular-nums' };
const iconBtnStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', background: 'none', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 6 };

function PlanPricingPanel({ schemaId, providerId, providerName }: { schemaId: number; providerId: number; providerName: string }) {
  // null until the user explicitly clicks a tier — before that, the first
  // loaded tier is used as the effective default below, without needing an
  // effect to sync it into state (tiers load async, so it can't be a plain
  // lazy useState initializer).
  const [selectedTierId, setSelectedTierId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'services' | 'treatments' | 'drugs'>('services');

  const { data: tiers = [] } = useQuery<PlanTier[]>({
    queryKey: ['plan-tiers'],
    queryFn: () => schemaPlansApi.getPlanTiers().then((res) => res.data),
    staleTime: Infinity, // static, shared across every HMO — no reason to refetch
  });

  const activeTierId = selectedTierId ?? tiers[0]?.id ?? null;

  // Resolving a tier is a POST, but the backend treats it as an idempotent
  // "get or create" (firstOrCreate) — safe to model as a cached query keyed
  // by the (schema, provider, tier) triple rather than a mutation.
  const { data: schemaPlan, isLoading: resolvingPlan } = useQuery({
    queryKey: ['schema-plan', schemaId, providerId, activeTierId],
    queryFn: () => schemaPlansApi.resolveSchemaPlan({ schema_id: schemaId, provider_id: providerId, plan_id: activeTierId as number }).then((res) => res.data),
    enabled: activeTierId !== null,
  });

  const schemaPlanId = schemaPlan?.id ?? null;

  return (
    <section style={{ marginTop: 24, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 16, padding: 20 }}>
      <div style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: '#f1f5f9' }}>Pricing — {providerName}</h2>
        <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: '#64748b' }}>Agreed prices for this provider, per plan tier.</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 18, flexWrap: 'wrap' }}>
        {tiers.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setSelectedTierId(t.id)}
            style={{
              padding: '8px 16px', borderRadius: 999, fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
              border: `1px solid ${activeTierId === t.id ? 'rgba(6,182,212,0.5)' : 'rgba(255,255,255,0.1)'}`,
              background: activeTierId === t.id ? 'rgba(6,182,212,0.12)' : 'transparent',
              color: activeTierId === t.id ? '#06b6d4' : '#94a3b8',
            }}
          >
            {t.name}
          </button>
        ))}
      </div>

      {resolvingPlan && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Setting up this tier…</p>}

      {schemaPlanId && (
        <>
          <div style={{ display: 'flex', gap: 4, marginBottom: 16, borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
            {(['services', 'treatments', 'drugs'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '10px 16px', fontSize: '0.84rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                  background: 'none', border: 'none', borderBottom: `2px solid ${activeTab === tab ? '#06b6d4' : 'transparent'}`,
                  color: activeTab === tab ? '#e2e8f0' : '#64748b', textTransform: 'capitalize',
                }}
              >
                {tab}
              </button>
            ))}
          </div>

          {activeTab === 'services' && <ServicesTab schemaPlanId={schemaPlanId} />}
          {activeTab === 'treatments' && <TreatmentsTab schemaPlanId={schemaPlanId} />}
          {activeTab === 'drugs' && <DrugsTab schemaPlanId={schemaPlanId} />}
        </>
      )}
    </section>
  );
}

function ServicesTab({ schemaPlanId }: { schemaPlanId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ name: string; price: string }>();
  const queryKey = ['schema-plan-services', schemaPlanId];

  const { data: items = [], isLoading } = useQuery<PricedService[]>({
    queryKey,
    queryFn: () => schemaPlansApi.getServices(schemaPlanId).then((res) => res.data.added),
  });

  const onAdd = handleSubmit(async (values) => {
    try {
      await schemaPlansApi.attachService(schemaPlanId, { name: values.name, price: Number(values.price) });
      qc.invalidateQueries({ queryKey });
      reset();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  });

  const saveEdit = async (id: number) => {
    try {
      await schemaPlansApi.updateService(schemaPlanId, id, Number(editPrice));
      qc.invalidateQueries({ queryKey });
      setEditingId(null);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async (id: number) => {
    try {
      await schemaPlansApi.removeService(schemaPlanId, id);
      qc.invalidateQueries({ queryKey });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div>
      <form onSubmit={onAdd} style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Service name (e.g. Consultation)" {...register('name', { required: true })} style={rowInputStyle} />
        <input placeholder="Price" type="number" step="0.01" min="0" {...register('price', { required: true })} style={{ ...rowInputStyle, flex: '0 1 140px' }} />
        <Button type="submit" size="sm" isLoading={isSubmitting}><Plus size={14} /> Add</Button>
      </form>

      {isLoading && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading…</p>}
      {!isLoading && items.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No services priced yet for this tier.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <span style={rowLabelStyle}>{item.service.title}</span>
            {editingId === item.id ? (
              <>
                <input type="number" step="0.01" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ ...rowInputStyle, flex: '0 1 120px' }} />
                <button type="button" onClick={() => saveEdit(item.id)} style={iconBtnStyle}><Check size={14} color="#10b981" /></button>
                <button type="button" onClick={() => setEditingId(null)} style={iconBtnStyle}><XIcon size={14} color="#64748b" /></button>
              </>
            ) : (
              <>
                <span style={rowPriceStyle}>₦{Number(item.price).toLocaleString()}</span>
                <button type="button" onClick={() => { setEditingId(item.id); setEditPrice(item.price); }} style={iconBtnStyle}><Pencil size={13} color="#64748b" /></button>
                <button type="button" onClick={() => remove(item.id)} style={iconBtnStyle}><Trash2 size={13} color="#f87171" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function TreatmentsTab({ schemaPlanId }: { schemaPlanId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [editFrequency, setEditFrequency] = useState('');
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ name: string; price: string; frequency: string }>();
  const queryKey = ['schema-plan-treatments', schemaPlanId];

  const { data: items = [], isLoading } = useQuery<PricedTreatment[]>({
    queryKey,
    queryFn: () => schemaPlansApi.getTreatments(schemaPlanId).then((res) => res.data.added),
  });

  const onAdd = handleSubmit(async (values) => {
    try {
      await schemaPlansApi.attachTreatment(schemaPlanId, { name: values.name, price: Number(values.price), frequency: Number(values.frequency) });
      qc.invalidateQueries({ queryKey });
      reset();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  });

  const saveEdit = async (id: number) => {
    try {
      await schemaPlansApi.updateTreatment(schemaPlanId, id, { price: Number(editPrice), frequency: Number(editFrequency) });
      qc.invalidateQueries({ queryKey });
      setEditingId(null);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async (id: number) => {
    try {
      await schemaPlansApi.removeTreatment(schemaPlanId, id);
      qc.invalidateQueries({ queryKey });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div>
      <form onSubmit={onAdd} style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
        <input placeholder="Treatment name (e.g. Malaria Treatment)" {...register('name', { required: true })} style={rowInputStyle} />
        <input placeholder="Price" type="number" step="0.01" min="0" {...register('price', { required: true })} style={{ ...rowInputStyle, flex: '0 1 120px' }} />
        <input placeholder="Times/yr" type="number" step="1" min="1" {...register('frequency', { required: true })} style={{ ...rowInputStyle, flex: '0 1 100px' }} />
        <Button type="submit" size="sm" isLoading={isSubmitting}><Plus size={14} /> Add</Button>
      </form>

      {isLoading && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading…</p>}
      {!isLoading && items.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No treatments priced yet for this tier.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <span style={rowLabelStyle}>{item.treatment.treatment_title}</span>
            {editingId === item.id ? (
              <>
                <input type="number" step="0.01" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ ...rowInputStyle, flex: '0 1 110px' }} />
                <input type="number" step="1" min="1" value={editFrequency} onChange={(e) => setEditFrequency(e.target.value)} style={{ ...rowInputStyle, flex: '0 1 90px' }} />
                <button type="button" onClick={() => saveEdit(item.id)} style={iconBtnStyle}><Check size={14} color="#10b981" /></button>
                <button type="button" onClick={() => setEditingId(null)} style={iconBtnStyle}><XIcon size={14} color="#64748b" /></button>
              </>
            ) : (
              <>
                <span style={{ fontSize: '0.76rem', color: '#64748b' }}>{item.frequency}×/yr</span>
                <span style={rowPriceStyle}>₦{Number(item.price).toLocaleString()}</span>
                <button type="button" onClick={() => { setEditingId(item.id); setEditPrice(item.price); setEditFrequency(String(item.frequency)); }} style={iconBtnStyle}><Pencil size={13} color="#64748b" /></button>
                <button type="button" onClick={() => remove(item.id)} style={iconBtnStyle}><Trash2 size={13} color="#f87171" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function DrugsTab({ schemaPlanId }: { schemaPlanId: number }) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const { register, handleSubmit, reset, formState: { isSubmitting } } = useForm<{ name: string; price: string; dosage_form: string; unit: string }>();
  const queryKey = ['schema-plan-drugs', schemaPlanId];

  const { data: items = [], isLoading } = useQuery<PricedDrug[]>({
    queryKey,
    queryFn: () => schemaPlansApi.getDrugs(schemaPlanId).then((res) => res.data.added),
  });

  const onAdd = handleSubmit(async (values) => {
    try {
      await schemaPlansApi.attachDrug(schemaPlanId, {
        name: values.name,
        price: Number(values.price),
        dosage_form: values.dosage_form || undefined,
        unit: values.unit || undefined,
      });
      qc.invalidateQueries({ queryKey });
      reset();
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  });

  const saveEdit = async (id: number) => {
    try {
      await schemaPlansApi.updateDrug(schemaPlanId, id, Number(editPrice));
      qc.invalidateQueries({ queryKey });
      setEditingId(null);
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  const remove = async (id: number) => {
    try {
      await schemaPlansApi.removeDrug(schemaPlanId, id);
      qc.invalidateQueries({ queryKey });
    } catch (err) {
      toast(errorMessage(err), 'error');
    }
  };

  return (
    <div>
      <form onSubmit={onAdd} style={{ display: 'flex', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
        <input placeholder="Drug name (e.g. Paracetamol)" {...register('name', { required: true })} style={rowInputStyle} />
        <input placeholder="Dosage form (optional)" {...register('dosage_form')} style={{ ...rowInputStyle, flex: '0 1 150px' }} />
        <input placeholder="Unit (optional)" {...register('unit')} style={{ ...rowInputStyle, flex: '0 1 120px' }} />
        <input placeholder="Price" type="number" step="0.01" min="0" {...register('price', { required: true })} style={{ ...rowInputStyle, flex: '0 1 120px' }} />
        <Button type="submit" size="sm" isLoading={isSubmitting}><Plus size={14} /> Add</Button>
      </form>
      <p style={{ margin: '0 0 16px', color: '#64748b', fontSize: '0.75rem' }}>Dosage form and unit only apply the first time a drug name is added.</p>

      {isLoading && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Loading…</p>}
      {!isLoading && items.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No drugs priced yet for this tier.</p>}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {items.map((item) => (
          <div key={item.id} style={rowStyle}>
            <span style={rowLabelStyle}>
              {item.drug.name}
              {(item.drug.dosage_form || item.drug.unit) && (
                <span style={{ color: '#64748b', fontWeight: 400 }}> · {[item.drug.dosage_form, item.drug.unit].filter(Boolean).join(' ')}</span>
              )}
            </span>
            {editingId === item.id ? (
              <>
                <input type="number" step="0.01" min="0" value={editPrice} onChange={(e) => setEditPrice(e.target.value)} style={{ ...rowInputStyle, flex: '0 1 120px' }} />
                <button type="button" onClick={() => saveEdit(item.id)} style={iconBtnStyle}><Check size={14} color="#10b981" /></button>
                <button type="button" onClick={() => setEditingId(null)} style={iconBtnStyle}><XIcon size={14} color="#64748b" /></button>
              </>
            ) : (
              <>
                <span style={rowPriceStyle}>₦{Number(item.price).toLocaleString()}</span>
                <button type="button" onClick={() => { setEditingId(item.id); setEditPrice(item.price); }} style={iconBtnStyle}><Pencil size={13} color="#64748b" /></button>
                <button type="button" onClick={() => remove(item.id)} style={iconBtnStyle}><Trash2 size={13} color="#f87171" /></button>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
