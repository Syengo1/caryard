export type ActionResponse<T = unknown> =
  | { success: true; data: T; error?: never }
  | { success: false; error: string; fieldErrors?: Record<string, string[]>; data?: never }