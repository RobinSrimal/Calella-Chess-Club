import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { Link, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { PostBlockEditor } from "../components/PostBlockEditor";
import { SiteHeader } from "../components/SiteHeader";
import {
  getCurrentUser,
  type PublicUser,
} from "../lib/account-api";
import {
  type Locale,
  localeFromPathname,
  loginPath,
  memberPostsPath,
} from "../lib/locale";
import {
  canDeletePost,
  canEditPost,
  canUseMemberPosts,
  messageForPostErrorCode,
  sortMemberPosts,
} from "../lib/member-posts-state";
import {
  createPost,
  deletePost,
  listPosts,
  publishPost,
  updatePost,
  type MemberPost,
} from "../lib/post-api";
import {
  emptyPostBody,
  postBodyHasText,
  previewPostBodyText,
  type PostBodyBlock,
  type PostBodyJson,
  type PostInlineContent,
  type PostInlineText,
} from "../lib/post-body";

type MemberPostsCopy = {
  navLogin: string;
  title: string;
  body: string;
  titleLabel: string;
  titlePlaceholder: string;
  bodyLabel: string;
  newDraft: string;
  saveDraft: string;
  saveChanges: string;
  saving: string;
  publish: string;
  publishing: string;
  publishPublicly: string;
  publishPubliclyHint: string;
  deletePost: string;
  deleting: string;
  editPost: string;
  readOnly: string;
  validationRequired: string;
  draftSaved: string;
  postSaved: string;
  postPublished: string;
  postDeleted: string;
  states: {
    loadingSession: string;
    loginRequired: string;
    nonMember: string;
    loadingPosts: string;
    empty: string;
  };
  status: {
    draft: string;
    published: string;
    public: string;
    memberOnly: string;
  };
  fields: {
    author: string;
    updated: string;
    published: string;
    previewFallback: string;
  };
};

const MEMBER_POSTS_COPY: Record<Locale, MemberPostsCopy> = {
  ca: {
    navLogin: "Entrar",
    title: "Posts dels membres",
    body: "Escriu posts amb un títol separat i un cos BlockNote restringit a paràgrafs, negreta, cursiva i enllaços.",
    titleLabel: "Títol",
    titlePlaceholder: "Títol del post",
    bodyLabel: "Cos",
    newDraft: "Nou esborrany",
    saveDraft: "Desar esborrany",
    saveChanges: "Desar canvis",
    saving: "Desant...",
    publish: "Publicar",
    publishing: "Publicant...",
    publishPublicly: "Fer públic a la portada",
    publishPubliclyHint: "Per defecte el post queda només per a membres.",
    deletePost: "Eliminar",
    deleting: "Eliminant...",
    editPost: "Editar post",
    readOnly: "Aquest post és d'un altre membre i només es pot llegir.",
    validationRequired: "Cal afegir un títol i text al cos del post.",
    draftSaved: "Esborrany desat.",
    postSaved: "Canvis desats.",
    postPublished: "Post publicat.",
    postDeleted: "Post eliminat.",
    states: {
      loadingSession: "Comprovant la sessió...",
      loginRequired: "Cal iniciar sessió per escriure posts.",
      nonMember: "Només els socis i administradors poden escriure posts.",
      loadingPosts: "Carregant posts...",
      empty: "Encara no hi ha posts visibles.",
    },
    status: {
      draft: "Esborrany",
      published: "Publicat",
      public: "Portada",
      memberOnly: "Membres",
    },
    fields: {
      author: "Autor",
      updated: "Actualitzat",
      published: "Publicat",
      previewFallback: "Sense previsualització",
    },
  },
  es: {
    navLogin: "Iniciar sesión",
    title: "Posts de miembros",
    body: "Escribe posts con un título separado y un cuerpo BlockNote restringido a párrafos, negrita, cursiva y enlaces.",
    titleLabel: "Título",
    titlePlaceholder: "Título del post",
    bodyLabel: "Cuerpo",
    newDraft: "Nuevo borrador",
    saveDraft: "Guardar borrador",
    saveChanges: "Guardar cambios",
    saving: "Guardando...",
    publish: "Publicar",
    publishing: "Publicando...",
    publishPublicly: "Hacer público en la portada",
    publishPubliclyHint: "Por defecto el post queda solo para miembros.",
    deletePost: "Eliminar",
    deleting: "Eliminando...",
    editPost: "Editar post",
    readOnly: "Este post es de otro miembro y solo se puede leer.",
    validationRequired: "Añade un título y texto al cuerpo del post.",
    draftSaved: "Borrador guardado.",
    postSaved: "Cambios guardados.",
    postPublished: "Post publicado.",
    postDeleted: "Post eliminado.",
    states: {
      loadingSession: "Comprobando la sesión...",
      loginRequired: "Hay que iniciar sesión para escribir posts.",
      nonMember: "Solo los socios y administradores pueden escribir posts.",
      loadingPosts: "Cargando posts...",
      empty: "Todavía no hay posts visibles.",
    },
    status: {
      draft: "Borrador",
      published: "Publicado",
      public: "Portada",
      memberOnly: "Miembros",
    },
    fields: {
      author: "Autor",
      updated: "Actualizado",
      published: "Publicado",
      previewFallback: "Sin vista previa",
    },
  },
  en: {
    navLogin: "Log in",
    title: "Member posts",
    body: "Write posts with a separate title and a BlockNote body restricted to paragraphs, bold, italic, and links.",
    titleLabel: "Title",
    titlePlaceholder: "Post title",
    bodyLabel: "Body",
    newDraft: "New draft",
    saveDraft: "Save draft",
    saveChanges: "Save changes",
    saving: "Saving...",
    publish: "Publish",
    publishing: "Publishing...",
    publishPublicly: "Show on landing page",
    publishPubliclyHint: "Posts stay members-only by default.",
    deletePost: "Delete",
    deleting: "Deleting...",
    editPost: "Edit post",
    readOnly: "This post belongs to another member and is read-only.",
    validationRequired: "Add a title and body text before saving.",
    draftSaved: "Draft saved.",
    postSaved: "Changes saved.",
    postPublished: "Post published.",
    postDeleted: "Post deleted.",
    states: {
      loadingSession: "Checking session...",
      loginRequired: "Log in before writing posts.",
      nonMember: "Only members and admins can write posts.",
      loadingPosts: "Loading posts...",
      empty: "There are no visible posts yet.",
    },
    status: {
      draft: "Draft",
      published: "Published",
      public: "Landing page",
      memberOnly: "Members",
    },
    fields: {
      author: "Author",
      updated: "Updated",
      published: "Published",
      previewFallback: "No preview",
    },
  },
};

type AuthState = "loading" | "login-required" | "non-member" | "ready";
type PostActionState = "" | "saving" | "publishing" | "deleting";

export const meta: MetaFunction<typeof loader> = ({ data }) => [
  {
    title: data ? `${data.copy.title} | Calella Chess Club` : "Member posts",
  },
];

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const locale = localeFromPathname(url.pathname);

  return {
    locale,
    copy: MEMBER_POSTS_COPY[locale],
  };
}

