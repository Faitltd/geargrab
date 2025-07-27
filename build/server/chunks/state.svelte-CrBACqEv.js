import 'clsx';
import { U as noop } from './index-B8_Tn3qy.js';

const is_legacy = noop.toString().includes("$$") || /function \w+\(\) \{\}/.test(noop.toString());
if (is_legacy) {
  ({
    url: new URL("https://example.com")
  });
}
//# sourceMappingURL=state.svelte-CrBACqEv.js.map
