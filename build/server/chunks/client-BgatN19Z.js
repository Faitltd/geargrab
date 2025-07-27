import 'firebase/app';
import 'firebase/auth';
import 'firebase/firestore';
import 'firebase/storage';

const firebaseConfig = {
  apiKey: void 0,
  authDomain: void 0,
  projectId: void 0,
  storageBucket: void 0,
  messagingSenderId: void 0,
  appId: void 0,
  measurementId: void 0
};
const requiredConfig = ["apiKey", "authDomain", "projectId"];
const missingConfig = requiredConfig.filter((key) => !firebaseConfig[key]);
if (missingConfig.length > 0) {
  console.error("Missing Firebase configuration:", missingConfig);
  throw new Error(`Missing Firebase configuration: ${missingConfig.join(", ")}`);
}
let auth;
{
  auth = {};
}

export { auth };
//# sourceMappingURL=client-BgatN19Z.js.map
