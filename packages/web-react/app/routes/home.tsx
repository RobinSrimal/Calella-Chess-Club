import { useEffect, useState } from "react";
import { Link, redirect, useLoaderData } from "react-router";
import type { LoaderFunctionArgs, MetaFunction } from "react-router";
import { SiteHeader } from "../components/SiteHeader";
import {
  DEFAULT_LOCALE,
  type Locale,
  type ShellSection,
  adminUsersPath,
  localePath,
  memberPostsPath,
  resolveLocale,
  routeSectionFromPathname,
} from "../lib/locale";
import {
  listPublicPosts,
  type PublicPost,
} from "../lib/public-content-api";
import { previewPostBodyText } from "../lib/post-body";

type FeatureCopy = {
  title: string;
  body: string;
};

type Copy = {
  eyebrow: string;
  title: string;
  body: string;
  clubIntroTitle: string;
  clubIntroBody: string;
  featuresTitle: string;
  features: FeatureCopy[];
  membershipTitle: string;
  membershipBody: string;
  membershipNote: string;
  publicPostsTitle: string;
  publicPostsBody: string;
  publicPostsLoading: string;
  publicPostsEmpty: string;
  publicPostsAuthor: string;
  publicPostsPublished: string;
  adminUsersCta: string;
  memberPostsCta: string;
  memberShellTitle: string;
  memberShellBody: string;
  adminShellTitle: string;
  adminShellBody: string;
};

const COPY: Record<Locale, Copy> = {
  ca: {
    eyebrow: "Club d'Escacs Calella",
    title: "Escacs, formació i competició a Calella",
    body: "Un espai setmanal per jugar partides, aprendre amb altres socis i compartir l'activitat del club.",
    clubIntroTitle: "Un club obert al tauler",
    clubIntroBody:
      "El club reuneix jugadors de diferents nivells per practicar escacs en un ambient proper. Les sessions combinen partides amistoses, anàlisi, preparació i trobades per seguir creixent com a comunitat.",
    featuresTitle: "Activitat del club",
    features: [
      {
        title: "Partides i anàlisi",
        body: "Espais de joc informal i revisió de partides per millorar decisions, plans i finals.",
      },
      {
        title: "Formació per començar",
        body: "Acollida per a persones que volen aprendre les bases o recuperar el ritme davant del tauler.",
      },
      {
        title: "Competició local",
        body: "Preparació per a equips, tornejos interns i activitats competitives quan el calendari ho permet.",
      },
    ],
    membershipTitle: "Fer-se soci",
    membershipBody:
      "El registre crea un compte i envia una sol·licitud de soci. Un administrador revisa la petició abans d'obrir l'accés complet a l'àrea de membres.",
    membershipNote:
      "Les dades concretes de quotes, horaris i activitats oficials es publicaran quan el club les confirmi.",
    publicPostsTitle: "Notícies del club",
    publicPostsBody:
      "Aquí apareixeran els posts aprovats pels administradors per a la portada.",
    publicPostsLoading: "Carregant notícies...",
    publicPostsEmpty: "Encara no hi ha notícies aprovades per a la portada.",
    publicPostsAuthor: "Autor",
    publicPostsPublished: "Publicat",
    adminUsersCta: "Gestionar usuaris",
    memberPostsCta: "Escriure posts",
    memberShellTitle: "Àrea de membres",
    memberShellBody:
      "Des d'aquí els socis poden accedir als fluxos interns del club.",
    adminShellTitle: "Administració",
    adminShellBody:
      "Des d'aquí els administradors poden gestionar comptes i contingut del club.",
  },
  es: {
    eyebrow: "Club de Ajedrez Calella",
    title: "Ajedrez, formación y competición en Calella",
    body: "Un espacio semanal para jugar partidas, aprender con otros socios y compartir la actividad del club.",
    clubIntroTitle: "Un club abierto al tablero",
    clubIntroBody:
      "El club reúne a jugadores de distintos niveles para practicar ajedrez en un ambiente cercano. Las sesiones combinan partidas amistosas, análisis, preparación y encuentros para seguir creciendo como comunidad.",
    featuresTitle: "Actividad del club",
    features: [
      {
        title: "Partidas y análisis",
        body: "Espacios de juego informal y revisión de partidas para mejorar decisiones, planes y finales.",
      },
      {
        title: "Formación para empezar",
        body: "Acogida para personas que quieren aprender las bases o recuperar el ritmo delante del tablero.",
      },
      {
        title: "Competición local",
        body: "Preparación para equipos, torneos internos y actividades competitivas cuando el calendario lo permite.",
      },
    ],
    membershipTitle: "Hacerse socio",
    membershipBody:
      "El registro crea una cuenta y envía una solicitud de socio. Un administrador revisa la petición antes de abrir el acceso completo al área de miembros.",
    membershipNote:
      "Los datos concretos de cuotas, horarios y actividades oficiales se publicarán cuando el club los confirme.",
    publicPostsTitle: "Noticias del club",
    publicPostsBody:
      "Aquí aparecerán los posts aprobados por los administradores para la portada.",
    publicPostsLoading: "Cargando noticias...",
    publicPostsEmpty: "Todavía no hay noticias aprobadas para la portada.",
    publicPostsAuthor: "Autor",
    publicPostsPublished: "Publicado",
    adminUsersCta: "Gestionar usuarios",
    memberPostsCta: "Escribir posts",
    memberShellTitle: "Área de miembros",
    memberShellBody:
      "Desde aquí los socios pueden acceder a los flujos internos del club.",
    adminShellTitle: "Administración",
    adminShellBody:
      "Desde aquí los administradores pueden gestionar cuentas y contenido del club.",
  },
  en: {
    eyebrow: "Calella Chess Club",
    title: "Chess, training, and competition in Calella",
    body: "A weekly place to play games, learn with other members, and follow the activity of the club.",
    clubIntroTitle: "A club around the board",
    clubIntroBody:
      "The club brings together players at different levels to practise chess in a welcoming setting. Sessions combine casual games, analysis, preparation, and member gatherings.",
    featuresTitle: "Club Activity",
    features: [
      {
        title: "Games and analysis",
        body: "Informal play and post-game review for improving decisions, plans, and endgames.",
      },
      {
        title: "Beginner-friendly training",
        body: "A place for people who want to learn the basics or get comfortable at the board again.",
      },
      {
        title: "Local competition",
        body: "Preparation for teams, internal tournaments, and competitive activity when the calendar allows.",
      },
    ],
    membershipTitle: "Becoming a member",
    membershipBody:
      "Registration creates an account and sends a membership request. An admin reviews the request before opening full member-area access.",
    membershipNote:
      "Specific details about fees, hours, and official activities will be published once the club confirms them.",
    publicPostsTitle: "Club News",
    publicPostsBody:
      "Admin-approved public posts will appear here on the landing page.",
    publicPostsLoading: "Loading news...",
    publicPostsEmpty: "No posts have been approved for the landing page yet.",
    publicPostsAuthor: "Author",
    publicPostsPublished: "Published",
    adminUsersCta: "Manage users",
    memberPostsCta: "Write posts",
    memberShellTitle: "Member area",
    memberShellBody:
      "Members can use this area to reach internal club workflows.",
    adminShellTitle: "Admin area",
    adminShellBody:
      "Admins can use this area to manage club accounts and content.",
  },
};

