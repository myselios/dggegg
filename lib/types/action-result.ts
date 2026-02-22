export type ActionResult<T> =
  | { readonly success: true; readonly data: T; readonly warning?: string }
  | { readonly success: false; readonly error: string }
