import { w as writable, d as derived } from './index2-CBMqrvfB.js';
import './base44Client-Dlm5DwUC.js';

const user = writable(null);
const loading = writable(true);
const error = writable(null);
const isAuthenticated = derived(user, ($user) => !!$user);
derived(user, ($user) => $user?.is_email_verified || false);

export { error as e, isAuthenticated as i, loading as l, user as u };
//# sourceMappingURL=auth-QF3a4b_B.js.map
