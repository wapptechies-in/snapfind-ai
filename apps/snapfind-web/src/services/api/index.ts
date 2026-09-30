/**
 * SnapFind Web Application — Unified API Service Module
 * Re-exports unified @snapfind/api-client services with full backward compatibility.
 */

export * from "@snapfind/api-client";
export { ApiError, extractErrorMessage, getApiBaseUrl, setApiBaseUrl, request } from "./client";
export { authApi } from "./auth";

