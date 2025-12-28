'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { PulseGrid, Header, SubHeader, Footer } from '@/components/organisms';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setSelectedToken } from '@/store/slices/tokensSlice';
import {
  useProgressiveTokens,
  useErrorHandler,
} from '@/hooks';
import { selectTotalTokenCount, selectSelectedToken } from '@/store/selectors';
import type { Token } from '@/types';

// Dynamically import TokenDetailModal for code splitting
// This reduces initial bundle size by loading the modal only when needed
const TokenDetailModal = dynamic(
  () => import('@/components/organisms/TokenDetailModal').then(mod => ({ default: mod.TokenDetailModal })),
  {
    ssr: false,
    loading: () => null, // No loading state needed for modal
  }
);

export default function Home() {
  const dispatch = useAppDispatch();
  const selectedToken = useAppSelector(selectSelectedToken);
  const totalTokens = useAppSelector(selectTotalTokenCount);
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
      {/* Main Header with Navigation */}
      <Header />

      {/* Sub Header with Filters */}
      <SubHeader />

      {/* Error Notifications */}
      {notifications.length > 0 && (
        <div className="fixed top-16 right-4 z-50 flex flex-col gap-2 max-w-sm">
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

      {/* Footer with Connection Status */}
      <Footer
        connectionStatus={connectionStatus}
        lastConnectionTime={lastConnectionTime}
        totalTokens={totalTokens}
      />

      {/* Token Detail Modal - Dynamically imported */}
      <TokenDetailModal
        token={selectedToken}
        open={selectedToken !== null}
        onOpenChange={handleModalClose}
      />
    </div>
  );
}
