import { defineConfig } from "orval";

export default defineConfig({
  api: {
    input: "http://localhost:3000/openapi.json",
    output: {
      // Generate split endpoints into a dedicated folder.
      // `src/api/generated.ts` can later become a small barrel re-exporting this workspace.
      workspace: "./src/api/endpoints",
      target: "./index.ts",
      client: "react-query",
      mode: "tags-split",
      schemas: "./model",
      operationSchemas: "./model/operations",
      mock: true,
      clean: true,
      override: {
        mutator: {
          path: "../../lib/holyrics-instance.ts",
          name: "holyricsInstance",
        },
      },
    },
  },
  apiZod: {
    input: "http://localhost:3000/openapi.json",
    output: {
      client: "zod",
      mode: "single",
      target: "./src/api/zod.ts",
      clean: false,
    },
  },
});
