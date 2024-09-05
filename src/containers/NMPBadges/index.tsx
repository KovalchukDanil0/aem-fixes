import React, { ReactElement } from "react";
import { dependencies, devDependencies } from "../../../package.json";

const regexFixVersion = /\^?(\d+\.\d+)\.\d+/;

const dependenciesWhitelist = [
  { name: "react", color: "green" },
  { name: "typescript", color: "aqua" },
  { name: "sass", color: "pink" },
  { name: "tailwindcss", color: "navy" },
  { name: "daisyui", color: "yellow" },
  { name: "webextension-polyfill", color: "red" },
  { name: "vite", color: "azure" },
];

export default function NMPBadges(): ReactElement {
  return (
    <div>
      {dependenciesWhitelist.map((depProps) => {
        const pkgEntry =
          dependencies[depProps.name as keyof typeof dependencies] ??
          devDependencies[depProps.name as keyof typeof devDependencies];

        return (
          <>
            <img
              style={{ color: "red" }}
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
