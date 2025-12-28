'use client';

import * as React from 'react';
import { Activity, Clock, Database, ExternalLink, Github } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from '@/components/ui/tooltip';

interface FooterProps {
    connectionStatus?: 'connected' | 'connecting' | 'disconnected' | 'error';
    lastConnectionTime?: number | null;
    totalTokens?: number;
    className?: string;
}

/**
 * Footer/status bar component with connection status, stats, and quick links.
 * Provides real-time connection info and app metadata.
 */
export const Footer = React.memo<FooterProps>(({
    connectionStatus = 'connected',
    lastConnectionTime,
    totalTokens = 0,
    className,
}) => {
    const [currentTime, setCurrentTime] = React.useState<string>('');

    // Update time every second
    React.useEffect(() => {
        const updateTime = () => {
            setCurrentTime(new Date().toLocaleTimeString());
        };
        updateTime();
        const interval = setInterval(updateTime, 1000);
        return () => clearInterval(interval);
    }, []);

    const lastUpdate = lastConnectionTime
        ? new Date(lastConnectionTime).toLocaleTimeString()
        : currentTime;

    return (
        <footer
            className={cn(
                'flex items-center justify-between px-4 py-1.5',
                'border-t border-border/50 bg-card/80 backdrop-blur-sm',
                'text-xs text-muted-foreground',
                className
            )}
        >
            {/* Left Section: Connection Status */}
            <div className="flex items-center gap-4">
                {/* Connection Indicator */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-default">
                            <span
                                className={cn(
                                    'h-2 w-2 rounded-full transition-colors',
                                    connectionStatus === 'connected'
                                        ? 'bg-success shadow-[0_0_6px_rgba(34,197,94,0.5)] animate-pulse'
                                        : connectionStatus === 'connecting'
                                            ? 'bg-warning animate-pulse'
                                            : connectionStatus === 'error'
                                                ? 'bg-destructive'
                                                : 'bg-muted-foreground'
                                )}
                            />
                            <span className="capitalize">{connectionStatus}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">
                        {connectionStatus === 'connected'
                            ? 'WebSocket connection active'
                            : connectionStatus === 'connecting'
                                ? 'Establishing connection...'
                                : 'Connection lost'}
                    </TooltipContent>
                </Tooltip>

                {/* Last Update */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-default">
                            <Clock className="h-3 w-3" />
                            <span>{lastUpdate}</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Last updated</TooltipContent>
                </Tooltip>

                {/* Total Tokens */}
                <Tooltip>
                    <TooltipTrigger asChild>
                        <div className="flex items-center gap-1.5 cursor-default">
                            <Database className="h-3 w-3" />
                            <span>{totalTokens} tokens</span>
                        </div>
                    </TooltipTrigger>
                    <TooltipContent side="top">Total tokens loaded</TooltipContent>
                </Tooltip>
            </div>

            {/* Center: Branding (hidden on mobile) */}
            <div className="hidden md:flex items-center gap-1.5">
                <Activity className="h-3 w-3 text-primary" />
                <span className="text-muted-foreground/80">Axiom Trade Clone</span>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-muted-foreground/50">v1.0.0</span>
            </div>

            {/* Right Section: Links */}
            <div className="flex items-center gap-3">
                <Tooltip>
                    <TooltipTrigger asChild>
                        <a
                            href="https://github.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                        >
                            <Github className="h-3 w-3" />
                            <span className="hidden sm:inline">GitHub</span>
                        </a>
                    </TooltipTrigger>
                    <TooltipContent side="top">View source code</TooltipContent>
                </Tooltip>

                <Tooltip>
                    <TooltipTrigger asChild>
                        <a
                            href="https://axiom.trade"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                        >
                            <ExternalLink className="h-3 w-3" />
                            <span className="hidden sm:inline">Original</span>
                        </a>
                    </TooltipTrigger>
                    <TooltipContent side="top">View original Axiom Trade</TooltipContent>
                </Tooltip>
            </div>
        </footer>
    );
});

Footer.displayName = 'Footer';
