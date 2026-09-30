// One loader per filter/sort generation. The synchronous lock prevents repeated
// observer callbacks from requesting the same page while React updates render.
export function createPageLoader({ request, onPage }) {
  let page = 1,
    loading = false,
    hasMore = true,
    cancelled = false;
  return {
    get loading() {
      return loading;
    },
    get hasMore() {
      return hasMore && !cancelled;
    },
    cancel() {
      cancelled = true;
    },
    async load() {
      if (loading || !hasMore || cancelled) return;
      loading = true;
      try {
        const result = await request(page);
        if (cancelled) return;
        onPage(result, page);
        hasMore = result.pagination.hasMore;
        page += 1;
      } finally {
        loading = false;
      }
    },
  };
}
