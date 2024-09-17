import React, { ReactElement } from "react";
import { ReferencesConfig, touch } from "../../shared";
import "./index.scss";

interface Props extends ReferencesConfig {
  regexDetermineBeta: RegExp;
}

export default function ReferencesBanner({
  pages,
  regexDetermineBeta,
}: Readonly<Props>): ReactElement {
  return (
    <div className="referencesBanner">
      {pages
        .toSorted(({ path }, { path: pathToCheck }) =>
          path.localeCompare(pathToCheck),
        )
        .map(({ path }) => {
          const linkBetaFix = path.replace(regexDetermineBeta, `$1/${touch}$2`);
          return (
            <a
              key={path}
              href={linkBetaFix + ".html"}
              target="_blank"
              rel="noreferrer"
            >
              {path}
            </a>
          );
        })}
    </div>
  );
}
