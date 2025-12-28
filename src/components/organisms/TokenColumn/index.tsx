'use client';

import * as React from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { cn } from '@/lib/utils';
import type { Token, TokenCategory } from '@/types';
import { ColumnHeader } from '../ColumnHeader';
import { TokenRow, TokenRowSkeleton } from '../TokenRow';
import { useSortedTokens } from '@/hooks/useSortedTokens';

interface TokenColumnProps {
    category: TokenCategory;
    title: string;
    tokens: Token[];
    loading?: boolean;
    activityCount?: number;
    onTokenClick?: (token: Token) => void;
    onFilterClick?: () => void;
    className?: string;
}

const CATEGORY_TITLES: Record<TokenCategory, string> = {
    'new-pairs': 'New Pairs',
    'final-stretch': 'Final Stretch',
    'migrated': 'Migrated',
};

// Estimated row height for virtual scrolling
const ROW_HEIGHT = 52;

/**
 * TokenColumn component wraps a category of tokens with header and scrollable list.
 * Each column is independently scrollable matching Axiom's Pulse page behavior.
 * Uses virtual scrolling to render only visible rows for optimal performance.
 */
export const TokenColumn = React.memo<TokenColumnProps>(({
    category,
    title,
    tokens,
    loading = false,
    activityCount = 0,
    onTokenClick,
    onFilterClick,
    className,
}) => {
    const displayTitle = title || CATEGORY_TITLES[category];

    // Use sorted tokens based on Redux sortConfig
    const sortedTokens = useSortedTokens(tokens, category);

    // Virtual scroll container ref
    const parentRef = React.useRef<HTMLDivElement>(null);

    // Virtual scrolling setup
    const virtualizer = useVirtualizer({
        count: sortedTokens.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => ROW_HEIGHT,
        overscan: 5, // Render 5 extra items above/below viewport
    });

    const virtualItems = virtualizer.getVirtualItems();

    return (
        <div
            className={cn(
                'flex flex-col h-full',
                'bg-card border-r border-border/30 last:border-r-0',
                className
            )}
        >
            {/* Sticky Header */}
            <ColumnHeader
                title={displayTitle}
                category={category}
                activityCount={activityCount}
                onFilterClick={onFilterClick}
            />

            {/* Scrollable Token List with Virtual Scrolling */}
            <div
                ref={parentRef}
                className="flex-1 overflow-y-auto"
            >
                {loading ? (
                    // Loading skeletons
                    <div className="animate-fade-in">
                        {Array.from({ length: 8 }).map((_, index) => (
                            <TokenRowSkeleton key={index} />
                        ))}
                    </div>
                ) : sortedTokens.length === 0 ? (
                    // Empty state
                    <div className="flex flex-col items-center justify-center h-32 text-center px-4">
                        <p className="text-sm text-muted-foreground">
                            No tokens found
                        </p>
                        <p className="text-xs text-muted-foreground/70 mt-1">
                            Tokens will appear here when available
                        </p>
                    </div>
                ) : (
                    // Virtualized Token list
                    <div
                        className="relative w-full"
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                        }}
                    >
                        {virtualItems.map((virtualItem) => {
                            const token = sortedTokens[virtualItem.index];
                            return (
                                <div
                                    key={token.id}
                                    className="absolute top-0 left-0 w-full"
                                    style={{
                                        height: `${virtualItem.size}px`,
                                        transform: `translateY(${virtualItem.start}px)`,
                                    }}
                                >
                                    <TokenRow
                                        token={token}
                                        onClick={onTokenClick}
                                    />
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
});

TokenColumn.displayName = 'TokenColumn';
