import {
  Navigate,
  RouterProvider,
  createBrowserRouter,
} from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";

import Posts from "./components/Posts/Posts.jsx";
import PostDetails from "./components/Posts/PostDetails.jsx";
import NewPost from "./components/Posts/NewPost.jsx";
import EditPost from // loader as editPostLoader,
// action as editPostAction,
"./components/Posts/EditPost.jsx";
import { queryClient } from "./util/http.js";

const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/posts" />,
  },
  {
    path: "/posts",
    element: <Posts />,
    children: [
      {
        path: "/posts/new",
        element: <NewPost />,
      },
    ],
  },
  {
    path: "/posts/:id",
    element: <PostDetails />,
    children: [
      {
        path: "/posts/:id/edit",
        element: <EditPost />,
        // loader: editPostLoader,
        // action: editPostAction,
      },
    ],
  },
]);

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}

export default App;
