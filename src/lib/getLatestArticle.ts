import { marked } from "marked";
import { getIndex } from "./indices";

/**
 * Retrieves the most recently uploaded article, converts it from Markdown to HTML, and returns its first paragraph and path.
 *
 * If `articles` or `indices` is missing, if no index entries exist, or if the latest article cannot be fetched, the function returns `null`.
 *
 * The "latest" article is determined by the `metadata.uploaded` timestamp on index entries (missing timestamps are treated as 0). The article body is rendered from Markdown to HTML and the content of the first `<p>...</p>` is returned as `text` (empty string if no paragraph is found).
 *
 * @returns A promise resolving to an object with `{ text, path }` for the latest article, or `null` when no article is available.
 */
export async function getLatestArticle(
  articles: KVNamespace | undefined,
  indices: KVNamespace | undefined
): Promise<{ text: string; path: string } | null> {
  if (!articles || !indices) return null;

  const keys = await getIndex(articles, "articles", indices);

  if (keys.length === 0) return null;

  const sortedKeys = keys.sort((a: any, b: any) => {
    const aTime = a.metadata?.uploaded || 0;
    const bTime = b.metadata?.uploaded || 0;
    return bTime - aTime;
  });

  const latestKey = sortedKeys[0];

  if (!latestKey) return null;

  const fullEntry = await articles.get(latestKey.name, "text");

  if (!fullEntry) return null;

  const parsedHtml = await marked(fullEntry);
  const match = parsedHtml.match(/<p>(.*?)<\/p>/);
  const firstParagraph = match ? match[1] : "";

  return {
    text: firstParagraph,
    path: latestKey.name,
  };
}
