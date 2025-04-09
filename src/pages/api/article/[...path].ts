import { getArticle } from "../../../lib/getArticle";

export const prerender = false;

export async function GET({ params, locals }: any) {
  try {
    const articles = locals.runtime?.env?.ARTICLES;
    if (!articles) {
      throw new Error("Article storage not available");
    }

    // Log the incoming path for debugging
    console.log("Incoming path:", params.path);

    // Handle path parameter correctly - it comes as an array
    const articlePath = Array.isArray(params.path)
      ? params.path.join("/")
      : params.path;
    console.log("Processed path:", articlePath);

    const content = await getArticle(
      locals.runtime.env.OPENAI_API_KEY,
      locals.runtime.env.TOKEN_USAGE,
      articles,
      articlePath || "404"
    );

    if (!content) {
      throw new Error("No content generated");
    }

    return new Response(JSON.stringify({ content }), {
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error: any) {
    // Log the full error for debugging
    console.error("API Error:", error);
    console.error("Error stack:", error.stack);

    return new Response(
      JSON.stringify({
        error: error.message || "Error generating article",
        content:
          "The Guide seems to be experiencing technical difficulties. Please try again later.",
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
  }
}