export function shouldPublishPublicly(
  user: PublicUser | null,
  adminMakePublic: boolean,
) {
  return user?.role === "admin" && adminMakePublic;
}

export function mergeChangedPost(posts: MemberPost[], changedPost: MemberPost) {
  if (changedPost.status === "deleted") {
    return removeDeletedPost(posts, changedPost);
  }

  return sortMemberPosts([
    changedPost,
    ...posts.filter((post) => post.id !== changedPost.id && post.status !== "deleted"),
  ]);
}

export function removeDeletedPost(posts: MemberPost[], deletedPost: MemberPost) {
  return sortMemberPosts(
    posts.filter(
      (post) => post.id !== deletedPost.id && post.status !== "deleted",
    ),
  );
}

export default function MemberPostsRoute() {
  const { locale, copy } = useLoaderData<typeof loader>();
  const [authState, setAuthState] = useState<AuthState>("loading");
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(null);
  const [posts, setPosts] = useState<MemberPost[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [bodyJson, setBodyJson] = useState<PostBodyJson>(() => emptyPostBody());
  const [isDirty, setIsDirty] = useState(false);
  const [isLoadingPosts, setIsLoadingPosts] = useState(false);
  const [actionState, setActionState] = useState<PostActionState>("");
  const [adminMakePublic, setAdminMakePublic] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let active = true;

    async function loadCurrentUser() {
      const result = await getCurrentUser();
      if (!active) {
        return;
      }

      if (!result.ok) {
        setAuthState(
          result.code === "API_AUTH_REQUIRED" || result.code === "API_AUTH_INVALID"
            ? "login-required"
            : "non-member",
        );
        setError(messageForPostErrorCode(result.code));
        return;
      }

      if (!canUseMemberPosts(result.data.user)) {
        setAuthState("non-member");
        setError("");
        return;
      }

      setCurrentUser(result.data.user);
      setAuthState("ready");
      setError("");
    }

    void loadCurrentUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (authState !== "ready") {
      return;
    }

    let active = true;

    async function loadMemberPosts() {
      setIsLoadingPosts(true);
      setError("");

      const result = await listPosts();
      if (!active) {
        return;
      }

      setIsLoadingPosts(false);
      if (result.ok) {
        setPosts(sortMemberPosts(result.data.posts));
        return;
      }

      setPosts([]);
      setError(messageForPostErrorCode(result.code));
    }

    void loadMemberPosts();

    return () => {
      active = false;
    };
  }, [authState]);

  const sortedPosts = useMemo(() => sortMemberPosts(posts), [posts]);
  const selectedPost = selectedPostId
    ? posts.find((post) => post.id === selectedPostId) ?? null
    : null;
  const canEditSelectedPost = selectedPost
    ? canEditPost(selectedPost, currentUser)
    : authState === "ready";
  const canDeleteSelectedPost = selectedPost
    ? canDeletePost(selectedPost, currentUser)
    : false;
  const isBusy = actionState !== "";
  const hasValidDraft = title.trim().length > 0 && postBodyHasText(bodyJson);
  const canPublishSelectedPost =
    canEditSelectedPost && (!selectedPost || selectedPost.status === "draft");

  function startNewDraft() {
    setSelectedPostId(null);
    setTitle("");
    setBodyJson(emptyPostBody());
    setAdminMakePublic(false);
    setIsDirty(false);
    setError("");
    setSuccess("");
  }

  function selectPost(post: MemberPost) {
    setSelectedPostId(post.id);
    setTitle(post.title);
    setBodyJson(post.bodyJson.length > 0 ? post.bodyJson : emptyPostBody());
    setAdminMakePublic(false);
    setIsDirty(false);
    setError("");
    setSuccess("");
  }

  function updateTitle(nextTitle: string) {
    setTitle(nextTitle);
    setIsDirty(true);
  }

  function updateBodyJson(nextBodyJson: PostBodyJson) {
    setBodyJson(nextBodyJson);
    setIsDirty(true);
  }

  async function persistCurrentPost() {
    const trimmedTitle = title.trim();
    if (trimmedTitle.length === 0 || !postBodyHasText(bodyJson)) {
      setError(copy.validationRequired);
      setSuccess("");
      return null;
    }

    if (selectedPost && !canEditPost(selectedPost, currentUser)) {
      setError(messageForPostErrorCode("API_FORBIDDEN"));
      setSuccess("");
      return null;
    }

    const input = { title: trimmedTitle, bodyJson };
    const result = selectedPost
      ? await updatePost(selectedPost.id, input)
      : await createPost(input);

    if (!result.ok) {
      setError(messageForPostErrorCode(result.code));
      setSuccess("");
      return null;
    }

    setPosts((current) => mergeChangedPost(current, result.data.post));
    setSelectedPostId(result.data.post.id);
    setTitle(result.data.post.title);
    setBodyJson(
      result.data.post.bodyJson.length > 0
        ? result.data.post.bodyJson
        : emptyPostBody(),
    );
    setIsDirty(false);
    setError("");
    return result.data.post;
  }

  async function handleSaveDraft() {
    setActionState("saving");
    const savedPost = await persistCurrentPost();
    if (savedPost) {
      setSuccess(
        savedPost.status === "published" ? copy.postSaved : copy.draftSaved,
      );
    }
    setActionState("");
  }

  async function handlePublish() {
    if (!canPublishSelectedPost) {
      return;
    }

    setActionState("publishing");
    const savedPost = await persistCurrentPost();
    if (!savedPost || savedPost.status !== "draft") {
      setActionState("");
      return;
    }

    const result = await publishPost(savedPost.id, {
      makePublic: shouldPublishPublicly(currentUser, adminMakePublic),
    });

    if (result.ok) {
      setPosts((current) => mergeChangedPost(current, result.data.post));
      setSelectedPostId(result.data.post.id);
      setTitle(result.data.post.title);
      setBodyJson(
        result.data.post.bodyJson.length > 0
          ? result.data.post.bodyJson
          : emptyPostBody(),
      );
      setAdminMakePublic(false);
      setIsDirty(false);
      setError("");
      setSuccess(copy.postPublished);
    } else {
      setError(messageForPostErrorCode(result.code));
      setSuccess("");
    }

    setActionState("");
  }

  async function handleDelete() {
    if (!selectedPost || !canDeletePost(selectedPost, currentUser)) {
      return;
    }

    setActionState("deleting");
    setError("");
    setSuccess("");

    const result = await deletePost(selectedPost.id);
    if (result.ok) {
      setPosts((current) => removeDeletedPost(current, result.data.post));
      setSelectedPostId(null);
      setTitle("");
      setBodyJson(emptyPostBody());
      setAdminMakePublic(false);
      setIsDirty(false);
      setSuccess(copy.postDeleted);
    } else {
      setError(messageForPostErrorCode(result.code));
    }

    setActionState("");
  }

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-stone-950">
      <SiteHeader
        activeSection="member"
        languagePath={memberPostsPath}
        locale={locale}
      />

      <section className="mx-auto max-w-6xl px-5 py-8 md:py-12">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
          Calella Chess Club
        </p>
        <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
          {copy.title}
        </h1>
        <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
          {copy.body}
        </p>

        <MemberPostsStateMessage
          authState={authState}
          copy={copy}
          error={error}
          locale={locale}
        />

        {authState === "ready" && currentUser ? (
          <div className="mt-8 grid gap-5 lg:grid-cols-[360px_1fr]">
            <aside className="rounded border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-stone-950">
                  {copy.title}
                </h2>
                <button
                  className="rounded bg-stone-950 px-3 py-2 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-500"
                  disabled={isBusy}
                  onClick={startNewDraft}
                  type="button"
                >
                  {copy.newDraft}
                </button>
              </div>

              {isLoadingPosts ? (
                <p className="mt-4 rounded border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  {copy.states.loadingPosts}
                </p>
              ) : null}

              {!isLoadingPosts && sortedPosts.length === 0 ? (
                <p className="mt-4 rounded border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                  {copy.states.empty}
                </p>
              ) : null}

              <div className="mt-4 grid gap-3">
                {sortedPosts.map((post) => (
                  <button
                    className={`rounded border p-3 text-left transition ${
                      post.id === selectedPostId
                        ? "border-emerald-700 bg-emerald-50"
                        : "border-stone-200 bg-white hover:border-stone-300 hover:bg-stone-50"
                    }`}
                    key={post.id}
                    onClick={() => selectPost(post)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="min-w-0 flex-1 text-sm font-semibold text-stone-950">
                        {post.title}
                      </h3>
                      <PostStatusBadges copy={copy} post={post} />
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-stone-600">
                      {previewPostBodyText(post.bodyJson) ||
                        copy.fields.previewFallback}
                    </p>
                    <p className="mt-2 text-xs text-stone-500">
                      {copy.fields.author}: {post.authorUsername}
                    </p>
                  </button>
                ))}
              </div>
            </aside>

            <div className="rounded border border-stone-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
                    {selectedPost ? copy.editPost : copy.newDraft}
                  </p>
                  {selectedPost ? (
                    <p className="mt-1 text-sm text-stone-600">
                      {copy.fields.updated}:{" "}
                      {formatDisplayDate(selectedPost.updatedAt)}
                    </p>
                  ) : null}
                </div>
                {selectedPost ? (
                  <PostStatusBadges copy={copy} post={selectedPost} />
                ) : null}
              </div>

              {success ? (
                <p className="mt-4 rounded border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800">
                  {success}
                </p>
              ) : null}

              {error ? (
                <p className="mt-4 rounded border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
                  {error}
                </p>
              ) : null}

              {canEditSelectedPost ? (
                <div className="mt-5 grid gap-4">
                  <label className="grid gap-2 text-sm font-semibold text-stone-800">
                    {copy.titleLabel}
                    <input
                      className="rounded border border-stone-300 px-3 py-2.5 text-base font-normal text-stone-950 outline-none focus:border-emerald-700"
                      disabled={isBusy}
                      onChange={(event) => updateTitle(event.currentTarget.value)}
                      placeholder={copy.titlePlaceholder}
                      type="text"
                      value={title}
                    />
                  </label>

                  <div className="grid gap-2">
                    <p className="text-sm font-semibold text-stone-800">
                      {copy.bodyLabel}
                    </p>
                    <div className="member-post-editor">
                      <PostBlockEditor
                        bodyJson={bodyJson}
                        key={selectedPostId ?? "new-draft"}
                        onChange={updateBodyJson}
                      />
                    </div>
                  </div>

                  {currentUser.role === "admin" && canPublishSelectedPost ? (
                    <label className="flex items-start gap-3 rounded border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                      <input
                        checked={adminMakePublic}
                        className="mt-1"
                        disabled={isBusy}
                        onChange={(event) =>
                          setAdminMakePublic(event.currentTarget.checked)
                        }
                        type="checkbox"
                      />
                      <span>
                        <span className="block font-semibold text-stone-950">
                          {copy.publishPublicly}
                        </span>
                        <span>{copy.publishPubliclyHint}</span>
                      </span>
                    </label>
                  ) : null}

                  <div className="flex flex-wrap gap-3">
                    <button
                      className="rounded bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800 disabled:cursor-not-allowed disabled:bg-stone-500"
                      disabled={isBusy || !hasValidDraft}
                      onClick={handleSaveDraft}
                      type="button"
                    >
                      {actionState === "saving"
                        ? copy.saving
                        : selectedPost?.status === "published"
                          ? copy.saveChanges
                          : copy.saveDraft}
                    </button>
                    {canPublishSelectedPost ? (
                      <button
                        className="rounded border border-emerald-700 bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:border-emerald-500 disabled:bg-emerald-500"
                        disabled={isBusy || !hasValidDraft}
                        onClick={handlePublish}
                        type="button"
                      >
                        {actionState === "publishing"
                          ? copy.publishing
                          : copy.publish}
                      </button>
                    ) : null}
                    {selectedPost ? (
                      <button
                        className="rounded border border-red-200 bg-white px-4 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:cursor-not-allowed disabled:text-red-300"
                        disabled={isBusy || !canDeleteSelectedPost}
                        onClick={handleDelete}
                        type="button"
                      >
                        {actionState === "deleting"
                          ? copy.deleting
                          : copy.deletePost}
                      </button>
                    ) : null}
                    {isDirty ? (
                      <span className="self-center text-sm text-stone-500">
                        *
                      </span>
                    ) : null}
                  </div>
                </div>
              ) : (
                <div className="mt-5">
                  <p className="rounded border border-stone-200 bg-stone-50 px-3 py-2 text-sm text-stone-700">
                    {copy.readOnly}
                  </p>
                  {selectedPost ? (
                    <PostBodyPreview bodyJson={selectedPost.bodyJson} />
                  ) : null}
                </div>
              )}
            </div>
          </div>
        ) : null}
      </section>
    </main>
  );
}

