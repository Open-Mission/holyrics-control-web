import * as api from "../api/generated";
import { HOLYRICS_SERVER_URL } from "./holyrics-instance";

/**
 * Holyrics Control Library
 * 
 * Provides a centralized interface to the Holyrics Control Server API.
 * Automatically configured using HOLYRICS_SERVER_URL from the .env file.
 */
export const holyrics = {
  /**
   * The base URL used for all API requests.
   */
  serverUrl: HOLYRICS_SERVER_URL,

  /**
   * All API functions and hooks.
   */
  ...api,
};

/**
 * Re-exporting all generated types and hooks for direct access.
 */
export * from "../api/generated";
