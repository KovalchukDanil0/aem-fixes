import React, { ReactElement } from "react";
import { useAsync } from "react-async";
import { Loading } from "react-daisyui";
import { ReferencesConfig, regexDetermineBeta, touch } from "../../shared";
import "./index.scss";

const initVariables = async () => regexDetermineBeta();

export default function ReferencesBanner({
  pages,
}: Readonly<ReferencesConfig>): ReactElement {
  const {
    data: regexDetermineBetaResolved,
    error,
    isPending,
  } = useAsync({ promiseFn: initVariables });

  if (isPending) {
    return (
      <div className="grid h-44 place-items-center">
        <Loading />
      </div>
    );
  }

  if (error || !regexDetermineBetaResolved) {
    return (
      <p>
        Something went wrong:{" "}
        {error?.message ?? "regexDetermineBeta is undefined"}
      </p>
    );
  }

  return (
    <div className="referencesBanner">
      {pages
        .toSorted((a, b) => a.path.localeCompare(b.path))
        .map((page) => {
          const linkBetaFix = page.path.replace(
            regexDetermineBetaResolved,
            `$1/${touch}$2`,
          );
          return (
            <a
              className="referencesBannerLink"
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
