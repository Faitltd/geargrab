import "firebase/app";
import "firebase/auth";
import "firebase/firestore";
import "firebase/storage";
const firebaseConfig = {
  apiKey: "AIzaSyDemoKey123456789",
  authDomain: "geargrab-demo.firebaseapp.com",
  projectId: "geargrab-demo",
  storageBucket: "geargrab-demo.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:demo123456",
  measurementId: "G-DEMO123456"
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
export {
  auth
};
