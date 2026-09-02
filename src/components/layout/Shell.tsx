'use client';

import React from 'react';
import { MenuProvider } from './MenuContext';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const Shell = ({ children }: { children: React.ReactNode }) => {
    return (
        <MenuProvider>
            <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--background)' }}>
                <Sidebar />
                <main style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: '100dvh',
                    minWidth: 0,
                    overflowX: 'hidden',
                }}>
                    <div style={{
                        flex: 1,
                        width: '100%',
                        maxWidth: '1280px',
                        margin: '0 auto',
                        padding: 'clamp(20px, 3vw, 40px)',
                        paddingBottom: '96px',
                    }}>
                        {children}
                    </div>
                    <BottomNav />
                </main>
            </div>
        </MenuProvider>
    );
};
