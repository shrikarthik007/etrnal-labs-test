'use client';

import * as React from 'react';
import {
    Search,
    Bell,
    Settings,
    Wallet,
    Command,
    Activity,
    BarChart3,
    Eye,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface HeaderProps {
    className?: string;
}

type NavItem = {
    id: string;
    label: string;
    icon: React.ElementType;
    active?: boolean;
};

const navItems: NavItem[] = [
    { id: 'pulse', label: 'Pulse', icon: Activity, active: true },
    { id: 'discover', label: 'Discover', icon: Sparkles },
    { id: 'portfolio', label: 'Portfolio', icon: BarChart3 },
    { id: 'watchlist', label: 'Watchlist', icon: Eye },
];

/**
 * Main header component with navigation, search, and user actions.
 * Matches the Axiom Trade header design with dark theme styling.
 */
export const Header = React.memo<HeaderProps>(({ className }) => {
    const [activeNav, setActiveNav] = React.useState('pulse');

    return (
        <header
            className={cn(
                'flex items-center justify-between px-4 py-2.5',
                'border-b border-border/50 bg-card/80 backdrop-blur-sm',
                'sticky top-0 z-50',
                className
            )}
        >
            {/* Left Section: Logo + Navigation */}
            <div className="flex items-center gap-6">
                {/* Logo */}
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-success flex items-center justify-center">
                        <span className="text-white font-bold text-sm">A</span>
                    </div>
                    <span className="text-lg font-bold gradient-text hidden sm:block">
                        Axiom
                    </span>
                </div>

                {/* Navigation Tabs */}
                <nav className="hidden md:flex items-center gap-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = activeNav === item.id;
                        return (
                            <button
                                key={item.id}
                                onClick={() => setActiveNav(item.id)}
                                className={cn(
                                    'flex items-center gap-2 px-3 py-1.5 rounded-lg transition-all',
                                    'text-sm font-medium',
                                    isActive
                                        ? 'bg-primary/15 text-primary'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                                )}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{item.label}</span>
                            </button>
                        );
                    })}
                </nav>
            </div>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-md mx-4 hidden lg:block">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <input
                        type="text"
                        placeholder="Search tokens..."
                        className={cn(
                            'w-full pl-10 pr-12 py-2 rounded-lg',
                            'bg-muted/50 border border-border/50',
                            'text-sm text-foreground placeholder:text-muted-foreground',
                            'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50',
                            'transition-all'
                        )}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-0.5 text-muted-foreground">
                        <kbd className="flex items-center justify-center h-5 px-1.5 rounded bg-muted text-[10px] font-medium border border-border/50">
                            <Command className="h-3 w-3" />
                        </kbd>
                        <kbd className="flex items-center justify-center h-5 px-1.5 rounded bg-muted text-[10px] font-medium border border-border/50">
                            K
                        </kbd>
                    </div>
                </div>
            </div>

            {/* Right Section: Actions */}
            <div className="flex items-center gap-2">
                {/* Mobile Search */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className={cn(
                                'lg:hidden p-2 rounded-lg transition-colors',
                                'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            <Search className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Search</TooltipContent>
                </Tooltip>

                {/* Notifications */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className={cn(
                                'relative p-2 rounded-lg transition-colors',
                                'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            <Bell className="h-4 w-4" />
                            {/* Notification Dot */}
                            <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-destructive" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Notifications</TooltipContent>
                </Tooltip>

                {/* Settings */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <button
                            className={cn(
                                'p-2 rounded-lg transition-colors',
                                'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                            )}
                        >
                            <Settings className="h-4 w-4" />
                        </button>
                    </TooltipTrigger>
                    <TooltipContent>Settings</TooltipContent>
                </Tooltip>

                {/* Divider */}
                <div className="h-6 w-px bg-border/50 mx-1" />

                {/* Wallet Connect */}
                <button
                    className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-lg',
                        'bg-primary text-primary-foreground',
                        'text-sm font-medium',
                        'hover:bg-primary-hover transition-colors',
                        'shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    )}
                >
                    <Wallet className="h-4 w-4" />
                    <span className="hidden sm:block">Connect</span>
                </button>
            </div>
        </header>
    );
});

Header.displayName = 'Header';
