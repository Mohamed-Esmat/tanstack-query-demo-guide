import {
  Link,
  // redirect,
  useNavigate,
  useParams,
  // useSubmit,
  // useNavigation,
} from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
import PostForm from "./PostForm.jsx";
import { fetchPost, updatePost, queryClient } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import LoadingIndicator from "../UI/LoadingIndicator.jsx";

export default function EditPost() {
  const navigate = useNavigate();
  // const { state } = useNavigation();
  // const submit = useSubmit();
  const params = useParams();

  const { data, isPending, isError, error } = useQuery({
    queryKey: ["posts", params.id],
    queryFn: ({ signal }) => fetchPost({ signal, id: params.id }),
    staleTime: 10000,
  });

  const { mutate } = useMutation({
    mutationFn: updatePost,
    onMutate: async (data) => {
      const newPost = data.post;

      await queryClient.cancelQueries({ queryKey: ["posts", params.id] });
      const previousPost = queryClient.getQueryData(["posts", params.id]);

      queryClient.setQueryData(["posts", params.id], newPost);

      return { previousPost };
    },
    onError: (error, data, context) => {
      queryClient.setQueryData(["posts", params.id], context.previousPost);
    },
    onSettled: () => {
      queryClient.invalidateQueries(["posts", params.id]);
    },
  });

  function handleSubmit(formData) {
    mutate({ id: params.id, post: formData });
    navigate("../");
    // submit(formData, { method: "PUT" });
  }

  function handleClose() {
    navigate("../");
  }

  let content;

  if (isPending) {
    content = (
      <div className="center">
        <LoadingIndicator />
      </div>
    );
  }

  if (isError) {
    content = (
      <>
        <ErrorBlock
          title="Failed to load post"
          message={
            error.info?.message ||
            "Failed to load post. Please check your inputs and try again later."
          }
        />
        <div className="form-actions">
          <Link to="../" className="button">
            Okay
          </Link>
        </div>
      </>
    );
  }

  if (data) {
    content = (
      <PostForm inputData={data} onSubmit={handleSubmit}>
        <Link to="../" className="button-text">
          Cancel
        </Link>
        <button type="submit" className="button">
          Update
        </button>

        {/* {state === "submitting" ? (
          <p>Sending data...</p>
        ) : (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Update
            </button>
          </>
        )} */}
      </PostForm>
    );
  }

  return <Modal onClose={handleClose}>{content}</Modal>;
}

// export function loader({ params }) {
//   return queryClient.fetchQuery({
//     queryKey: ["posts", params.id],
//     queryFn: ({ signal }) => fetchPost({ signal, id: params.id }),
//   });
// }

// export async function action({ request, params }) {
//   const formData = await request.formData();
//   const updatedPostData = Object.fromEntries(formData);
//   await updatePost({ id: params.id, post: updatedPostData });
//   await queryClient.invalidateQueries(["posts"]);
//   return redirect("../");
// }
