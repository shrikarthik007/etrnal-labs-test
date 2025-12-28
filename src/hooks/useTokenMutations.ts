import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useAppDispatch } from '@/store/hooks';
import {
    updateTokenPrice,
    addToken,
    removeToken,
} from '@/store/slices/tokensSlice';
import {
    tokenQueryKeys,
    updateTokenPriceApi,
    addTokenApi,
    removeTokenApi,
} from '@/lib/api';
import type { Token, TokenCategory, PriceUpdate } from '@/types';

/**
 * Hook to update a token's price with optimistic updates
 */
export function useUpdateTokenPrice() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ tokenId, newPrice }: { tokenId: string; newPrice: number }) =>
            updateTokenPriceApi(tokenId, newPrice),

        // Optimistic update
        onMutate: async ({ tokenId, newPrice }) => {
            // Cancel any outgoing refetches
            await queryClient.cancelQueries({ queryKey: tokenQueryKeys.all });

            // Snapshot previous values for potential rollback
            const previousTokens: Record<TokenCategory, Token[] | undefined> = {
                'new-pairs': queryClient.getQueryData(tokenQueryKeys.byCategory('new-pairs')),
                'final-stretch': queryClient.getQueryData(tokenQueryKeys.byCategory('final-stretch')),
                'migrated': queryClient.getQueryData(tokenQueryKeys.byCategory('migrated')),
            };

            // Find the token and its category
            let targetCategory: TokenCategory | null = null;
            for (const category of Object.keys(previousTokens) as TokenCategory[]) {
                const tokens = previousTokens[category];
                if (tokens?.find((t) => t.id === tokenId)) {
                    targetCategory = category;
                    break;
                }
            }

            // Optimistically update React Query cache
            if (targetCategory && previousTokens[targetCategory]) {
                queryClient.setQueryData(
                    tokenQueryKeys.byCategory(targetCategory),
                    (old: Token[] | undefined) =>
                        old?.map((token) =>
                            token.id === tokenId
                                ? { ...token, price: newPrice }
                                : token
                        )
                );
            }

            // Optimistically update Redux
            dispatch(
                updateTokenPrice({
                    tokenId,
                    price: newPrice,
                    priceChange1m: 0,
                    priceChange5m: 0,
                    timestamp: Date.now(),
                })
            );

            return { previousTokens, targetCategory };
        },

        // Rollback on error
        onError: (err, { tokenId }, context) => {
            if (context?.previousTokens && context?.targetCategory) {
                const prevTokens = context.previousTokens[context.targetCategory];
                if (prevTokens) {
                    queryClient.setQueryData(
                        tokenQueryKeys.byCategory(context.targetCategory),
                        prevTokens
                    );

                    // Also rollback Redux
                    const originalToken = prevTokens.find(t => t.id === tokenId);
                    if (originalToken) {
                        dispatch(
                            updateTokenPrice({
                                tokenId,
                                price: originalToken.price,
                                priceChange1m: originalToken.priceChange1m,
                                priceChange5m: originalToken.priceChange5m,
                                timestamp: Date.now(),
                            })
                        );
                    }
                }
            }
            console.error('Failed to update token price:', err);
        },

        // Refetch after mutation settles
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: tokenQueryKeys.all });
        },
    });
}

/**
 * Hook to add a new token with optimistic updates
 */
export function useAddToken() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (category: TokenCategory) => addTokenApi(category),

        // Optimistically add a placeholder token
        onMutate: async (category) => {
            await queryClient.cancelQueries({
                queryKey: tokenQueryKeys.byCategory(category),
            });

            const previousTokens = queryClient.getQueryData<Token[]>(
                tokenQueryKeys.byCategory(category)
            );

            return { previousTokens, category };
        },

        // On success, add the real token to cache
        onSuccess: (newToken, category, context) => {
            queryClient.setQueryData(
                tokenQueryKeys.byCategory(category),
                (old: Token[] | undefined) => [newToken, ...(old || [])]
            );

            // Update Redux
            dispatch(addToken({ category, token: newToken }));
        },

        // Rollback on error
        onError: (err, category, context) => {
            if (context?.previousTokens) {
                queryClient.setQueryData(
                    tokenQueryKeys.byCategory(category),
                    context.previousTokens
                );
            }
            console.error('Failed to add token:', err);
        },

        onSettled: (_, __, category) => {
            queryClient.invalidateQueries({
                queryKey: tokenQueryKeys.byCategory(category),
            });
        },
    });
}

/**
 * Hook to remove a token with optimistic updates
 */
export function useRemoveToken() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ tokenId, category }: { tokenId: string; category: TokenCategory }) =>
            removeTokenApi(tokenId),

        onMutate: async ({ tokenId, category }) => {
            await queryClient.cancelQueries({
                queryKey: tokenQueryKeys.byCategory(category),
            });

            const previousTokens = queryClient.getQueryData<Token[]>(
                tokenQueryKeys.byCategory(category)
            );

            // Optimistically remove from cache
            queryClient.setQueryData(
                tokenQueryKeys.byCategory(category),
                (old: Token[] | undefined) => old?.filter((t) => t.id !== tokenId)
            );

            // Optimistically remove from Redux
            dispatch(removeToken({ category, tokenId }));

            return { previousTokens, category, tokenId };
        },

        onError: (err, { category }, context) => {
            if (context?.previousTokens) {
                queryClient.setQueryData(
                    tokenQueryKeys.byCategory(category),
                    context.previousTokens
                );

                // Rollback Redux
                const removedToken = context.previousTokens.find(
                    (t) => t.id === context.tokenId
                );
                if (removedToken) {
                    dispatch(addToken({ category, token: removedToken }));
                }
            }
            console.error('Failed to remove token:', err);
        },

        onSettled: (_, __, { category }) => {
            queryClient.invalidateQueries({
                queryKey: tokenQueryKeys.byCategory(category),
            });
        },
    });
}

/**
 * Hook to batch update token prices
 * Useful for WebSocket-driven updates
 */
export function useBatchUpdatePrices() {
    const dispatch = useAppDispatch();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (updates: PriceUpdate[]) => {
            // In a real app, this might batch-send to an API
            return updates;
        },

        onSuccess: (updates) => {
            // Update Redux
            dispatch({
                type: 'tokens/batchUpdatePrices',
                payload: updates,
            });

            // Update React Query cache
            const categories: TokenCategory[] = ['new-pairs', 'final-stretch', 'migrated'];

            categories.forEach((category) => {
                const cachedTokens = queryClient.getQueryData<Token[]>(
                    tokenQueryKeys.byCategory(category)
                );

                if (cachedTokens) {
                    const updatedTokens = cachedTokens.map((token) => {
                        const update = updates.find((u) => u.tokenId === token.id);
                        if (update) {
                            return {
                                ...token,
                                price: update.price,
                                priceChange1m: update.priceChange1m,
                                priceChange5m: update.priceChange5m,
                            };
                        }
                        return token;
                    });

                    queryClient.setQueryData(
                        tokenQueryKeys.byCategory(category),
                        updatedTokens
                    );
                }
            });
        },
    });
}
