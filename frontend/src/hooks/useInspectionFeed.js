import { useEffect, useRef, useState } from 'react';
import { api } from '../api/client';
import { defaults } from '../constants';
import { createPageLoader } from '../api/pageLoader';

export function useInspectionFeed(filters, view, revision, invalidRange) {
  const [state, setState] = useState({
    rows: [],
    summary: null,
    loading: true,
    loadingMore: false,
    error: '',
    pageError: '',
    hasMore: false,
  });
  const sentinel = useRef(null);
  const retry = useRef(() => {});
  useEffect(() => {
    const controller = new AbortController();
    let observer;
    const update = (patch) => {
      if (!controller.signal.aborted)
        setState((previous) => ({ ...previous, ...patch }));
    };
    const loader = createPageLoader({
      request: (page) =>
        api.list(
          { ...(view === 'overview' ? defaults : filters), page, limit: 20 },
          controller.signal,
        ),
      onPage: (result, page) => {
        if (controller.signal.aborted) return;
        setState((previous) => {
          const unique = new Map(
            (page === 1 ? [] : previous.rows).map((row) => [row.id, row]),
          );
          result.items.forEach((row) => unique.set(row.id, row));
          return {
            ...previous,
            rows: [...unique.values()],
            hasMore: result.pagination.hasMore,
          };
        });
      },
    });
    const loadMore = async () => {
      if (controller.signal.aborted || loader.loading || !loader.hasMore)
        return;
      update({ loadingMore: true, pageError: '' });
      try {
        await loader.load();
      } catch (error) {
        if (error.name !== 'AbortError') update({ pageError: error.message });
      } finally {
        update({ loadingMore: false });
      }
    };
    retry.current = loadMore;
    const start = async () => {
      if (controller.signal.aborted) return;
      update({
        rows: [],
        loading: true,
        loadingMore: false,
        error: '',
        pageError: '',
        hasMore: false,
      });
      if (invalidRange && view === 'inspections') {
        update({ loading: false });
        return;
      }
      try {
        const [, summary] = await Promise.all([
          loader.load(),
          api.summary(controller.signal),
        ]);
        update({ summary, loading: false });
        if (controller.signal.aborted || view !== 'inspections') return;
        observer = new IntersectionObserver(
          (entries) => {
            if (entries.some((entry) => entry.isIntersecting)) void loadMore();
          },
          { rootMargin: '250px' },
        );
        if (sentinel.current) observer.observe(sentinel.current);
      } catch (error) {
        if (error.name !== 'AbortError')
          update({ error: error.message, loading: false });
      }
    };
    // Avoid duplicate initial network calls from React StrictMode's setup/cleanup.
    queueMicrotask(start);
    return () => {
      controller.abort();
      observer?.disconnect();
      loader.cancel();
    };
  }, [filters, view, revision, invalidRange]);
  return { ...state, sentinel, retryPage: () => retry.current() };
}
