import React, { ReactElement } from "react";
import { ReferencesConfig, touch } from "../../shared";
import "./index.scss";

type Props = ReferencesConfig & { regexDetermineBeta: RegExp };

export default function ReferencesBanner({
  pages,
  regexDetermineBeta,
}: Readonly<Props>): ReactElement {
  return (
    <div className="referencesBanner">
      {pages
        .toSorted((a, b) => a.path.localeCompare(b.path))
        .map((page) => {
          const linkBetaFix = page.path.replace(
            regexDetermineBeta,
            `$1/${touch}$2`,
          );
          return (
            <a
              key={page.path}
              href={linkBetaFix + ".html"}
              target="_blank"
              rel="noreferrer"
            >
              {page.path}
            </a>
          );
        })}
    </div>
  );
}
