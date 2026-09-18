import eslint from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";

export default tseslint.config(
  {
    ignores: [
      "bin/**",
      "**/dist/**",
      "node_modules/**",
      "review-artifacts/**",
      "**/src-tauri/target/**",
      "var/**",
    ],
  },
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/src/**/*.ts"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["eslint.config.js", "**/vite.config.ts"],
    languageOptions: {
      globals: globals.node,
    },
  },
);
