import { ComponentProps, ReactElement } from "react";
import { ReferencesConfig, touch } from "src/shared";
import "./index.scss";

interface Props extends ReferencesConfig, ComponentProps<"div"> {
  regexDetermineBeta: RegExp;
}

export default function ReferencesBanner({
  pages,
  regexDetermineBeta,
  ...props
}: Readonly<Props>): ReactElement {
  return (
    <div {...props} className="referencesBanner">
      {pages
        .toSorted(({ path }, { path: pathToCompare }) =>
          path.localeCompare(pathToCompare),
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
