import OpenAI from 'openai';

interface DailyUsage {
  totalTokens: number;
  lastUpdated: string;
}

export class RateLimitedOpenAI {
  private readonly openai: OpenAI;
  private readonly tokenUsage: KVNamespace;
  private readonly MAX_TOKENS_PER_DAY = 100000;
  private readonly KV_TTL_SECONDS = 86400; // 24 hours

  constructor(apiKey: string, tokenUsage: KVNamespace) {
    this.openai = new OpenAI({ apiKey });
    this.tokenUsage = tokenUsage;
  }

  private async getUsage(dateKey: string): Promise<DailyUsage> {
    const usage = await this.tokenUsage.get<DailyUsage>(dateKey, 'json');
    return usage || { totalTokens: 0, lastUpdated: new Date().toISOString() };
  }

  private async updateUsage(dateKey: string, newTokens: number): Promise<void> {
    const current = await this.getUsage(dateKey);
    const updated: DailyUsage = {
      totalTokens: current.totalTokens + newTokens,
      lastUpdated: new Date().toISOString()
    };
    
    await this.tokenUsage.put(dateKey, JSON.stringify(updated), {
      expirationTtl: this.KV_TTL_SECONDS
    });
  }

  private getLimitExceededResponse() {
    return {
      choices: [{
        message: {
          content: "The Guide's computational circuits are currently overloaded with requests from various parts of the galaxy. Please try again tomorrow. DON'T PANIC - this is a temporary measure to prevent the heat death of the universe."
        }
      }]
    };
  }

  async createChatCompletion(messages: any[], options = {}) {
    const today = new Date().toISOString().split('T')[0];
    const usage = await this.getUsage(today);
    
    if (usage.totalTokens >= this.MAX_TOKENS_PER_DAY) {
      return this.getLimitExceededResponse();
    }

    try {
      const completion = await this.openai.chat.completions.create({
        ...options,
        messages,
        model: options.model || "gpt-3.5-turbo"
      });

      // Update usage with actual tokens used
      if (completion.usage?.total_tokens) {
        await this.updateUsage(today, completion.usage.total_tokens);
      }

      return completion;
    } catch (error: any) {
      console.error('OpenAI API Error:', error);
      
      // Handle rate limits from OpenAI
      if (error?.status === 429) {
        return this.getLimitExceededResponse();
      }
      
      throw error;
    }
  }
}