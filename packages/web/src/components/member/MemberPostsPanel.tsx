import { useEffect, useMemo, useState } from "react";
import { PostBlockEditor } from "../editor/PostBlockEditor";
import {
  createPost,
  deletePost,
  getCurrentUser,
  listPosts,
  publishPost,
  updatePost,
  type MemberPost,
} from "../../lib/browser-api";
import type { Locale } from "../../lib/locale";
import {
  emptyPostBody,
  postBodyHasText,
  type PostBodyJson,
  type PostEditorDocument,
} from "../../lib/post-body";
import {
  canUseMemberPosts,
  messageForPostErrorCode,
  postStatusLabel,
  visibleMemberPosts,
  withMemberPostTitle,
} from "./member-posts-state";

type MemberPostsLabels = {
  loading: string;
  empty: string;
  newDraft: string;
  title: string;
  titlePlaceholder: string;
  body: string;
  saveDraft: string;
  saving: string;
  publish: string;
  publishing: string;
  delete: string;
  deleting: string;
  draftStatus: string;
  publishedStatus: string;
  memberOnlyVisibility: string;
  savedSuccess: string;
  publishedSuccess: string;
  deletedSuccess: string;
  loginRequired: string;
  memberApprovalRequired: string;
  openPost: string;
};

type MemberPostsPanelProps = {
  locale: Locale;
  labels: MemberPostsLabels;
};

type AccessState = "loading" | "login-required" | "approval-required" | "ready";
type Operation = "idle" | "loading" | "saving" | "publishing" | "deleting";

type EditorState = {
  key: string;
  postId?: string;
  status: MemberPost["status"];
  title: string;
  bodyJson: PostEditorDocument;
  initialContent: PostBodyJson;
};

