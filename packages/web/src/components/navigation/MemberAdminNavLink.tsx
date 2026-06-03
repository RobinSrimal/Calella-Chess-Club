import { useEffect, useState } from "react";
import { getCurrentUser, type PublicUser } from "../../lib/browser-api";
import type { Locale } from "../../lib/locale";
import {
  memberAdminNavLinks,
  type MemberAdminNavLabels,
} from "./member-admin-nav-state";

type Props = {
  locale: Locale;
  labels: MemberAdminNavLabels;
};

export default function MemberAdminNavLink({ locale, labels }: Props) {
  const [user, setUser] = useState<PublicUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    getCurrentUser().then((result) => {
      if (!cancelled && result.ok) {
        setUser(result.data.user);
      }
    });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      {memberAdminNavLinks(user, locale, labels).map((link) => (
        <a href={link.href} key={link.href}>
          {link.label}
        </a>
      ))}
    </>
  );
}
