import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Les presets Next sont encore publiés au format legacy : FlatCompat fait le pont.
const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    rules: {
      // Le pattern `const { email_to: _emailTo, ...rest } = value` sert à retirer
      // un champ d'un objet avant de le passer au client : on tolère les
      // variables préfixées `_` et les siblings de rest.
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", ignoreRestSiblings: true },
      ],
    },
  },
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
      // Sorties de build OpenNext / Wrangler et exports de maquettes : pas du code du site.
      ".open-next/**",
      ".wrangler/**",
      "*_Design/**",
    ],
  },
];

export default eslintConfig;
