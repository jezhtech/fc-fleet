import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // React-specific configuration
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      // Disable the useEffect dependency rule as requested
      "react-hooks/exhaustive-deps": "off",
      // Keep the essential rules-of-hooks
      "react-hooks/rules-of-hooks": "error",

      // Set other potentially noisy rules to "warn"
      "@typescript-eslint/no-unused-vars": [
        "warn",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "warn",

      // Keep your existing react-refresh rule
      "react-refresh/only-export-components": ["off"],
      "@typescript-eslint/no-empty-object-type": ["off"],
    },
  },
);
