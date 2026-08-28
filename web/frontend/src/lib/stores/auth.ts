import { writable, type Readable } from 'svelte/store';
import { getAuthStatus, signOut as signOutApi, type AuthStatus } from '$lib/api/auth';

/**
 * Who the current session belongs to, and whether this deployment offers
 * sign-in at all (`GET /api/auth/me`).
 *
 * Why it starts as "anonymous, no provider" rather than null or a loading
 * flag: that is exactly how a deployment without Google credentials looks,
 * and it is the state in which the UI shows no auth controls. So the first
 * paint -- before the status has been fetched -- renders the same as the
 * quietest possible answer, and the controls appear only once the server
 * has actually said they should. No flash of a sign-in button that then
 * vanishes, and no spinner for something nobody is waiting on.
 */
const UNKNOWN_STATUS: AuthStatus = {
	authenticated: false,
	email: null,
	displayName: null,
	providerAvailable: false
};

export interface AuthController {
	status: Readable<AuthStatus>;
	/** Fetches `/api/auth/me` and publishes it. Safe to call repeatedly. */
	refresh: () => Promise<void>;
	/** Signs this browser out, then refreshes so the UI follows. */
	signOut: () => Promise<void>;
}

export function createAuthController(
	deps: {
		fetchStatus?: typeof getAuthStatus;
		requestSignOut?: typeof signOutApi;
	} = {}
): AuthController {
	const { fetchStatus = getAuthStatus, requestSignOut = signOutApi } = deps;
	const status = writable<AuthStatus>(UNKNOWN_STATUS);

	async function refresh(): Promise<void> {
		// `getAuthStatus` never throws -- an unreachable endpoint resolves to
		// the anonymous status, which is the correct thing to render.
		status.set(await fetchStatus());
	}

	async function signOut(): Promise<void> {
		await requestSignOut();
		await refresh();
	}

	return { status: { subscribe: status.subscribe }, refresh, signOut };
}

/** The app-wide controller; components subscribe to `auth.status`. */
export const auth = createAuthController();
