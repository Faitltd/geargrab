import { w as writable, d as derived } from './index2-9J_H_0ie.js';
import './base44Client-Dlm5DwUC.js';

const user = writable(null);
const isAuthenticated = derived(user, ($user) => !!$user);
derived(user, ($user) => $user?.is_email_verified || false);

export { isAuthenticated as i, user as u };
//# sourceMappingURL=auth-hwAP128p.js.map
