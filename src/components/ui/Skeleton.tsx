import React from 'react';

interface SkeletonProps {
    width?: string | number;
    height?: string | number;
    className?: string;
    style?: React.CSSProperties;
    rounded?: boolean;
}

/**
 * Generic shimmer placeholder. Uses the `.skeleton` shimmer animation already
 * defined in globals.css so it matches the rest of the app's loading states.
 */
export const Skeleton = ({ width = '100%', height = '1rem', className = '', style, rounded }: SkeletonProps) => (
    <div
        className={`skeleton ${className}`}
        style={{
            width,
            height,
            borderRadius: rounded ? '9999px' : undefined,
            ...style,
        }}
    />
);

/** A row of skeleton table cells, for use inside a <tr> while data loads. */
export const SkeletonTableRow = ({ columns = 5 }: { columns?: number }) => (
    <tr>
        {Array.from({ length: columns }).map((_, i) => (
            <td key={i}><Skeleton height="0.9rem" /></td>
        ))}
    </tr>
);

/** A skeleton stat card matching StatCard's footprint, for dashboard loading states. */
export const SkeletonStatCard = () => (
    <div
        className="glass-card"
        style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}
    >
        <Skeleton width={38} height={38} style={{ borderRadius: '12px' }} />
        <Skeleton width="60%" height="0.7rem" />
        <Skeleton width="45%" height="1.5rem" />
    </div>
);
