const EXPIRATION_TTL = 86400; // 24 hours

export async function getIndex<T>(
  kv: KVNamespace | undefined,
  indexKey: "articles" | "searches",
  indices: KVNamespace | undefined
): Promise<KVNamespaceListKey<T>[]> {
  if (!indices) return [];

  const index = await indices.get<KVNamespaceListKey<T>[]>(indexKey, "json");

  if (index) return index;
  if (!kv) return [];

  return updateIndex(kv, indexKey, indices);
}

export async function updateIndex<T>(
  kv: KVNamespace | undefined,
  indexKey: "articles" | "searches",
  indices: KVNamespace | undefined
): Promise<KVNamespaceListKey<T>[]> {
  if (!kv || !indices) return [];

  const { keys } = await kv.list<T>();

  await indices.put(indexKey, JSON.stringify(keys), {
    expirationTtl: EXPIRATION_TTL,
  });

  return keys;
}
