import { getIndex } from "./indices";

interface Options {
  indexKey: "articles";
  indices: KVNamespace | undefined;
  kv: KVNamespace | undefined;
  excludedKeys?: string[];
  count?: number;
}

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
