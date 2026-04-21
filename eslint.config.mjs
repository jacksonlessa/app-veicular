import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";
import boundaries from "eslint-plugin-boundaries";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    plugins: { boundaries },
    settings: {
      "boundaries/elements": [
        { type: "domain", pattern: "src/domain/**" },
        { type: "application", pattern: "src/application/**" },
        { type: "infrastructure", pattern: "src/infrastructure/**" },
        { type: "app", pattern: "src/app/**" },
        { type: "components", pattern: "src/components/**" },
      ],
    },
    rules: {
      "boundaries/dependencies": [
        "error",
        {
          default: "allow",
          rules: [
            {
              from: { type: "domain" },
              disallow: { to: { type: ["application", "infrastructure", "app", "components"] } },
            },
            {
              from: { type: "application" },
              disallow: { to: { type: ["infrastructure", "app"] } },
            },
          ],
        },
      ],
    },
  },
];

export default eslintConfig;
