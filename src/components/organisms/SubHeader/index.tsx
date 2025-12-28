'use client';

import * as React from 'react';
import {
    LayoutGrid,
    LayoutList,
    TableProperties,
    Filter,
    ChevronDown,
    TrendingUp,
    Sparkles,
    ArrowUpCircle,
    Check,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';

interface SubHeaderProps {
    className?: string;
}

type DisplayMode = 'table' | 'grid' | 'compact';
type ChainFilter = 'all' | 'solana' | 'bnb';
type QuickFilter = 'trending' | 'new' | 'migrated' | null;

const displayModes: { id: DisplayMode; label: string; icon: React.ElementType }[] = [
    { id: 'table', label: 'Table', icon: TableProperties },
    { id: 'grid', label: 'Grid', icon: LayoutGrid },
    { id: 'compact', label: 'Compact', icon: LayoutList },
];

const chainFilters: { id: ChainFilter; label: string; color?: string }[] = [
    { id: 'all', label: 'All Chains' },
    { id: 'solana', label: 'Solana', color: 'var(--solana)' },
    { id: 'bnb', label: 'BNB', color: 'var(--bnb)' },
];

const quickFilters: { id: QuickFilter; label: string; icon: React.ElementType }[] = [
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'new', label: 'New', icon: Sparkles },
    { id: 'migrated', label: 'Migrated', icon: ArrowUpCircle },
];

/**
 * SubHeader component with display mode, chain filter, and quick filters.
 * Provides secondary navigation and filtering options.
 */
export const SubHeader = React.memo<SubHeaderProps>(({ className }) => {
    const [displayMode, setDisplayMode] = React.useState<DisplayMode>('table');
    const [chainFilter, setChainFilter] = React.useState<ChainFilter>('all');
    const [activeQuickFilter, setActiveQuickFilter] = React.useState<QuickFilter>(null);

    const currentDisplay = displayModes.find((m) => m.id === displayMode)!;
    const CurrentDisplayIcon = currentDisplay.icon;

    const currentChain = chainFilters.find((c) => c.id === chainFilter)!;

    const toggleQuickFilter = (filter: QuickFilter) => {
        setActiveQuickFilter((prev) => (prev === filter ? null : filter));
    };

    return (
        <div
            className={cn(
                'flex items-center justify-between px-4 py-2',
                'border-b border-border/30 bg-background/50',
                className
            )}
        >
            {/* Left Section: Display Mode + Chain Filter */}
            <div className="flex items-center gap-3">
                {/* Display Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors',
                                'text-xs font-medium',
                                'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            <CurrentDisplayIcon className="h-3.5 w-3.5" />
                            <span>{currentDisplay.label}</span>
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-32">
                        {displayModes.map((mode) => {
                            const Icon = mode.icon;
                            return (
                                <DropdownMenuItem
                                    key={mode.id}
                                    onClick={() => setDisplayMode(mode.id)}
                                    className="flex items-center justify-between text-xs"
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className="h-3.5 w-3.5" />
                                        <span>{mode.label}</span>
                                    </div>
                                    {displayMode === mode.id && (
                                        <Check className="h-3 w-3 text-primary" />
                                    )}
                                </DropdownMenuItem>
                            );
                        })}
                    </DropdownMenuContent>
                </DropdownMenu>

                {/* Divider */}
                <div className="h-4 w-px bg-border/50" />

                {/* Chain Filter Dropdown */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button
                            className={cn(
                                'flex items-center gap-2 px-2.5 py-1.5 rounded-lg transition-colors',
                                'text-xs font-medium',
                                'bg-muted/50 text-muted-foreground hover:text-foreground hover:bg-muted'
                            )}
                        >
                            {currentChain.color && (
                                <span
                                    className="h-2 w-2 rounded-full"
                                    style={{ backgroundColor: currentChain.color }}
                                />
                            )}
                            <span>{currentChain.label}</span>
                            <ChevronDown className="h-3 w-3" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="w-32">
                        {chainFilters.map((chain) => (
                            <DropdownMenuItem
                                key={chain.id}
                                onClick={() => setChainFilter(chain.id)}
                                className="flex items-center justify-between text-xs"
                            >
                                <div className="flex items-center gap-2">
                                    {chain.color && (
                                        <span
                                            className="h-2 w-2 rounded-full"
                                            style={{ backgroundColor: chain.color }}
                                        />
                                    )}
                                    <span>{chain.label}</span>
                                </div>
                                {chainFilter === chain.id && (
                                    <Check className="h-3 w-3 text-primary" />
                                )}
                            </DropdownMenuItem>
                        ))}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Right Section: Quick Filters */}
            <div className="flex items-center gap-2">
                {/* Quick Filter Buttons */}
                <div className="hidden sm:flex items-center gap-1">
                    {quickFilters.map((filter) => {
                        const Icon = filter.icon;
                        const isActive = activeQuickFilter === filter.id;
                        return (
                            <button
                                key={filter.id}
                                onClick={() => toggleQuickFilter(filter.id)}
                                className={cn(
                                    'flex items-center gap-1.5 px-2.5 py-1 rounded-lg transition-all',
                                    'text-xs font-medium',
                                    isActive
                                        ? 'bg-primary/15 text-primary border border-primary/30'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                            >
                                <Icon className="h-3 w-3" />
                                <span>{filter.label}</span>
                            </button>
                        );
                    })}
                </div>

                {/* Mobile Filter Button */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className={cn(
                                'sm:hidden p-2 rounded-lg transition-colors',
                                'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            <Filter className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Filters</TooltipContent>
                </Tooltip>
            </div>
        </div>
    );
});

SubHeader.displayName = 'SubHeader';
