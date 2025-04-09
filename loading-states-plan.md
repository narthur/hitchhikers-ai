# Adding Loading States to Article Pages

## 1. Create API Endpoint
Create `/api/article/[...path].ts` that will:
- Handle article fetching/generation
- Return JSON with article content and metadata
- Handle errors gracefully

## 2. Update Article Page
Modify `[...path].astro` to:
- Show loading state immediately
- Client-side fetch content from API
- Handle loading/error/success states
- Use transition animations

## Implementation Details

### API Endpoint
```typescript
// /api/article/[...path].ts
export async function GET({ params, locals }) {
  try {
    const article = await getArticle(
      locals.runtime.env.OPENAI_API_KEY,
      locals.runtime.env.TOKEN_USAGE,
      locals.runtime.env.ARTICLES,
      params.path
    );
    return new Response(JSON.stringify({ content: article }));
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
}
```

### Article Page
```typescript
// [...path].astro
---
const { path } = Astro.params;
const formattedPath = path?.replace(/[/-]/g, ' ').trim() || '404';
---

<Layout>
  <article>
    <div id="loading" class="loading">Loading...</div>
    <div id="content" class="hidden"></div>
    <div id="error" class="hidden"></div>
  </article>

  <script>
    // Client-side fetch and state management
    async function loadArticle() {
      const content = document.getElementById('content');
      const loading = document.getElementById('loading');
      const error = document.getElementById('error');
      
      try {
        const response = await fetch(`/api/article/${window.location.pathname}`);
        const data = await response.json();
        
        if (data.error) throw new Error(data.error);
        
        content.innerHTML = data.content;
        content.classList.remove('hidden');
        loading.classList.add('hidden');
      } catch (e) {
        error.textContent = "Error loading article";
        error.classList.remove('hidden');
        loading.classList.add('hidden');
      }
    }

    loadArticle();
  </script>
</Layout>
```

### Loading State Styling
```css
.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  font-style: italic;
  opacity: 0.8;
}

.hidden {
  display: none;
}

/* Add fade transitions */
#content {
  opacity: 0;
  transition: opacity 0.3s ease-in-out;
}

#content:not(.hidden) {
  opacity: 1;
}
```

## Benefits
1. Better UX with immediate page load and loading indicator
2. Cleaner separation of concerns
3. More resilient error handling
4. Smooth transitions between states
5. Potential for future caching improvements at API level