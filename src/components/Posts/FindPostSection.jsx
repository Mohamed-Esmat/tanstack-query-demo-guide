import { useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { fetchPosts } from "../../util/http.js";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import PostItem from "./PostItem.jsx";

export default function FindPostSection() {
  const searchElement = useRef();
  const [searchTerm, setSearchTerm] = useState();

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["posts", { searchTerm: searchTerm }],
    queryFn: ({ signal }) => fetchPosts({ signal, searchTerm }),
    enabled: searchTerm !== undefined,
    // queryKey: ["posts", { searchTerm: searchTerm }],
    // queryFn: ({ signal, queryKey }) => fetchPosts({ signal, ...queryKey[1] }),
    // enabled: searchTerm !== undefined,
  });

  function handleSubmit(event) {
    event.preventDefault();
    setSearchTerm(searchElement.current.value);
  }

  let content = <p>Please enter a search term to find posts.</p>;

  if (isLoading) {
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
    <section className="content-section" id="all-posts-section">
      <header>
        <h2>Find a post</h2>
        <form onSubmit={handleSubmit} id="search-form">
          <input type="search" placeholder="Search posts" ref={searchElement} />
          <button>Search</button>
        </form>
      </header>
      {content}
    </section>
  );
}
