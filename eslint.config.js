import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: [
    "dist",
    "src/types/database.ts",
    "src/types/database.helpers.ts",
    "src/types/json.ts",
    "src/integrations/supabase/types.ts",
    "supabase/types.ts",
    "supabase/functions/**/*"
  ] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { 
          "argsIgnorePattern": "^_",
          "varsIgnorePattern": "^_",
          "ignoreRestSiblings": true
        }
      ],
    },
  },
  {
    files: [
      "src/components/ui/**/*.{ts,tsx}",
      "src/contexts/**/*.{ts,tsx}",
      "src/modules/usuarios-permissoes/components/DashboardRouter.tsx",
      "src/modules/usuarios-permissoes/components/ProtectedComponent.tsx",
      "src/modules/usuarios-permissoes/components/Dashboard*.tsx",
      "src/components/layouts/**/*.{ts,tsx}",
      "src/pages/admin/**/*.{ts,tsx}",
      "scripts/**/*.{ts,tsx}"
    ],
    rules: {
      "react-refresh/only-export-components": "off",
      "@typescript-eslint/no-unused-vars": "off",
    },
  }
);
