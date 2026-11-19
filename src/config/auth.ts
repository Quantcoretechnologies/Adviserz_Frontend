/**
 * Cookie names used for the web session.
 *
 * - ACCESS_TOKEN_COOKIE: written by this app after sign-in; holds the
 *   short-lived access token sent as `Authorization: Bearer`.
 * - CSRF_COOKIE: written by the API next to its HttpOnly refresh cookie; its
 *   value is echoed in `X-CSRF-Token` when refreshing or signing out. Its
 *   presence means a refresh can be attempted.
 */
export const ACCESS_TOKEN_COOKIE = "adz_at";
export const CSRF_COOKIE = "adz_csrf";

/**
 * The admin console has its own session in its own cookies, so a staff
 * member can be signed in to the console and the customer app independently.
 */
export const ADMIN_ACCESS_TOKEN_COOKIE = "adz_admin_at";
export const ADMIN_CSRF_COOKIE = "adz_admin_csrf";
