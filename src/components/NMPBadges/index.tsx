import { ReactElement } from "react";
import { dependencies, devDependencies } from "~/package.json";

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
      {dependenciesWhitelist.map(({ name, color }) => {
        const pkgEntry =
          dependencies[name as keyof typeof dependencies] ??
          devDependencies[name as keyof typeof devDependencies];

        return (
          <>
            <img
              style={{ color: "red" }}
              key={name}
              alt={name}
              src={`https://img.shields.io/badge/${encodeURIComponent(name).replace("-", "_")}-${pkgEntry.replace(regexFixVersion, "$1")}-${color}`}
            />{" "}
          </>
        );
      })}
    </div>
  );
}
