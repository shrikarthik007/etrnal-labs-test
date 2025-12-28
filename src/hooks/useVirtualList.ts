'use client';

import { useVirtualizer } from '@tanstack/react-virtual';
import * as React from 'react';

interface UseVirtualListOptions {
    count: number;
    estimateSize: number;
    overscan?: number;
}

/**
 * Custom hook wrapping @tanstack/react-virtual for token list virtualization.
 * Renders only visible items plus overscan for smooth scrolling.
 */
export function useVirtualList({
    count,
    estimateSize,
    overscan = 5,
}: UseVirtualListOptions) {
    const parentRef = React.useRef<HTMLDivElement>(null);

    const virtualizer = useVirtualizer({
        count,
        getScrollElement: () => parentRef.current,
        estimateSize: () => estimateSize,
        overscan,
    });

    return {
        parentRef,
        virtualizer,
        virtualItems: virtualizer.getVirtualItems(),
        totalSize: virtualizer.getTotalSize(),
    };
}
