import { Link, useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";

import Modal from "../UI/Modal.jsx";
import PostForm from "./PostForm.jsx";
import { createNewPost } from "../../util/http.js";
import ErrorBlock from "../UI/ErrorBlock.jsx";
import { queryClient } from "../../util/http.js";

export default function NewPost() {
  const navigate = useNavigate();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: createNewPost,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posts"] });
      navigate("/posts");
    },
  });

  function handleSubmit(formData) {
    mutate({ post: formData });
  }

  return (
    <Modal onClose={() => navigate("../")}>
      <PostForm onSubmit={handleSubmit}>
        {isPending && "Submitting..."}
        {!isPending && (
          <>
            <Link to="../" className="button-text">
              Cancel
            </Link>
            <button type="submit" className="button">
              Create
            </button>
          </>
        )}
      </PostForm>
      {isError && (
        <ErrorBlock
          title="Failed to create post"
          message={
            error.info?.message ||
            "Failed to create post. Please check your inputs and try again later."
          }
        />
      )}
    </Modal>
  );
}
