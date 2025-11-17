import { Link } from "react-router-dom";

export default function PostItem({ post }) {
  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  return (
    <article className="post-item">
      <img src={`http://localhost:3000/${post.image}`} alt={post.title} />
      <div className="post-item-content">
        <div>
          <h2>{post.title}</h2>
          <p className="post-item-date">{formattedDate}</p>
          <p className="post-item-location">{post.location}</p>
        </div>
        <p>
          <Link to={`/posts/${post.id}`} className="button">
            View Details
          </Link>
        </p>
      </div>
    </article>
  );
}