export function MemberPostsPanel({ locale, labels }: MemberPostsPanelProps) {
  const [accessState, setAccessState] = useState<AccessState>("loading");
  const [operation, setOperation] = useState<Operation>("loading");
  const [posts, setPosts] = useState<MemberPost[]>([]);
  const [editorState, setEditorState] = useState<EditorState>();
  const [message, setMessage] = useState<string>();
  const [error, setError] = useState<string>();

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setOperation("loading");
      const meResult = await getCurrentUser();
      if (!isMounted) {
        return;
      }

      if (!meResult.ok) {
        setOperation("idle");
        if (meResult.status === 401 || meResult.status === 403) {
          setAccessState("login-required");
          return;
        }
        setAccessState("login-required");
        setError(messageForPostErrorCode(meResult.code));
        return;
      }

      if (!canUseMemberPosts(meResult.data.user)) {
        setOperation("idle");
        setAccessState("approval-required");
        return;
      }

      const postsResult = await listPosts();
      if (!isMounted) {
        return;
      }

      setOperation("idle");
      setAccessState("ready");

      if (!postsResult.ok) {
        setError(messageForPostErrorCode(postsResult.code));
        return;
      }

      const visiblePosts = visibleMemberPosts(postsResult.data.posts);
      setPosts(visiblePosts);
      if (visiblePosts.length > 0) {
        startEditingPost(visiblePosts[0]);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  const canSave = useMemo(
    () =>
      operation === "idle" &&
      editorState !== undefined &&
      editorState.title.trim().length > 0 &&
      postBodyHasText(editorState.bodyJson),
    [editorState, operation],
  );

  function startNewDraft() {
    const bodyJson = emptyPostBody();
    setMessage(undefined);
    setError(undefined);
    setEditorState({
      key: `new-${Date.now()}`,
      status: "draft",
      title: "",
      bodyJson,
      initialContent: bodyJson,
    });
  }

  function startEditingPost(post: MemberPost) {
    setMessage(undefined);
    setError(undefined);
    setEditorState({
      key: post.id,
      postId: post.id,
      status: post.status,
      title: post.title,
      bodyJson: post.bodyJson,
      initialContent: post.bodyJson,
    });
  }

  async function persistCurrentPost(): Promise<MemberPost | undefined> {
    if (!editorState) {
      return undefined;
    }

    const input = {
      title: editorState.title,
      bodyJson: editorState.bodyJson,
    };
    const result = editorState.postId
      ? await updatePost(editorState.postId, input)
      : await createPost(input);

    if (!result.ok) {
      setError(messageForPostErrorCode(result.code));
      return undefined;
    }

    upsertPost(result.data.post);
    setEditorStateFromPost(result.data.post);
    return result.data.post;
  }

  async function saveDraft() {
    if (!canSave) {
      return;
    }

    setOperation("saving");
    setMessage(undefined);
    setError(undefined);
    const saved = await persistCurrentPost();
    setOperation("idle");

    if (saved) {
      setMessage(labels.savedSuccess);
    }
  }

  async function publishDraft() {
    if (!canSave) {
      return;
    }

    setOperation("publishing");
    setMessage(undefined);
    setError(undefined);
    const saved = await persistCurrentPost();
    if (!saved) {
      setOperation("idle");
      return;
    }

    const result = await publishPost(saved.id);
    setOperation("idle");

    if (!result.ok) {
      setError(messageForPostErrorCode(result.code));
      return;
    }

    upsertPost(result.data.post);
    setEditorStateFromPost(result.data.post);
    setMessage(labels.publishedSuccess);
  }

  async function removePost() {
    if (!editorState?.postId || operation !== "idle") {
      return;
    }

    setOperation("deleting");
    setMessage(undefined);
    setError(undefined);
    const result = await deletePost(editorState.postId);
    setOperation("idle");

    if (!result.ok) {
      setError(messageForPostErrorCode(result.code));
      return;
    }

    const nextPosts = visibleMemberPosts(
      posts.filter((post) => post.id !== result.data.post.id),
    );
    setPosts(nextPosts);
    setEditorState(nextPosts.length > 0 ? editorStateFromPost(nextPosts[0]) : undefined);
    setMessage(labels.deletedSuccess);
  }

  function upsertPost(post: MemberPost) {
    setPosts((current) =>
      visibleMemberPosts([
        post,
        ...current.filter((existing) => existing.id !== post.id),
      ]),
    );
  }

  function setEditorStateFromPost(post: MemberPost) {
    setEditorState(editorStateFromPost(post));
  }

  function editorStateFromPost(post: MemberPost): EditorState {
    return {
      key: `${post.id}-${post.updatedAt}`,
      postId: post.id,
      status: post.status,
      title: post.title,
      bodyJson: post.bodyJson,
      initialContent: post.bodyJson,
    };
  }

  if (accessState === "loading") {
    return (
      <section className="member-posts-panel panel" aria-live="polite">
        <p>{labels.loading}</p>
      </section>
    );
  }

  if (accessState === "login-required") {
    return (
      <section className="member-posts-panel panel">
        <p>{labels.loginRequired}</p>
        <a className="button-link" href={`/${locale}/login`}>
          {labels.loginRequired}
        </a>
        {error ? (
          <p className="form-message error" role="alert">
            {error}
          </p>
        ) : null}
      </section>
    );
  }

  if (accessState === "approval-required") {
    return (
      <section className="member-posts-panel panel">
        <p>{labels.memberApprovalRequired}</p>
      </section>
    );
  }

  return (
    <section className="member-posts-panel">
      <div className="member-posts-toolbar">
        <button className="button-link" type="button" onClick={startNewDraft}>
          {labels.newDraft}
        </button>
      </div>

      {message ? (
        <p className="form-message success" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="form-message error" role="alert">
          {error}
        </p>
      ) : null}

      <div className="member-posts-grid">
        <aside className="member-posts-list panel" aria-label={labels.openPost}>
          {posts.length > 0 ? (
            <ul>
              {posts.map((post) => (
                <li key={post.id}>
                  <button
                    type="button"
                    className="member-posts-list-button"
                    aria-current={editorState?.postId === post.id ? "true" : undefined}
                    onClick={() => startEditingPost(post)}
                  >
                    <span>{post.title}</span>
                    <small>
                      {postStatusLabel(post, labels)} · {labels.memberOnlyVisibility}
                    </small>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p>{labels.empty}</p>
          )}
        </aside>

        <div className="member-posts-editor panel">
          {editorState ? (
            <form className="field-stack" onSubmit={(event) => event.preventDefault()}>
              <label>
                {labels.title}
                <input
                  name="title"
                  value={editorState.title}
                  placeholder={labels.titlePlaceholder}
                  maxLength={120}
                  onChange={(event) => {
                    const title = event.currentTarget.value;
                    setEditorState((current) => withMemberPostTitle(current, title));
                  }}
                  required
                />
              </label>

              <label className="post-editor-label">
                {labels.body}
                <PostBlockEditor
                  key={editorState.key}
                  initialContent={editorState.initialContent}
                  editable={operation === "idle"}
                  onChange={(document) =>
                    setEditorState((current) =>
                      current ? { ...current, bodyJson: document } : current,
                    )
                  }
                />
              </label>

              <p className="feed-meta">
                <span>{postStatusLabel(editorState, labels)}</span>
                <span>{labels.memberOnlyVisibility}</span>
              </p>

              <div className="member-posts-actions">
                <button
                  className="button-link"
                  type="button"
                  disabled={!canSave}
                  onClick={saveDraft}
                >
                  {operation === "saving" ? labels.saving : labels.saveDraft}
                </button>
                <button
                  className="button-link"
                  type="button"
                  disabled={!canSave}
                  onClick={publishDraft}
                >
                  {operation === "publishing" ? labels.publishing : labels.publish}
                </button>
                {editorState.postId ? (
                  <button
                    className="button-link danger"
                    type="button"
                    disabled={operation !== "idle"}
                    onClick={removePost}
                  >
                    {operation === "deleting" ? labels.deleting : labels.delete}
                  </button>
                ) : null}
              </div>
            </form>
          ) : (
            <p>{labels.empty}</p>
          )}
        </div>
      </div>
    </section>
  );
}
