// @ts-check

import esLint from "@eslint/js";
import globals from "globals";
import esLintTs from "typescript-eslint";

// @ts-ignore
import react from "eslint-plugin-react";

export default esLintTs.config({
  ...esLint.configs.recommended,
  ...esLintTs.configs.recommended,
  files: ["src/**/*.{ts,tsx,mts}"],
  plugins: {
    react,
  },
  languageOptions: {
    parserOptions: {
      ecmaFeatures: {
        jsx: true,
      },
    },
    globals: {
      ...globals.browser,
    },
  },
  rules: {
    // ... any rules you want
    "react/jsx-uses-react": "error",
    "react/jsx-uses-vars": "error",
  },
});
