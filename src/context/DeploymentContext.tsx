'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { deploymentApi, readActivationContext, type ApiFailure, type PublicDeploymentBootstrap } from '@/api/deployment';

type DeploymentState = 'loading' | 'ready' | 'needs_activation' | 'unavailable';

interface DeploymentContextValue {
  state: DeploymentState;
  data: PublicDeploymentBootstrap | null;
  errorCode: string | null;
  refresh: () => Promise<void>;
}

const DeploymentContext = createContext<DeploymentContextValue>({
  state: 'loading',
  data: null,
  errorCode: null,
  refresh: async () => {},
});

function isSharedHost(): boolean {
  if (typeof window === 'undefined') return false;
  const hostname = window.location.hostname.toLowerCase();
  const configuredSharedHost = process.env.NEXT_PUBLIC_SHARED_APP_HOST?.toLowerCase() || 'med-max-hmo.vercel.app';
  return hostname === configuredSharedHost || hostname === 'localhost' || hostname === '127.0.0.1';
}

export function DeploymentProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<DeploymentState>('loading');
  const [data, setData] = useState<PublicDeploymentBootstrap | null>(null);
  const [errorCode, setErrorCode] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const activationContext = readActivationContext();
    if (isSharedHost() && !activationContext) {
      setData(null);
      setErrorCode(null);
      setState('needs_activation');
      return;
    }

    setState('loading');
    setErrorCode(null);
    try {
      const response = await deploymentApi.getBootstrap();
      setData(response.data);
      setState('ready');
    } catch (error) {
      const failure = error as { response?: { data?: ApiFailure } };
      setData(null);
      setErrorCode(failure.response?.data?.code ?? 'DEPLOYMENT_UNAVAILABLE');
      setState('unavailable');
    }
  }, []);

  useEffect(() => {
    void Promise.resolve().then(refresh);
  }, [refresh]);

  useEffect(() => {
    if (!data || typeof document === 'undefined') return;
    document.title = `${data.organization.short_name || data.organization.name} | MEDiX`;
    if (data.organization.favicon_url) {
      let favicon = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
      if (!favicon) {
        favicon = document.createElement('link');
        favicon.rel = 'icon';
        document.head.appendChild(favicon);
      }
      favicon.href = data.organization.favicon_url;
    }
    const primaryColor = data.organization.colors[0];
    if (primaryColor && /^#[0-9a-f]{3,8}$/i.test(primaryColor)) {
      document.documentElement.style.setProperty('--accent', primaryColor);
    }
  }, [data]);

  return (
    <DeploymentContext.Provider value={{ state, data, errorCode, refresh }}>
      {children}
    </DeploymentContext.Provider>
  );
}

export function useDeployment() {
  return useContext(DeploymentContext);
}
