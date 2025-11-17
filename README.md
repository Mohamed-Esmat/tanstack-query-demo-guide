# TanStack Query (React Query) — The Complete Guide

This repository contains a production-style demo and a comprehensive guide to mastering TanStack Query v5 for React. It’s written for students and professionals who want a deep understanding of server-state management: from first query to optimistic updates, pagination, and SSR.

If you just want to try the app locally, jump to “Run the demo locally”. If you want the full learning journey, start from the top.

## Table of contents

- What and why TanStack Query
- Core mental model: server state vs UI state
- Installation and project setup
- QueryClient, Provider, Devtools
- Query Keys and Filters (the foundation)
- Queries: fetching, caching, status, refetching
- Mutations: create/update/delete, side-effects, optimistic updates
- Invalidation strategies and cache updates
- Pagination and Infinite Loading
- Parallel and Dependent Queries
- Select, Initial/Placeholder Data, Derived Data
- Background refetch, retries, and cancellation
- Prefetching and SSR/SSG hydration
- Error handling patterns
- Performance tips and configuration defaults
- Testing queries and mutations
- Recipes from this repo (path-based examples)
- Run the demo locally
- Further reading

---

## What and why TanStack Query

TanStack Query (a.k.a. React Query) is a battle-tested library for fetching, caching, synchronizing, and updating server state in front-end apps. It solves problems that are hard to do well with ad-hoc fetch + useEffect combinations:

- Smart caching with freshness windows (no more over-fetching)
- Request de-duplication, background refetch, and retries
- Declarative status flags (pending/error/success/fetching)
- Mutations with optimistic updates and rollback
- Consistent invalidation APIs that scale with your app

It is not a replacement for local UI state (forms, toggles, modals) but the best companion for remote/server state.

## Core mental model: server state vs UI state

- UI/state you own (form inputs, toggles, ephemeral selections) lives in React state.
- Server state (data that lives on a server, can be concurrently edited, is authoritative and shareable) lives in TanStack Query. Your React components “subscribe” to it via hooks like `useQuery` and `useMutation`.

## Installation and project setup

This project already has TanStack Query v5 installed:

- `@tanstack/react-query`: ^5
- React 19

Minimal install in a fresh React app:

```bash
npm i @tanstack/react-query

# Optional but recommended during development
npm i -D @tanstack/react-query-devtools
```

## QueryClient, Provider, Devtools

At the root of your app, create one `QueryClient` and wrap your UI with `QueryClientProvider`.

In this repo:

- `src/util/http.js` creates the client: `export const queryClient = new QueryClient()`
- `src/App.jsx` wraps the app with `<QueryClientProvider client={queryClient}>`.

Example:

```jsx
// src/util/http.js
import { QueryClient } from "@tanstack/react-query";
export const queryClient = new QueryClient();

// src/App.jsx
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./util/http.js";

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      {/* your routes and components */}
    </QueryClientProvider>
  );
}
```

Devtools (optional, development only):

```jsx
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

<QueryClientProvider client={queryClient}>
  <AppRoutes />
  <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-right" />
</QueryClientProvider>;
```

## Query Keys and Filters (the foundation)

Every piece of cached data is identified by a Query Key. Keys are arrays. Use stable, structured keys to represent the identity of data.

- List: `['posts']`
- Single item: `['posts', id]`
- With params: `['posts', { searchTerm, page }]`

Filters let you operate on groups of queries. For example:

```js
// invalidate all post-related queries
queryClient.invalidateQueries({ queryKey: ["posts"] });

// refetch only the details of a specific post
queryClient.invalidateQueries({ queryKey: ["posts", postId] });
```

Best practices:

- Don’t put functions in keys. Use serializable values.
- Keep keys stable. Derive params outside and pass them into the key.
- Use objects for sets of optional params instead of concatenated strings.

## Queries: fetching, caching, status, refetching

Use `useQuery` to subscribe to server data.

```jsx
import { useQuery } from "@tanstack/react-query";

function PostsList() {
  const { data, isPending, isError, error, fetchStatus } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts, // receives ({ signal, queryKey })
    staleTime: 5_000, // data is fresh for 5s
    // gcTime: 5 * 60 * 1000,      // time to garbage-collect unused queries (default ~5min)
    retry: 3, // number of retry attempts on error (default 3)
    refetchOnWindowFocus: true, // default true
  });

  if (isPending) return <Spinner />;
  if (isError) return <Error message={error.info?.message} />;
  return data.map((p) => <Post key={p.id} post={p} />);
}
```

Key v5 status flags:

- `isPending`: first-load in progress
- `isError`: last attempt errored and no data
- `isSuccess`: data available
- `fetchStatus`: `'idle' | 'fetching' | 'paused'` for background activity

From the repo:

- `src/components/Posts/NewPostsSection.jsx` shows basic querying for `['posts']` with `staleTime`.
- `src/components/Posts/PostDetails.jsx` fetches a single post with key `['posts', id]`.

Dependent queries with `enabled`:

```jsx
const { data } = useQuery({
  queryKey: ["posts", { searchTerm }],
  queryFn: ({ signal }) => fetchPosts({ signal, searchTerm }),
  enabled: searchTerm !== undefined && searchTerm !== "",
});
```

## Mutations: create/update/delete, side-effects, optimistic updates

Use `useMutation` for any action that changes data on the server. Mutations are not cached by key; you use their side-effects to update or invalidate queries.

```jsx
import { useMutation } from "@tanstack/react-query";

const { mutate, isPending, isError, error } = useMutation({
  mutationFn: createPost,
  onSuccess: (created) => {
    // simplest strategy: invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ["posts"] });
  },
});
```

Optimistic update + rollback (from this repo’s edit flow):

```jsx
// src/components/Posts/EditPost.jsx
const { mutate } = useMutation({
  mutationFn: updatePost,
  onMutate: async ({ id, post }) => {
    await queryClient.cancelQueries({ queryKey: ["posts", id] });
    const previous = queryClient.getQueryData(["posts", id]);
    queryClient.setQueryData(["posts", id], post); // optimistic value
    return { previous };
  },
  onError: (_err, { id }, ctx) => {
    // rollback if server rejects
    queryClient.setQueryData(["posts", id], ctx.previous);
  },
  onSettled: (_data, _err, { id }) => {
    // ensure data is in sync no matter what
    queryClient.invalidateQueries(["posts", id]);
  },
});
```

Delete with controlled refetch (avoid automatic refetch of the list):

```jsx
// src/components/Posts/PostDetails.jsx
useMutation({
  mutationFn: deletePost,
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["posts"], refetchType: "none" });
  },
});
```

## Invalidation strategies and cache updates

Common patterns:

- Invalidate a list after creating/updating/deleting an item: `invalidateQueries({ queryKey: ['posts'] })`
- Invalidate a detail after editing: `invalidateQueries(['posts', id])`
- Directly update cache for snappy UX: `setQueryData(['posts', id], updater)`
- Pre-populate queries to avoid spinners during navigation

Direct cache update example:

```js
queryClient.setQueryData(["posts"], (old = []) => [newPost, ...old]);
```

## Pagination and Infinite Loading

Two common approaches:

1. Classic pagination with a `page` param and `placeholderData` to keep previous page visible while the next loads.

```jsx
const { data, isPending } = useQuery({
  queryKey: ["posts", { page }],
  queryFn: ({ signal, queryKey }) =>
    fetchPosts({ signal, page: queryKey[1].page }),
  placeholderData: (prev) => prev, // keep previous result while fetching
});
```

2. Infinite loading with `useInfiniteQuery`:

```jsx
import { useInfiniteQuery } from "@tanstack/react-query";

const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
  useInfiniteQuery({
    queryKey: ["posts", "infinite"],
    queryFn: ({ pageParam = 1, signal }) =>
      fetchPosts({ signal, page: pageParam }),
    getNextPageParam: (lastPage, allPages) =>
      lastPage.hasMore ? allPages.length + 1 : undefined,
  });
```

## Parallel and Dependent Queries

For multiple queries in one component, use `useQueries`:

```jsx
import { useQueries } from "@tanstack/react-query";

const results = useQueries({
  queries: [
    { queryKey: ["posts"], queryFn: fetchPosts },
    { queryKey: ["posts-images"], queryFn: fetchSelectableImages },
  ],
});

const [posts, images] = results.map((r) => r.data);
```

Dependent queries rely on `enabled` to postpone execution until inputs exist (e.g., wait for an `id`). See `FindPostSection.jsx` for `enabled` with a search term.

## Select, Initial/Placeholder Data, Derived Data

- `select`: transform data before it hits your component.
- `initialData`: provide a value before the first fetch (e.g., from navigation state).
- `placeholderData`: show a fallback while loading (e.g., keep previous data).

```jsx
const { data } = useQuery({
  queryKey: ["post", id],
  queryFn: fetchPostById,
  select: (post) => ({ ...post, shortTitle: post.title.slice(0, 30) + "…" }),
  placeholderData: (prev) => prev,
});
```

## Background refetch, retries, and cancellation

Defaults you should know:

- `refetchOnWindowFocus: true` (revalidate data when user refocuses the tab)
- `refetchOnReconnect: true` (revalidate after network reconnect)
- `retry: 3` (retry failed queries with exponential backoff)

Request cancellation: your `queryFn` receives an `AbortSignal` and should pass it to `fetch` so refetches and unmounts can cancel in-flight requests.

```js
export async function fetchPosts({ signal }) {
  const res = await fetch("/posts", { signal });
  // ...
}
```