function MemberPostsStateMessage({
  authState,
  copy,
  error,
  locale,
}: {
  authState: AuthState;
  copy: MemberPostsCopy;
  error: string;
  locale: Locale;
}) {
  if (authState === "ready") {
    return null;
  }

  const message =
    authState === "loading"
      ? copy.states.loadingSession
      : authState === "login-required"
        ? error || copy.states.loginRequired
        : error || copy.states.nonMember;

  return (
    <div className="mt-7 rounded border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
      <p>{message}</p>
      {authState === "login-required" ? (
        <Link
          className="mt-3 inline-flex rounded bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
          to={loginPath(locale)}
        >
          {copy.navLogin}
        </Link>
      ) : null}
    </div>
  );
}

function PostStatusBadges({
  copy,
  post,
}: {
  copy: MemberPostsCopy;
  post: MemberPost;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      <Badge tone={post.status === "draft" ? "amber" : "emerald"}>
        {post.status === "draft" ? copy.status.draft : copy.status.published}
      </Badge>
      {post.status === "published" ? (
        <Badge tone={post.isPublic ? "stone" : "sky"}>
          {post.isPublic ? copy.status.public : copy.status.memberOnly}
        </Badge>
      ) : null}
    </div>
  );
}

function Badge({
  children,
  tone,
}: {
  children: ReactNode;
  tone: "amber" | "emerald" | "sky" | "stone";
}) {
  const classes = {
    amber: "border-amber-200 bg-amber-50 text-amber-800",
    emerald: "border-emerald-200 bg-emerald-50 text-emerald-800",
    sky: "border-sky-200 bg-sky-50 text-sky-800",
    stone: "border-stone-200 bg-stone-100 text-stone-700",
  };

  return (
    <span
      className={`inline-flex rounded border px-2 py-0.5 text-xs font-semibold ${classes[tone]}`}
    >
      {children}
    </span>
  );
}