export const meta: MetaFunction = () => [
  { title: "Calella Chess Club" },
  {
    name: "description",
    content: "Calella Chess Club public website and member area.",
  },
];

export async function loader({ params, request }: LoaderFunctionArgs) {
  const url = new URL(request.url);

  if (url.pathname === "/") {
    throw redirect(localePath(DEFAULT_LOCALE));
  }

  const locale = resolveLocale(params.locale);
  const section = routeSectionFromPathname(url.pathname);

  return {
    locale,
    section,
    copy: COPY[locale],
  };
}

export default function HomeRoute() {
  const { locale, section, copy } = useLoaderData<typeof loader>();
  const [publicPosts, setPublicPosts] = useState<PublicPost[]>([]);
  const [isLoadingPublicPosts, setIsLoadingPublicPosts] = useState(
    section === "public",
  );

  useEffect(() => {
    if (section !== "public") {
      return;
    }

    let active = true;

    async function loadPublicPosts() {
      const result = await listPublicPosts();
      if (!active) {
        return;
      }

      setPublicPosts(result.ok ? result.data.posts : []);
      setIsLoadingPublicPosts(false);
    }

    void loadPublicPosts();

    return () => {
      active = false;
    };
  }, [section]);

  return (
    <main className="min-h-screen bg-[#f8f7f2] text-stone-950">
      <SiteHeader
        activeSection={section}
        languagePath={(targetLocale) => localePath(targetLocale, section)}
        locale={locale}
      />

      {section === "public" ? (
        <PublicLanding
          copy={copy}
          isLoadingPublicPosts={isLoadingPublicPosts}
          publicPosts={publicPosts}
        />
      ) : (
        <SectionShell copy={copy} locale={locale} section={section} />
      )}
    </main>
  );
}

