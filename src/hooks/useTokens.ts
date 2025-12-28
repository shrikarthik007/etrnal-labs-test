import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setTokens,
    setLoading,
    setCategoryLoading,
    batchUpdatePrices,
    setConnectionStatus,
} from '@/store/slices/tokensSlice';
import {
    tokenQueryKeys,
    fetchTokensByCategory,
    fetchAllTokens,
} from '@/lib/api';
import { generateProgressiveTokens, webSocketMock } from '@/lib/websocket-mock';
import type { Token, TokenCategory } from '@/types';

/**
 * Hook to fetch tokens for a specific category using React Query
 */
export function useTokensQuery(category: TokenCategory) {
    const dispatch = useAppDispatch();

    return useQuery({
        queryKey: tokenQueryKeys.byCategory(category),
        queryFn: () => fetchTokensByCategory(category),
        staleTime: 1000 * 60 * 5, // 5 minutes
        gcTime: 1000 * 60 * 30, // 30 minutes
        retry: 3,
        retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
        // Sync with Redux on success
        meta: {
            onSuccess: (data: Token[]) => {
                dispatch(setTokens({ category, tokens: data }));
                dispatch(setCategoryLoading({ category, loading: false }));
            },
        },
    });
}

/**
 * Hook to fetch all tokens across all categories
 */
export function useAllTokensQuery() {
    const dispatch = useAppDispatch();

    return useQuery({
        queryKey: tokenQueryKeys.all,
        queryFn: () => fetchAllTokens(),
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 30,
        retry: 3,
    });
}

/**
 * Custom hook for progressive token loading with WebSocket integration
 * This combines React Query's caching with progressive loading for smooth UX
 */
export function useProgressiveTokens(countPerCategory: number = 12) {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();
    const allTokensRef = useRef<Token[]>([]);

    const { connectionStatus, lastConnectionTime } = useAppSelector(
        (state) => state.tokens
    );

    // Initialize progressive loading
    useEffect(() => {
        dispatch(setLoading(true));
        dispatch(setConnectionStatus('connecting'));

        const startDelay = setTimeout(() => {
            const cleanup = generateProgressiveTokens(
                countPerCategory,
                (category: TokenCategory, tokens: Token[], isComplete: boolean) => {
                    // Update Redux state
                    dispatch(setTokens({ category, tokens }));

                    // Also update React Query cache for consistency
                    queryClient.setQueryData(
                        tokenQueryKeys.byCategory(category),
                        tokens
                    );

                    if (isComplete) {
                        dispatch(setCategoryLoading({ category, loading: false }));

                        // Track all tokens for WebSocket mock
                        allTokensRef.current = [
                            ...allTokensRef.current.filter(t => t.category !== category),
                            ...tokens,
                        ];

                        // Start WebSocket mock once all categories are loaded
                        if (allTokensRef.current.length >= countPerCategory * 3) {
                            dispatch(setConnectionStatus('connected'));
                            webSocketMock.start(allTokensRef.current);

                            // Update the "all" query cache
                            queryClient.setQueryData(tokenQueryKeys.all, {
                                newPairs: allTokensRef.current.filter(t => t.category === 'new-pairs'),
                                finalStretch: allTokensRef.current.filter(t => t.category === 'final-stretch'),
                                migrated: allTokensRef.current.filter(t => t.category === 'migrated'),
                            });
                        }
                    }
                },
                4, // batch size
                120 // delay between batches
            );

            return cleanup;
        }, 200);

        return () => {
            clearTimeout(startDelay);
            webSocketMock.stop();
        };
    }, [dispatch, queryClient, countPerCategory]);

    // Subscribe to WebSocket price updates
    useEffect(() => {
        const unsubscribe = webSocketMock.subscribe((updates) => {
            // Update Redux state
            dispatch(batchUpdatePrices(updates));

            // Also update React Query cache for each affected token
            updates.forEach((update) => {
                // Find which category this token belongs to
                const token = allTokensRef.current.find(t => t.id === update.tokenId);
                if (token) {
                    // Get current cache and update it
                    const cachedTokens = queryClient.getQueryData<Token[]>(
                        tokenQueryKeys.byCategory(token.category)
                    );

                    if (cachedTokens) {
                        const updatedTokens = cachedTokens.map(t =>
                            t.id === update.tokenId
                                ? { ...t, price: update.price, priceChange1m: update.priceChange1m, priceChange5m: update.priceChange5m }
                                : t
                        );
                        queryClient.setQueryData(
                            tokenQueryKeys.byCategory(token.category),
                            updatedTokens
                        );
                    }
                }
            });
        });

        return unsubscribe;
    }, [dispatch, queryClient]);

    return {
        connectionStatus,
        lastConnectionTime,
    };
}

/**
 * Hook to invalidate token caches
 */
export function useInvalidateTokens() {
    const queryClient = useQueryClient();

    const invalidateAll = useCallback(() => {
        queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
    }, [queryClient]);

    const invalidateCategory = useCallback((category: TokenCategory) => {
        queryClient.invalidateQueries({ queryKey: tokenQueryKeys.byCategory(category) });
    }, [queryClient]);

    return { invalidateAll, invalidateCategory };
}

/**
 * Hook to prefetch tokens for a category
 */
export function usePrefetchTokens() {
    const queryClient = useQueryClient();

    return useCallback((category: TokenCategory) => {
        queryClient.prefetchQuery({
            queryKey: tokenQueryKeys.byCategory(category),
            queryFn: () => fetchTokensByCategory(category),
            staleTime: 1000 * 60 * 5,
        });
    }, [queryClient]);
}
