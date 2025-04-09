# Rate Limiting Implementation Plan

## 1. Create KV Store
- Create Cloudflare KV namespace for token tracking
- Single key for today's usage
- Reset daily via key expiration

## 2. Implementation Steps

### Step 1: Set Up KV Store
1. Create TokenUsage KV namespace in Cloudflare
2. Add KV binding to wrangler.toml
3. Use ISO date as key (e.g., "2024-01-20")
4. Set 24h TTL on keys for automatic reset

### Step 2: Create OpenAI Wrapper
```typescript
interface DailyUsage {
  totalTokens: number;
  lastUpdated: string;
}

class RateLimitedOpenAI {
  private readonly MAX_TOKENS_PER_DAY = 100000;
  private readonly KV_TTL_SECONDS = 86400; // 24 hours
  
  async createChatCompletion(messages: any[], options = {}) {
    const today = new Date().toISOString().split('T')[0];
    const usage = await this.getUsage(today);
    
    if (usage.totalTokens >= this.MAX_TOKENS_PER_DAY) {
      return this.getLimitExceededResponse();
    }

    const completion = await this.openai.chat.completions.create({
      ...options,
      messages,
      model: options.model || "gpt-3.5-turbo"
    });

    await this.updateUsage(today, completion.usage?.total_tokens || 0);
    return completion;
  }
}
```

### Step 3: Error Response
```typescript
const getLimitExceededResponse = () => ({
  choices: [{
    message: {
      content: "The Guide's computational circuits are currently overloaded with requests from various parts of the galaxy. Please try again tomorrow. DON'T PANIC - this is a temporary measure to prevent the heat death of the universe."
    }
  }]
});
```

## 3. Key Points
- Focus only on unique path requests
- Use completion.usage for accurate token counting
- Daily reset via KV TTL
- Simple atomic updates
- No caching logic (handled separately)