function PublicLanding({
  copy,
  isLoadingPublicPosts,
  publicPosts,
}: {
  copy: Copy;
  isLoadingPublicPosts: boolean;
  publicPosts: PublicPost[];
}) {
  return (
    <>
      <section className="relative min-h-[460px] overflow-hidden bg-stone-950 text-white">
        <img
          alt="Calella chess club room"
          className="absolute inset-0 h-full w-full object-cover opacity-45"
          src="/images/club-hero.png"
        />
        <div className="absolute inset-0 bg-stone-950/45" />
        <div className="relative mx-auto flex max-w-6xl flex-col justify-end px-5 py-14 md:min-h-[560px] md:py-16">
          <p className="text-sm font-semibold uppercase tracking-wide text-emerald-200">
            {copy.eyebrow}
          </p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight md:text-6xl">
            {copy.title}
          </h1>
          <p className="mt-5 max-w-2xl text-lg leading-8 text-stone-100">
            {copy.body}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        <div className="grid gap-8 md:grid-cols-[1fr_1.2fr] md:items-start">
          <div>
            <h2 className="text-3xl font-semibold text-stone-950">
              {copy.clubIntroTitle}
            </h2>
            <p className="mt-4 text-base leading-8 text-stone-700">
              {copy.clubIntroBody}
            </p>
          </div>
          <div className="grid gap-3">
            <h2 className="text-xl font-semibold text-stone-950">
              {copy.featuresTitle}
            </h2>
            <div className="grid gap-3 md:grid-cols-3">
              {copy.features.map((feature) => (
                <article
                  className="rounded border border-stone-200 bg-white p-4 shadow-sm"
                  key={feature.title}
                >
                  <h3 className="text-base font-semibold text-stone-950">
                    {feature.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    {feature.body}
                  </p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="border-y border-stone-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-5 px-5 py-10 md:grid-cols-[320px_1fr] md:py-12">
          <div>
            <h2 className="text-2xl font-semibold text-stone-950">
              {copy.membershipTitle}
            </h2>
          </div>
          <div>
            <p className="text-base leading-8 text-stone-700">
              {copy.membershipBody}
            </p>
            <p className="mt-3 text-sm leading-6 text-stone-500">
              {copy.membershipNote}
            </p>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
        <div className="max-w-3xl">
          <h2 className="text-3xl font-semibold text-stone-950">
            {copy.publicPostsTitle}
          </h2>
          <p className="mt-3 text-base leading-7 text-stone-700">
            {copy.publicPostsBody}
          </p>
        </div>

        {isLoadingPublicPosts ? (
          <p className="mt-5 rounded border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {copy.publicPostsLoading}
          </p>
        ) : null}

        {!isLoadingPublicPosts && publicPosts.length === 0 ? (
          <p className="mt-5 rounded border border-stone-200 bg-white px-4 py-3 text-sm text-stone-700">
            {copy.publicPostsEmpty}
          </p>
        ) : null}

        {!isLoadingPublicPosts && publicPosts.length > 0 ? (
          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {publicPosts.map((post) => (
              <PublicPostCard copy={copy} key={post.id} post={post} />
            ))}
          </div>
        ) : null}
      </section>
    </>
  );
}

function PublicPostCard({ copy, post }: { copy: Copy; post: PublicPost }) {
  return (
    <article className="rounded border border-stone-200 bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold text-stone-950">{post.title}</h3>
      <p className="mt-2 text-sm leading-6 text-stone-700">
        {previewPostBodyText(post.bodyJson)}
      </p>
      <p className="mt-4 text-xs text-stone-500">
        {copy.publicPostsAuthor}: {post.authorUsername}
      </p>
      <p className="mt-1 text-xs text-stone-500">
        {copy.publicPostsPublished}: {post.publishedAt.slice(0, 10)}
      </p>
    </article>
  );
}

function SectionShell({
  copy,
  locale,
  section,
}: {
  copy: Copy;
  locale: Locale;
  section: ShellSection;
}) {
  const isAdmin = section === "admin";

  return (
    <section className="mx-auto max-w-6xl px-5 py-10 md:py-14">
      <p className="text-sm font-semibold uppercase tracking-wide text-emerald-700">
        {copy.eyebrow}
      </p>
      <h1 className="mt-4 text-4xl font-semibold leading-tight text-stone-950 md:text-5xl">
        {isAdmin ? copy.adminShellTitle : copy.memberShellTitle}
      </h1>
      <p className="mt-5 max-w-3xl text-lg leading-8 text-stone-700">
        {isAdmin ? copy.adminShellBody : copy.memberShellBody}
      </p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link
          className="rounded bg-stone-950 px-4 py-2.5 text-sm font-semibold text-white hover:bg-stone-800"
          to={isAdmin ? adminUsersPath(locale) : memberPostsPath(locale)}
        >
          {isAdmin ? copy.adminUsersCta : copy.memberPostsCta}
        </Link>
      </div>
    </section>
  );
}
