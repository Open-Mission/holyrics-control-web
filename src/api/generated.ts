/**
 * Stable barrel for generated API exports.
 *
 * The Orval output now lives under `src/api/endpoints` in `tags-split` mode.
 * Keep this file as the app-facing import surface so existing imports from
 * `@/api/generated` do not need to change.
 */
export * from "./endpoints";
