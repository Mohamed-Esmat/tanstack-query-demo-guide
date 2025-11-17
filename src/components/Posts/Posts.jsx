import { Link, Outlet } from "react-router-dom";

import Header from "../Header.jsx";
import PostsIntroSection from "./PostsIntroSection.jsx";
import FindPostSection from "./FindPostSection.jsx";
import NewPostsSection from "./NewPostsSection.jsx";

export default function Posts() {
  return (
    <>
      <Outlet />
      <Header>
        <Link to="/posts/new" className="button">
          New Post
        </Link>
      </Header>
      <main>
        <PostsIntroSection />
        <NewPostsSection />
        <FindPostSection />
      </main>
    </>
  );
}