This repo uses it in `src/util/http.js` for all `fetch*` functions.

## Prefetching and SSR/SSG hydration

Prefetch before navigation to eliminate loading states:

```js
await queryClient.prefetchQuery({ queryKey: ["posts"], queryFn: fetchPosts });
```

For SSR/SSG, use dehydration in v5:

```jsx
// Server
import { QueryClient, dehydrate } from "@tanstack/react-query";
const queryClient = new QueryClient();
await queryClient.prefetchQuery({ queryKey: ["posts"], queryFn: fetchPosts });
const dehydrated = dehydrate(queryClient);

// Client
import { HydrationBoundary } from "@tanstack/react-query";

<QueryClientProvider client={queryClient}>
  <HydrationBoundary state={dehydrated}>
    <AppRoutes />
  </HydrationBoundary>
</QueryClientProvider>;
```

## Error handling patterns

- Component-level: use `isError` and render context-appropriate messages.
- Global: configure `QueryClient` with callbacks or hook into your toast system in `onError`.
- Mutations: use `onError` for rollback and user feedback.

From this repo:

- `NewPost.jsx` and `PostDetails.jsx` render `ErrorBlock` with server-provided error messages (`error.info?.message`).

## Performance tips and configuration defaults

- Tune `staleTime` per query to reduce over-fetching when data rarely changes.
- Keep query keys small and stable; avoid passing non-serializable values.
- Use `select` to memoize derived data and minimize re-renders.
- Prefer `placeholderData: (prev) => prev` over spinners during paginated navigation.
- Avoid global `retry` for non-idempotent mutations; handle errors explicitly.

Useful defaults (v5):

- Freshness: `staleTime` default is 0 (data becomes stale immediately)
- GC: `gcTime` ~ 5 minutes (query garbage-collects when unused for this time)
- Retries: queries retry 3 times; mutations don’t retry by default

## Testing queries and mutations

High-level approach:

- Wrap test utilities with a `QueryClientProvider` and a fresh `QueryClient` per test file.
- Use `setQueryData` for seeding test data.
- Use MSW to mock network.

Snippet:

```jsx
function createTestClient() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return client;
}

function renderWithClient(ui) {
  const client = createTestClient();
  return render(
    <QueryClientProvider client={client}>{ui}</QueryClientProvider>
  );
}
```

## Recipes from this repo (path-based examples)

- Provider setup: `src/App.jsx` and `src/util/http.js`
- Fetch latest posts: `src/components/Posts/NewPostsSection.jsx`
- Fetch images for a form: `src/components/Posts/PostForm.jsx`
- Search with dependent query: `src/components/Posts/FindPostSection.jsx`
- Post details + delete mutation: `src/components/Posts/PostDetails.jsx`
- Edit with optimistic update + rollback: `src/components/Posts/EditPost.jsx`
- Create new post + invalidate list: `src/components/Posts/NewPost.jsx`

## Run the demo locally

This repo includes a small Express backend and a React + Vite frontend.

Prerequisites:

- Node.js 18+ recommended

1. Install dependencies

```bash
# in the project root (frontend)
npm install

# in the backend folder
cd backend
npm install
```

2. Start the backend API

```bash
cd backend
npm start
# server runs at http://localhost:3000
```

3. Start the frontend

```bash
cd ..
npm run dev
# Vite serves the app; open the printed local URL
```

You can now:

- Browse posts, open details, search, create, edit, and delete.
- Open Devtools (if installed) to inspect query cache, status, and invalidations.

## Frequently asked questions

Q: Should I put form state in TanStack Query?

- No. TanStack Query is for server state. Keep form inputs in component state, and submit with a mutation.

Q: How do I handle authorization headers or base URLs?

- Centralize fetch helpers (see `src/util/http.js`) and read tokens from context or storage. Always pass the `signal` to `fetch` for cancellation.

Q: When should I use `staleTime` vs `gcTime`?

- `staleTime` controls freshness. `gcTime` controls when unused cached data is discarded. Increase `staleTime` when data rarely changes to avoid background refetches.

Q: Is `isLoading` gone in v5?

- v5 introduced `isPending` for the initial fetch and separated `fetchStatus` for background activity. Many people previously used `isLoading`; prefer `isPending` in v5.

## Further reading

- Official docs: https://tanstack.com/query/latest
- Query Keys: https://tanstack.com/query/latest/docs/framework/react/guides/query-keys
- Query Invalidation: https://tanstack.com/query/latest/docs/framework/react/guides/query-invalidation
- Optimistic Updates: https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates
- Infinite Queries: https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries
- SSR/Hydration: https://tanstack.com/query/latest/docs/framework/react/guides/ssr

---

This guide was tailored for TanStack Query v5 and the code in this repository. If you upgrade major versions, review the official migration notes for API changes.
