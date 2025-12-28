'use client';

import * as React from 'react';
import { PulseGrid, TokenDetailModal } from '@/components/organisms';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedToken } from '@/store/slices/tokensSlice';
import {
  useProgressiveTokens,
  useErrorHandler,
} from '@/hooks';
import type { Token } from '@/types';

export default function Home() {
  const dispatch = useAppDispatch();
  const { selectedToken } = useAppSelector((state) => state.tokens);
  const [isClient, setIsClient] = React.useState(false);

  // Use the new progressive tokens hook with React Query integration
  const { connectionStatus, lastConnectionTime } = useProgressiveTokens(12);

  // Error handling with notifications
  const { notifications, dismissNotification } = useErrorHandler({
    maxRetries: 3,
    onMaxRetriesReached: () => {
      console.warn('Maximum retry attempts reached');
    },
  });

  // Set client flag for hydration
  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Handle token click - open modal
  const handleTokenClick = React.useCallback((token: Token) => {
    dispatch(setSelectedToken(token));
  }, [dispatch]);

  // Handle modal close
  const handleModalClose = React.useCallback((open: boolean) => {
    if (!open) {
      dispatch(setSelectedToken(null));
    }
  }, [dispatch]);

  // Prevent hydration mismatch
  if (!isClient) {
    return (
      <div className="h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/50">
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold text-foreground">Pulse</h1>
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-background/50 hover:bg-muted/50 transition-colors cursor-default"
            title={connectionStatus === 'connected'
              ? `Connected${lastConnectionTime ? ` since ${new Date(lastConnectionTime).toLocaleTimeString()}` : ''}`
              : connectionStatus === 'connecting'
                ? 'Establishing connection...'
                : 'Disconnected from server'}
          >
            <span
              className={`h-2 w-2 rounded-full transition-colors ${connectionStatus === 'connected'
                ? 'bg-success shadow-[0_0_6px_rgba(34,197,94,0.5)] animate-pulse'
                : connectionStatus === 'connecting'
                  ? 'bg-warning animate-pulse'
                  : connectionStatus === 'error'
                    ? 'bg-destructive'
                    : 'bg-muted-foreground'
                }`}
            />
            <span className="text-xs text-muted-foreground capitalize">
              {connectionStatus}
            </span>
            {connectionStatus === 'connected' && lastConnectionTime && (
              <span className="text-[10px] text-muted-foreground/60 ml-1">
                • Live
              </span>
            )}
          </div>
        </div>
        <div className="text-xs text-muted-foreground">
          Axiom Trade Clone
        </div>
      </header>

      {/* Error Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`
                px-4 py-3 rounded-lg shadow-lg backdrop-blur-sm
                flex items-center justify-between gap-3
                animate-in slide-in-from-right-5 duration-300
                ${notification.type === 'error'
                  ? 'bg-destructive/90 text-destructive-foreground'
                  : notification.type === 'warning'
                    ? 'bg-warning/90 text-warning-foreground'
                    : 'bg-primary/90 text-primary-foreground'
                }
              `}
            >
              <span className="text-sm">{notification.message}</span>
              <button
                onClick={() => dismissNotification(notification.id)}
                className="text-current hover:opacity-70 transition-opacity"
                aria-label="Dismiss"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Grid */}
      <main className="flex-1 overflow-hidden">
        <PulseGrid onTokenClick={handleTokenClick} />
      </main>

      {/* Token Detail Modal */}
      <TokenDetailModal
        token={selectedToken}
        open={selectedToken !== null}
        onOpenChange={handleModalClose}
      />
    </div>
  );
}
