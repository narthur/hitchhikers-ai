import { marked } from "marked";
import { getIndex } from "./indices";

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
