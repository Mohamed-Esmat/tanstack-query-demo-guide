import fs from "node:fs/promises";

import bodyParser from "body-parser";
import express from "express";

const app = express();

app.use(bodyParser.json());
app.use(express.static("public"));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-Requested-With,content-type"
  );
  next();
});

app.get("/posts", async (req, res) => {
  const { max, search } = req.query;
  const postsFileContent = await fs.readFile("./data/posts.json");
  let posts = JSON.parse(postsFileContent);

  if (search) {
    posts = posts.filter((post) => {
      const searchableText = `${post.title} ${post.description} ${post.location}`;
      return searchableText.toLowerCase().includes(search.toLowerCase());
    });
  }

  if (max) {
    posts = posts.slice(posts.length - max, posts.length);
  }

  res.json({
    posts: posts.map((post) => ({
      id: post.id,
      title: post.title,
      image: post.image,
      date: post.date,
      location: post.location,
    })),
  });
});

app.get("/posts/images", async (req, res) => {
  const imagesFileContent = await fs.readFile("./data/images.json");
  const images = JSON.parse(imagesFileContent);

  res.json({ images });
});

app.get("/posts/:id", async (req, res) => {
  const { id } = req.params;

  const postsFileContent = await fs.readFile("./data/posts.json");
  const posts = JSON.parse(postsFileContent);

  const post = posts.find((post) => post.id === id);

  if (!post) {
    return res
      .status(404)
      .json({ message: `For the id ${id}, no post could be found.` });
  }

  setTimeout(() => {
    res.json({ post });
  }, 1000);
});

app.post("/posts", async (req, res) => {
  const { post } = req.body;

  if (!post) {
    return res.status(400).json({ message: "Post is required" });
  }

  console.log(post);

  if (
    !post.title?.trim() ||
    !post.description?.trim() ||
    !post.date?.trim() ||
    !post.time?.trim() ||
    !post.image?.trim() ||
    !post.location?.trim()
  ) {
    return res.status(400).json({ message: "Invalid data provided." });
  }

  const postsFileContent = await fs.readFile("./data/posts.json");
  const posts = JSON.parse(postsFileContent);

  const newPost = {
    id: Math.round(Math.random() * 10000).toString(),
    ...post,
  };

  posts.push(newPost);

  await fs.writeFile("./data/posts.json", JSON.stringify(posts));

  res.json({ post: newPost });
});

app.put("/posts/:id", async (req, res) => {
  const { id } = req.params;
  const { post } = req.body;

  if (!post) {
    return res.status(400).json({ message: "Post is required" });
  }

  if (
    !post.title?.trim() ||
    !post.description?.trim() ||
    !post.date?.trim() ||
    !post.time?.trim() ||
    !post.image?.trim() ||
    !post.location?.trim()
  ) {
    return res.status(400).json({ message: "Invalid data provided." });
  }

  const postsFileContent = await fs.readFile("./data/posts.json");
  const posts = JSON.parse(postsFileContent);

  const postIndex = posts.findIndex((post) => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ message: "Post not found" });
  }

  posts[postIndex] = {
    id,
    ...post,
  };

  await fs.writeFile("./data/posts.json", JSON.stringify(posts));

  setTimeout(() => {
    res.json({ post: posts[postIndex] });
  }, 1000);
});

app.delete("/posts/:id", async (req, res) => {
  const { id } = req.params;

  const postsFileContent = await fs.readFile("./data/posts.json");
  const posts = JSON.parse(postsFileContent);

  const postIndex = posts.findIndex((post) => post.id === id);

  if (postIndex === -1) {
    return res.status(404).json({ message: "Post not found" });
  }

  posts.splice(postIndex, 1);

  await fs.writeFile("./data/posts.json", JSON.stringify(posts));

  setTimeout(() => {
    res.json({ message: "Post deleted" });
  }, 1000);
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});
