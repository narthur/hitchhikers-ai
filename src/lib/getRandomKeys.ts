import { getIndex } from "./indices";

interface Options {
  indexKey: "articles";
  indices: KVNamespace | undefined;
  kv: KVNamespace | undefined;
  excludedKeys?: string[];
  count?: number;
}

/**
 * Retrieve a randomized subset of keys from an index.
 *
 * Fetches the index for `indexKey` (via the provided `kv` and `indices`), optionally filters out keys
 * whose names appear in `excludedKeys`, shuffles the remaining entries, and returns up to `count`
 * keys.
 *
 * If `kv` or `indices` is not provided the function returns an empty array.
 *
 * @param indexKey - The index identifier (e.g., `"articles"`) to load.
 * @param excludedKeys - Optional list of key names to exclude from selection.
 * @param count - Maximum number of keys to return (default: 1).
 * @returns A promise that resolves to an array of up to `count` randomly chosen keys from the index.
 */
export async function getRandomKeys<T>({
  indexKey,
  indices,
  kv,
  excludedKeys,
  count = 1,
}: Options): Promise<KVNamespaceListKey<T>[]> {
  if (!kv || !indices) return [];

  const index = await getIndex<T>(kv, indexKey, indices);

  const filteredKeys = excludedKeys
    ? index.filter((key) => !excludedKeys.includes(key.name))
    : index;

  return filteredKeys.sort(() => 0.5 - Math.random()).slice(0, count);
}
