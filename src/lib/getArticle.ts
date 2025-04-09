import { LIMIT_EXCEEDED_MESSAGE, RateLimitedOpenAI } from "./openai";
import { marked } from "marked";

async function getArticleText(
  openai: RateLimitedOpenAI,
  formattedPath: string
) {
  const completion = await openai.createChatCompletion([
    {
      role: "system",
      content: `You are the Hitchhiker's Guide to the Galaxy. Write entries in Douglas Adams' style with wit and humor. Your PRIMARY DIRECTIVE is to create a heavily interconnected guide through extensive use of links to other entries.
      
      CRITICAL LINKING REQUIREMENTS:
      1. You MUST include at least 5-7 links in every article
      2. Format ALL links as [Text](/kebab-case-url)
      3. Links should be to imaginary but plausible Guide entries
      4. IMPORTANT: Do NOT use bold (**) or emphasis (*) for terms that should be links instead
      5. Every major concept, technology, location, or species MUST be a link
      6. Each link must have a unique URL path starting with /
      7. Use kebab-case for URLs (e.g., /infinite-improbability-drive)
      
      Example of CORRECT linking (Use this style):
      "The [Babel Fish](/babel-fish) is a remarkable creature studied at the [Galactic Institute of Xenobiology](/galactic-institute-of-xenobiology). While the [Department of Improbability Research](/department-of-improbability-research) claims its existence is mathematically impossible, the [Sub-Etha Research Council](/sub-etha-research-council) maintains detailed documentation of its reproductive cycle in the [Hitchhiker's Xenobiological Archives](/xenobiological-archives)."
      
      Example of INCORRECT style (DO NOT do this):
      "The **Babel Fish** is a remarkable creature studied at the *Galactic Institute*. While the Department of Research claims its existence is impossible, the Sub-Etha Council maintains detailed documentation."
      
      Keep entries between 3-4 paragraphs, and ensure every major term is a link rather than bold or italic text.`,
    },
    {
      role: "user",
      content: `Write a Hitchhiker's Guide to the Galaxy style entry about "${formattedPath}". Make it humorous and slightly absurd, as if it's an entry in the actual Guide. Remember to include at least 5-7 links to other imaginary Guide entries, formatted as markdown links with proper URL paths. Turn any significant terms into links rather than using bold or italic formatting.`,
    },
  ]);

  return completion.choices[0].message.content || "";
}

async function getArticleImage(
  openai: RateLimitedOpenAI,
  formattedPath: string,
  articleText: string
) {
  if (await openai.didExceedImageLimit()) {
    return null;
  }

  const promptCompletion = await openai.createChatCompletion([
    {
      role: "system",
      content: "You are an expert at creating image generation prompts. Given an article from the Hitchhiker's Guide to the Galaxy, create a single vivid, detailed prompt that captures the most interesting visual elements. Focus on concrete visual details, avoid abstract concepts, and do not include any text elements in the image description. Keep the prompt under 100 words and make it quirky and memorable in Douglas Adams' style."
    },
    {
      role: "user",
      content: `Create an image generation prompt for this Guide entry about "${formattedPath}":\n\n${articleText}`
    }
  ]);

  const imagePrompt = promptCompletion.choices[0].message.content || 
    `Absurd and humorous image illustrating "${formattedPath}" in the style of the Hitchhiker's Guide to the Galaxy. Focus on visual details and symbolism. Do not include any text.`;

  const image = await openai.createImage(imagePrompt);
  return image ? `<img src="data:image/png;base64,${image}" alt="${formattedPath}" width="200" height="200" />` : null;
}

export async function getArticle(
  apiKey: string,
  tokenUsage: any,
  articles: any,
  urlPath: string
) {
  const openai = new RateLimitedOpenAI(apiKey, tokenUsage);
  const formattedPath = urlPath?.replace(/[/-]/g, " ").trim() || "404";
  const cachedEntry = await articles.get(urlPath || "404", "text");

  if (cachedEntry) {
    return marked(cachedEntry);
  }

  if (await openai.didExceedLimit()) {
    return LIMIT_EXCEEDED_MESSAGE;
  }

  const text = await getArticleText(openai, formattedPath);
  const image = await getArticleImage(openai, formattedPath, text);
  const guideEntry = image ? `${image}\n\n${text}` : text;

  await articles.put(urlPath || "404", guideEntry);

  return marked(guideEntry);
}
