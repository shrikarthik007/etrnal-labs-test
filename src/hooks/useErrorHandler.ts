import { useCallback, useEffect, useRef, useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { setConnectionStatus, setError } from '@/store/slices/tokensSlice';
import type { ConnectionStatus } from '@/types';

interface ErrorNotification {
    id: string;
    message: string;
    type: 'error' | 'warning' | 'info';
    timestamp: number;
}

interface UseErrorHandlerOptions {
    maxRetries?: number;
    baseDelay?: number;
    maxDelay?: number;
    onError?: (error: Error) => void;
    onRetry?: (attemptNumber: number) => void;
    onMaxRetriesReached?: () => void;
}

/**
 * Custom hook for handling errors with retry logic and exponential backoff
 */
export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
    const {
        maxRetries = 3,
        baseDelay = 1000,
        maxDelay = 30000,
        onError,
        onRetry,
        onMaxRetriesReached,
    } = options;

    const dispatch = useAppDispatch();
    const { error: reduxError, connectionStatus } = useAppSelector((state) => state.tokens);

    const [notifications, setNotifications] = useState<ErrorNotification[]>([]);
    const [retryCount, setRetryCount] = useState(0);
    const [isRetrying, setIsRetrying] = useState(false);
    const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    /**
     * Calculate delay with exponential backoff
     */
    const calculateDelay = useCallback((attempt: number) => {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), maxDelay);
        // Add jitter to prevent thundering herd
        const jitter = delay * 0.1 * Math.random();
        return delay + jitter;
    }, [baseDelay, maxDelay]);

    /**
     * Add an error notification
     */
    const addNotification = useCallback((
        message: string,
        type: 'error' | 'warning' | 'info' = 'error'
    ) => {
        const notification: ErrorNotification = {
            id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            message,
            type,
            timestamp: Date.now(),
        };

        setNotifications((prev) => [...prev.slice(-4), notification]); // Keep max 5 notifications

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            dismissNotification(notification.id);
        }, 5000);

        return notification.id;
    }, []);

    /**
     * Dismiss a notification
     */
    const dismissNotification = useCallback((id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, []);

    /**
     * Clear all notifications
     */
    const clearNotifications = useCallback(() => {
        setNotifications([]);
    }, []);

    /**
     * Handle an error with optional retry
     */
    const handleError = useCallback((
        error: Error,
        shouldRetry: boolean = true,
        retryFn?: () => Promise<void>
    ) => {
        // Dispatch to Redux
        dispatch(setError(error.message));

        // Call custom error handler
        onError?.(error);

        // Add notification
        addNotification(error.message, 'error');

        // Attempt retry if enabled
        if (shouldRetry && retryFn && retryCount < maxRetries) {
            const delay = calculateDelay(retryCount);
            setIsRetrying(true);

            retryTimeoutRef.current = setTimeout(async () => {
                setRetryCount((prev) => prev + 1);
                onRetry?.(retryCount + 1);

                try {
                    await retryFn();
                    // Success - reset retry count
                    setRetryCount(0);
                    setIsRetrying(false);
                    dispatch(setError(null));
                    addNotification('Connection restored', 'info');
                } catch (retryError) {
                    if (retryCount + 1 >= maxRetries) {
                        setIsRetrying(false);
                        onMaxRetriesReached?.();
                        addNotification('Maximum retries reached. Please refresh the page.', 'error');
                    } else {
                        // Recurse to try again
                        handleError(retryError as Error, true, retryFn);
                    }
                }
            }, delay);
        } else if (retryCount >= maxRetries) {
            onMaxRetriesReached?.();
        }
    }, [
        dispatch,
        retryCount,
        maxRetries,
        calculateDelay,
        addNotification,
        onError,
        onRetry,
        onMaxRetriesReached,
    ]);

    /**
     * Reset error state and retry count
     */
    const resetError = useCallback(() => {
        dispatch(setError(null));
        setRetryCount(0);
        setIsRetrying(false);
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    }, [dispatch]);

    /**
     * Handle connection status changes
     */
    const handleConnectionChange = useCallback((status: ConnectionStatus) => {
        dispatch(setConnectionStatus(status));

        if (status === 'error' || status === 'disconnected') {
            addNotification(
                status === 'error'
                    ? 'Connection error. Attempting to reconnect...'
                    : 'Disconnected from server',
                status === 'error' ? 'error' : 'warning'
            );
        } else if (status === 'connected') {
            clearNotifications();
        }
    }, [dispatch, addNotification, clearNotifications]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (retryTimeoutRef.current) {
                clearTimeout(retryTimeoutRef.current);
            }
        };
    }, []);

    return {
        // State
        error: reduxError,
        connectionStatus,
        notifications,
        retryCount,
        isRetrying,

        // Actions
        handleError,
        resetError,
        handleConnectionChange,
        addNotification,
        dismissNotification,
        clearNotifications,
    };
}

/**
 * Hook for connection recovery with automatic reconnection
 */
export function useConnectionRecovery(
    connectFn: () => Promise<void>,
    options: {
        maxRetries?: number;
        checkInterval?: number;
        onReconnect?: () => void;
    } = {}
) {
    const {
        maxRetries = 5,
        checkInterval = 5000,
        onReconnect,
    } = options;

    const { connectionStatus } = useAppSelector((state) => state.tokens);
    const dispatch = useAppDispatch();
    const [retryAttempt, setRetryAttempt] = useState(0);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (connectionStatus === 'disconnected' || connectionStatus === 'error') {
            // Start recovery attempt
            intervalRef.current = setInterval(async () => {
                if (retryAttempt >= maxRetries) {
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                    return;
                }

                dispatch(setConnectionStatus('connecting'));

                try {
                    await connectFn();
                    dispatch(setConnectionStatus('connected'));
                    setRetryAttempt(0);
                    onReconnect?.();
                    if (intervalRef.current) {
                        clearInterval(intervalRef.current);
                    }
                } catch {
                    setRetryAttempt((prev) => prev + 1);
                    dispatch(setConnectionStatus('error'));
                }
            }, checkInterval);
        }

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
            }
        };
    }, [connectionStatus, connectFn, maxRetries, checkInterval, onReconnect, retryAttempt, dispatch]);

    return {
        retryAttempt,
        isRecovering: connectionStatus === 'connecting',
        hasExhaustedRetries: retryAttempt >= maxRetries,
    };
}
