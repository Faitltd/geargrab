import { w as writable, d as derived } from './index2-D8-jKE2y.js';
import './base44Client-DiUgpmgT.js';

const user = writable(null);
const isAuthenticated = derived(user, ($user) => !!$user);
derived(user, ($user) => $user?.is_email_verified || false);

export { isAuthenticated as i, user as u };
//# sourceMappingURL=auth-CnzIXXbE.js.map
