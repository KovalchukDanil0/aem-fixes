import React, { ReactElement } from "react";
import pkg from "../../../package.json";

const regexFixVersion = /\^?(\d+\.\d+)\.\d+/;

const dependenciesWhitelist = [
  { name: "react", color: "green" },
  { name: "ts-node", color: "blue" },
  { name: "typescript", color: "aqua" },
  { name: "sass", color: "pink" },
  { name: "tailwindcss", color: "navy" },
  { name: "daisyui", color: "yellow" },
  { name: "webextension-polyfill", color: "red" },
  { name: "webpack", color: "azure" },
];

export default function NMPBadges(): ReactElement {
  return (
    <div>
      {dependenciesWhitelist.map((depProps) => {
        const pkgEntry =
          pkg.dependencies[depProps.name as keyof typeof pkg.dependencies] ??
          pkg.devDependencies[
            depProps.name as keyof typeof pkg.devDependencies
          ];

        return (
          <>
            <img
              key={depProps.name}
              alt={depProps.name}
              src={`https://img.shields.io/badge/${encodeURIComponent(depProps.name).replace("-", "_")}-${pkgEntry.replace(regexFixVersion, "$1")}-${depProps.color}`}
            />{" "}
          </>
        );
      })}
    </div>
  );
}
