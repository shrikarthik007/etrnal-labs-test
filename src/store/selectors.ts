import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './index';
import type { Token, TokenCategory, SortOption, SortOrder } from '@/types';

/**
 * Base selectors for tokens state
 */
const selectTokensState = (state: RootState) => state.tokens;

/**
 * Memoized selector for new pairs tokens
 */
export const selectNewPairs = createSelector(
    [selectTokensState],
    (tokens) => tokens.newPairs
);

/**
 * Memoized selector for final stretch tokens
 */
export const selectFinalStretch = createSelector(
    [selectTokensState],
    (tokens) => tokens.finalStretch
);

/**
 * Memoized selector for migrated tokens
 */
export const selectMigrated = createSelector(
    [selectTokensState],
    (tokens) => tokens.migrated
);

/**
 * Memoized selector for tokens by category
 */
export const selectTokensByCategory = createSelector(
    [selectTokensState, (_state: RootState, category: TokenCategory) => category],
    (tokens, category) => {
        switch (category) {
            case 'new-pairs':
                return tokens.newPairs;
            case 'final-stretch':
                return tokens.finalStretch;
            case 'migrated':
                return tokens.migrated;
            default:
                return [];
        }
    }
);

/**
 * Memoized selector for loading state by category
 */
export const selectLoadingByCategory = createSelector(
    [selectTokensState, (_state: RootState, category: TokenCategory) => category],
    (tokens, category) => {
        switch (category) {
            case 'new-pairs':
                return tokens.loading.newPairs;
            case 'final-stretch':
                return tokens.loading.finalStretch;
            case 'migrated':
                return tokens.loading.migrated;
            default:
                return false;
        }
    }
);

/**
 * Memoized selector for sort config by category
 */
export const selectSortConfig = createSelector(
    [selectTokensState, (_state: RootState, category: TokenCategory) => category],
    (tokens, category) => tokens.sortConfig[category]
);

/**
 * Memoized selector for active preset by category
 */
export const selectActivePreset = createSelector(
    [selectTokensState, (_state: RootState, category: TokenCategory) => category],
    (tokens, category) => tokens.activePresets[category]
);

/**
 * Memoized selector for connection status
 */
export const selectConnectionStatus = createSelector(
    [selectTokensState],
    (tokens) => tokens.connectionStatus
);

/**
 * Memoized selector for last connection time
 */
export const selectLastConnectionTime = createSelector(
    [selectTokensState],
    (tokens) => tokens.lastConnectionTime
);

/**
 * Memoized selector for selected token (modal)
 */
export const selectSelectedToken = createSelector(
    [selectTokensState],
    (tokens) => tokens.selectedToken
);

/**
 * Memoized selector for total token count
 */
export const selectTotalTokenCount = createSelector(
    [selectNewPairs, selectFinalStretch, selectMigrated],
    (newPairs, finalStretch, migrated) =>
        newPairs.length + finalStretch.length + migrated.length
);

/**
 * Compare function factory for sorting tokens
 */
function createCompareFn(sortBy: SortOption, sortOrder: SortOrder) {
    return (a: Token, b: Token): number => {
        let comparison = 0;

        switch (sortBy) {
            case 'price':
                comparison = a.price - b.price;
                break;
            case 'priceChange1m':
                comparison = a.priceChange1m - b.priceChange1m;
                break;
            case 'priceChange5m':
                comparison = a.priceChange5m - b.priceChange5m;
                break;
            case 'priceChange1h':
                comparison = a.priceChange1h - b.priceChange1h;
                break;
            case 'marketCap':
                comparison = a.marketCap - b.marketCap;
                break;
            case 'liquidity':
                comparison = a.liquidity - b.liquidity;
                break;
            case 'volume24h':
                comparison = a.volume24h - b.volume24h;
                break;
            case 'createdAt':
                comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
                break;
            case 'holders':
                comparison = a.holders - b.holders;
                break;
            default:
                comparison = 0;
        }

        return sortOrder === 'asc' ? comparison : -comparison;
    };
}

/**
 * Memoized selector for sorted tokens by category
 * Combines token data with sort config for optimal re-render performance
 */
export const selectSortedTokensByCategory = createSelector(
    [
        selectTokensState,
        (_state: RootState, category: TokenCategory) => category,
    ],
    (tokens, category) => {
        const tokenList = (() => {
            switch (category) {
                case 'new-pairs':
                    return tokens.newPairs;
                case 'final-stretch':
                    return tokens.finalStretch;
                case 'migrated':
                    return tokens.migrated;
                default:
                    return [];
            }
        })();

        const { sortBy, sortOrder } = tokens.sortConfig[category];
        const compareFn = createCompareFn(sortBy, sortOrder);

        return [...tokenList].sort(compareFn);
    }
);

/**
 * Memoized selector for all loading states
 */
export const selectAllLoading = createSelector(
    [selectTokensState],
    (tokens) => tokens.loading
);

/**
 * Memoized selector to check if any category is loading
 */
export const selectIsAnyLoading = createSelector(
    [selectAllLoading],
    (loading) => loading.newPairs || loading.finalStretch || loading.migrated
);
