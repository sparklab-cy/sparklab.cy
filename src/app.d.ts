// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces

import { SupabaseClient, User, Session } from '@supabase/supabase-js';

declare global {
	namespace App {
		interface LayoutData {
			shopifyEnabled?: boolean;
		}
		interface Locals {
			supabase: SupabaseClient;
			safeGetSession: () => Promise<
				| { session: null; user: null }
				| { session: Session; user: User | null }
			>;
			user: User | null;
			session: Session | null;
		}
	}
}

export {};