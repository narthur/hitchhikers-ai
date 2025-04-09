#!/bin/bash

echo "🧹 Clearing Guide article and search caches..."

# List and delete all ARTICLES keys
echo "📚 Clearing article cache..."
pnpm wrangler kv key list --binding=ARTICLES --remote | jq -r '.[] | .name' | while read key; do
  echo "Deleting article: $key"
  pnpm wrangler kv key delete --binding=ARTICLES --remote "$key"
done

# List and delete all SEARCHES keys
echo "🔍 Clearing search cache..."
pnpm wrangler kv key list --binding=SEARCHES --remote | jq -r '.[] | .name' | while read key; do
  echo "Deleting search: $key"
  pnpm wrangler kv key delete --binding=SEARCHES --remote "$key"
done

echo "✨ Cache clearing complete!"