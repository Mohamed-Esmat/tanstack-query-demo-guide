import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient();

export async function fetchPosts({ signal, searchTerm, max }) {
  let url = "http://localhost:3000/posts";

  if (searchTerm) {
    url += "?search=" + searchTerm;
  }

  // if (searchTerm && max) {
  //   url += "?search=" + searchTerm + "&max=" + max;
  // } else if (searchTerm) {
  //   url += "?search=" + searchTerm;
  // } else if (max) {
  //   url += "?max=" + max;
  // }

  const response = await fetch(url, { signal: signal });

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the posts");
    error.code = response.status;
    error.info = await response.json();
    throw error;
  }

  const { posts } = await response.json();

  return posts;
}

export async function createNewPost(postData) {
  const response = await fetch(`http://localhost:3000/posts`, {
    method: "POST",
    body: JSON.stringify({ post: postData.post }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = new Error("An error occurred while creating the post");
    error.code = response.status;
    error.info = await response.json();
    throw error;
  }

  const { post } = await response.json();

  return post;
}

export async function fetchSelectableImages({ signal }) {
  const response = await fetch(`http://localhost:3000/posts/images`, {
    signal,
  });

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the images");
    error.code = response.status;
    error.info = await response.json();
    throw error;
  }

  const { images } = await response.json();

  return images;
}

export async function fetchPost({ id, signal }) {
  const response = await fetch(`http://localhost:3000/posts/${id}`, { signal });

  if (!response.ok) {
    const error = new Error("An error occurred while fetching the post");
    error.code = response.status;
    error.info = await response.json();
    throw error;
  }

  const { post } = await response.json();

  return post;
}

export async function deletePost({ id }) {
  const response = await fetch(`http://localhost:3000/posts/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    const error = new Error("An error occurred while deleting the post");
    error.code = response.status;
    error.info = await response.json();
    throw error;
  }

  return response.json();
}

export async function updatePost({ id, post }) {
  const response = await fetch(`http://localhost:3000/posts/${id}`, {
    method: "PUT",
    body: JSON.stringify({ post: post }),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = new Error("An error occurred while updating the post");
    error.code = response.status;
    error.info = await response.json();
    throw error;
  }

  return response.json();
}