function PostBodyPreview({ bodyJson }: { bodyJson: PostBodyJson }) {
  return (
    <div className="mt-4 grid gap-3 rounded border border-stone-200 bg-stone-50 p-4 text-stone-800">
      {bodyJson.map((block, blockIndex) =>
        isParagraphBlock(block) ? (
          <p className="leading-7" key={block.id ?? blockIndex}>
            {renderInlineContent(block.content, blockIndex)}
          </p>
        ) : null,
      )}
    </div>
  );
}

function renderInlineContent(
  content: PostBodyBlock["content"],
  blockIndex: number,
) {
  if (typeof content === "string") {
    return content;
  }

  return content.map((inline, inlineIndex) =>
    renderInline(inline, `${blockIndex}:${inlineIndex}`),
  );
}

function renderInline(inline: PostInlineContent, key: string): ReactNode {
  if (inline.type === "link") {
    return (
      <a
        className="font-medium text-emerald-800 underline underline-offset-2"
        href={inline.href}
        key={key}
        rel="noreferrer"
        target="_blank"
      >
        {inline.content.map((text, index) =>
          renderTextInline(text, `${key}:link:${index}`),
        )}
      </a>
    );
  }

  return renderTextInline(inline, key);
}

function renderTextInline(inline: PostInlineText, key: string): ReactNode {
  let node: ReactNode = inline.text;
  if (inline.styles.italic) {
    node = <em>{node}</em>;
  }
  if (inline.styles.bold) {
    node = <strong>{node}</strong>;
  }

  return <span key={key}>{node}</span>;
}

function isParagraphBlock(block: PostBodyJson[number]): block is PostBodyBlock {
  return block.type === "paragraph" && "content" in block;
}

function formatDisplayDate(value: string) {
  return value.slice(0, 10);
}
