import type { Token, TokenCategory } from '@/types';
import { generateMockToken, generateProgressiveTokens } from './websocket-mock';

/**
 * Query key factories for React Query cache management
 */
export const tokenQueryKeys = {
    all: ['tokens'] as const,
    byCategory: (category: TokenCategory) => ['tokens', category] as const,
    single: (id: string) => ['tokens', 'single', id] as const,
};

/**
 * Simulated API delay for realistic loading behavior
 */
const simulateDelay = (ms: number = 500) =>
    new Promise<void>(resolve => setTimeout(resolve, ms));

/**
 * Fetch tokens for a specific category
 * Simulates an API call with realistic delay
 */
export async function fetchTokensByCategory(
    category: TokenCategory,
    count: number = 12
): Promise<Token[]> {
    await simulateDelay(300 + Math.random() * 400);

    // Generate mock tokens for the category
    const tokens: Token[] = Array.from({ length: count }, () =>
        generateMockToken(category)
    );

    return tokens;
}

/**
 * Fetch all tokens across all categories
 * Returns tokens organized by category
 */
export async function fetchAllTokens(countPerCategory: number = 12): Promise<{
    newPairs: Token[];
    finalStretch: Token[];
    migrated: Token[];
}> {
    await simulateDelay(500);

    return {
        newPairs: Array.from({ length: countPerCategory }, () =>
            generateMockToken('new-pairs')
        ),
        finalStretch: Array.from({ length: countPerCategory }, () =>
            generateMockToken('final-stretch')
        ),
        migrated: Array.from({ length: countPerCategory }, () =>
            generateMockToken('migrated')
        ),
    };
}

/**
 * Simulate updating a token price (for optimistic updates demo)
 * In a real app, this would be a PATCH/PUT request
 */
export async function updateTokenPriceApi(
    tokenId: string,
    newPrice: number
): Promise<{ success: boolean; tokenId: string; price: number }> {
    await simulateDelay(200);

    // Simulate occasional failures (5% chance)
    if (Math.random() < 0.05) {
        throw new Error('Failed to update token price. Please try again.');
    }

    return {
        success: true,
        tokenId,
        price: newPrice
    };
}

/**
 * Add a new token to a category
 */
export async function addTokenApi(
    category: TokenCategory
): Promise<Token> {
    await simulateDelay(300);

    // Simulate occasional failures
    if (Math.random() < 0.05) {
        throw new Error('Failed to add token. Please try again.');
    }

    return generateMockToken(category);
}

/**
 * Remove a token from a category
 */
export async function removeTokenApi(
    tokenId: string
): Promise<{ success: boolean; tokenId: string }> {
    await simulateDelay(200);

    // Simulate occasional failures
    if (Math.random() < 0.05) {
        throw new Error('Failed to remove token. Please try again.');
    }

    return { success: true, tokenId };
}

/**
 * Progressive token fetcher that yields tokens in batches
 * Used for smooth loading experience with staggered animations
 */
export function createProgressiveTokenFetcher(
    countPerCategory: number = 12,
    batchSize: number = 4,
    delayMs: number = 120
) {
    return generateProgressiveTokens;
}
