import { Link } from "react-router-dom";

import meetupImg from "../../assets/meetup.jpg";

export default function PostsIntroSection() {
  return (
    <section
      className="content-section"
      id="overview-section"
      style={{ backgroundImage: `url(${meetupImg})` }}
    >
      <h2>
        Share your ideas, stories, <br />
        and <strong>discover fresh posts</strong>
      </h2>
      <p>Anyone can write and explore posts on React Posts!</p>
      <p>
        <Link to="/posts/new" className="button">
          Create your first post
        </Link>
      </p>
    </section>
  );
}
