import { d as derived, w as writable } from "./index2.js";
import "./base44Client.js";
const user = writable(null);
const isAuthenticated = derived(user, ($user) => !!$user);
derived(user, ($user) => $user?.is_email_verified || false);
export {
  isAuthenticated as i,
  user as u
};
