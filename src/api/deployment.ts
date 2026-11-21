import apiClient from './apiClient';

export interface PublicDeploymentBootstrap {
  deployment: {
    uuid: string;
    status: 'active' | 'suspended' | 'expired' | string;
    trial?: {
      edition: 'trial' | 'licensed' | string;
      expires_at: string | null;
    } | null;
  };
  organization: {
    name: string;
    short_name: string | null;
    logo_url: string | null;
    favicon_url: string | null;
    colors: string[];
    address: string | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    support_contact: string | null;
    tagline: string | null;
    deployment_status: string;
  };
}

export interface ApiFailure {
  code?: string;
  message?: string;
}

export const ACTIVATION_CONTEXT_KEY = 'medix_activation_context';

export function readActivationContext(): string | null {
  if (typeof window === 'undefined') return null;
  return window.sessionStorage.getItem(ACTIVATION_CONTEXT_KEY);
}

export function storeActivationContext(context: string): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(ACTIVATION_CONTEXT_KEY, context);
}

export function clearActivationContext(): void {
  if (typeof window === 'undefined') return;
  window.sessionStorage.removeItem(ACTIVATION_CONTEXT_KEY);
}

export const deploymentApi = {
  getBootstrap: () => apiClient.get<PublicDeploymentBootstrap>('/client/bootstrap'),
};
