import { useQuery } from "@tanstack/react-query";

import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import PostItem from "./PostItem.jsx";
import { fetchPosts } from "../../util/http.js";

export default function NewPostsSection() {
  const { data, isPending, isError, error } = useQuery({
    queryKey: ["posts"],
    queryFn: fetchPosts,
    staleTime: 5000,
    // queryKey: ["posts", { max: 3 }],
    // queryFn: ({ signal, queryKey }) => fetchPosts({ signal, ...queryKey[1] }),
    // staleTime: 5000,
    // gcTime: 1000
  });

  let content;

  if (isPending) {
    content = <LoadingIndicator />;
  }

  if (isError) {
    content = (
      <ErrorBlock
        title="An error occurred"
        message={error.info?.message || "Failed to fetch posts."}
      />
    );
  }

  if (data) {
    content = (
      <ul className="posts-list">
        {data.map((post) => (
          <li key={post.id}>
            <PostItem post={post} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <section className="content-section" id="new-posts-section">
      <header>
        <h2>Recently added posts</h2>
      </header>
      {content}
    </section>
  );
}
