import nx from "@nx/eslint-plugin";

export default [
  ...nx.configs["flat/base"],
  ...nx.configs["flat/typescript"],
  ...nx.configs["flat/react"],
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@nx/enforce-module-boundaries": [
        "error",
        {
          allow: [],
          depConstraints: [
            // Apps may only depend on libs, not on other apps
            {
              sourceTag: "type:app",
              onlyDependOnLibsWithTags: ["type:lib"],
            },
            // E2E projects may depend on app (implicit via implicitDependencies) and libs
            {
              sourceTag: "type:e2e",
              onlyDependOnLibsWithTags: ["type:lib", "type:app"],
            },
            // Libs may only depend on other libs, not on apps
            {
              sourceTag: "type:lib",
              onlyDependOnLibsWithTags: ["type:lib"],
            },
            // ui may depend on utils and theme, but NOT on domain
            {
              sourceTag: "scope:ui",
              onlyDependOnLibsWithTags: ["scope:utils", "scope:theme"],
            },
            // theme has no lib dependencies
            {
              sourceTag: "scope:theme",
              onlyDependOnLibsWithTags: [],
            },
            // utils has no lib dependencies
            {
              sourceTag: "scope:utils",
              onlyDependOnLibsWithTags: [],
            },
            // domain has no lib dependencies
            {
              sourceTag: "scope:domain",
              onlyDependOnLibsWithTags: [],
            },
            // db: leaf — no internal lib dependencies
            {
              sourceTag: "scope:db",
              onlyDependOnLibsWithTags: [],
            },
            // contracts: leaf — no internal lib dependencies
            {
              sourceTag: "scope:contracts",
              onlyDependOnLibsWithTags: [],
            },
            // server may depend on db and contracts only
            {
              sourceTag: "scope:server",
              onlyDependOnLibsWithTags: ["scope:db", "scope:contracts"],
            },
            // api-client depends on contracts at runtime and server for type-only AppType import
            {
              sourceTag: "scope:api-client",
              onlyDependOnLibsWithTags: ["scope:contracts", "scope:server"],
            },
            // apps/api depends on server only
            {
              sourceTag: "scope:api",
              onlyDependOnLibsWithTags: ["scope:server"],
            },
            // web app: ui/domain/utils/theme + api-client + contracts (NO server/db/api)
            {
              sourceTag: "scope:web",
              onlyDependOnLibsWithTags: [
                "scope:ui",
                "scope:domain",
                "scope:utils",
                "scope:theme",
                "scope:api-client",
                "scope:contracts",
              ],
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ["**/vite.config.*.timestamp*", "**/vitest.config.*.timestamp*"],
  },
];
