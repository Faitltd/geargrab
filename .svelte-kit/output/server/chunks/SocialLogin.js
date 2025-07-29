import { E as fallback, T as ensure_array_like, U as attr_class, I as attr, Q as stringify, F as escape_html, K as bind_props, D as pop, z as push } from "./index.js";
import { GoogleAuthProvider, FacebookAuthProvider, TwitterAuthProvider, GithubAuthProvider, OAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "./client.js";
function html(value) {
  var html2 = String(value ?? "");
  var open = "<!---->";
  return open + html2 + "<!---->";
}
const googleProvider = new GoogleAuthProvider();
googleProvider.addScope("email");
googleProvider.addScope("profile");
const facebookProvider = new FacebookAuthProvider();
facebookProvider.addScope("email");
const twitterProvider = new TwitterAuthProvider();
const githubProvider = new GithubAuthProvider();
githubProvider.addScope("user:email");
const appleProvider = new OAuthProvider("apple.com");
appleProvider.addScope("email");
appleProvider.addScope("name");
const microsoftProvider = new OAuthProvider("microsoft.com");
microsoftProvider.addScope("email");
microsoftProvider.addScope("profile");
const yahooProvider = new OAuthProvider("yahoo.com");
yahooProvider.addScope("email");
yahooProvider.addScope("profile");
const linkedinProvider = new OAuthProvider("oidc.linkedin");
linkedinProvider.addScope("email");
linkedinProvider.addScope("profile");
const discordProvider = new OAuthProvider("discord.com");
discordProvider.addScope("email");
discordProvider.addScope("identify");
const twitchProvider = new OAuthProvider("twitch.tv");
twitchProvider.addScope("user:read:email");
async function signInWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    return {
      user: result.user,
      credential,
      token
    };
  } catch (error) {
    console.error("Google sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with Google");
  }
}
async function signInWithFacebook() {
  try {
    const result = await signInWithPopup(auth, facebookProvider);
    const credential = FacebookAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    return {
      user: result.user,
      credential,
      token
    };
  } catch (error) {
    console.error("Facebook sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with Facebook");
  }
}
async function signInWithTwitter() {
  try {
    const result = await signInWithPopup(auth, twitterProvider);
    const credential = TwitterAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const secret = credential?.secret;
    return {
      user: result.user,
      credential,
      token,
      secret
    };
  } catch (error) {
    console.error("Twitter sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with Twitter");
  }
}
async function signInWithGithub() {
  try {
    const result = await signInWithPopup(auth, githubProvider);
    const credential = GithubAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    return {
      user: result.user,
      credential,
      token
    };
  } catch (error) {
    console.error("GitHub sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with GitHub");
  }
}
async function signInWithApple() {
  try {
    const result = await signInWithPopup(auth, appleProvider);
    const credential = OAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const idToken = credential?.idToken;
    return {
      user: result.user,
      credential,
      token,
      idToken
    };
  } catch (error) {
    console.error("Apple sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with Apple");
  }
}
async function signInWithMicrosoft() {
  try {
    const result = await signInWithPopup(auth, microsoftProvider);
    const credential = OAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const idToken = credential?.idToken;
    return {
      user: result.user,
      credential,
      token,
      idToken
    };
  } catch (error) {
    console.error("Microsoft sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with Microsoft");
  }
}
async function signInWithYahoo() {
  try {
    const result = await signInWithPopup(auth, yahooProvider);
    const credential = OAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const idToken = credential?.idToken;
    return {
      user: result.user,
      credential,
      token,
      idToken
    };
  } catch (error) {
    console.error("Yahoo sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with Yahoo");
  }
}
async function signInWithLinkedIn() {
  try {
    const result = await signInWithPopup(auth, linkedinProvider);
    const credential = OAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    const idToken = credential?.idToken;
    return {
      user: result.user,
      credential,
      token,
      idToken
    };
  } catch (error) {
    console.error("LinkedIn sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with LinkedIn");
  }
}
async function signInWithDiscord() {
  try {
    const result = await signInWithPopup(auth, discordProvider);
    const credential = OAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    return {
      user: result.user,
      credential,
      token
    };
  } catch (error) {
    console.error("Discord sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with Discord");
  }
}
async function signInWithTwitch() {
  try {
    const result = await signInWithPopup(auth, twitchProvider);
    const credential = OAuthProvider.credentialFromResult(result);
    const token = credential?.accessToken;
    return {
      user: result.user,
      credential,
      token
    };
  } catch (error) {
    console.error("Twitch sign-in error:", error);
    if (error.code === "auth/popup-closed-by-user") {
      throw new Error("Sign-in was cancelled");
    } else if (error.code === "auth/popup-blocked") {
      throw new Error("Pop-up was blocked by your browser. Please allow pop-ups and try again.");
    } else if (error.code === "auth/account-exists-with-different-credential") {
      throw new Error("An account already exists with the same email address but different sign-in credentials.");
    }
    throw new Error(error.message || "Failed to sign in with Twitch");
  }
}
function SocialLogin($$payload, $$props) {
  push();
  let filteredProviders;
  let showTitle = fallback($$props["showTitle"], true);
  let buttonSize = fallback($$props["buttonSize"], "default");
  let layout = fallback($$props["layout"], "grid");
  let providers = fallback(
    $$props["providers"],
    () => [
      "google",
      "apple",
      "facebook",
      "microsoft",
      "twitter",
      "github",
      "linkedin",
      "yahoo",
      "discord",
      "twitch"
    ],
    true
  );
  let loading = {};
  const providerConfig = {
    google: {
      name: "Google",
      icon: "google",
      color: "bg-white border-gray-300 text-gray-700 hover:bg-gray-50",
      handler: signInWithGoogle
    },
    apple: {
      name: "Apple",
      icon: "apple",
      color: "bg-black text-white hover:bg-gray-800",
      handler: signInWithApple
    },
    facebook: {
      name: "Facebook",
      icon: "facebook",
      color: "bg-blue-600 text-white hover:bg-blue-700",
      handler: signInWithFacebook
    },
    microsoft: {
      name: "Microsoft",
      icon: "microsoft",
      color: "bg-blue-500 text-white hover:bg-blue-600",
      handler: signInWithMicrosoft
    },
    twitter: {
      name: "Twitter",
      icon: "twitter",
      color: "bg-sky-500 text-white hover:bg-sky-600",
      handler: signInWithTwitter
    },
    github: {
      name: "GitHub",
      icon: "github",
      color: "bg-gray-800 text-white hover:bg-gray-900",
      handler: signInWithGithub
    },
    linkedin: {
      name: "LinkedIn",
      icon: "linkedin",
      color: "bg-blue-700 text-white hover:bg-blue-800",
      handler: signInWithLinkedIn
    },
    yahoo: {
      name: "Yahoo",
      icon: "yahoo",
      color: "bg-purple-600 text-white hover:bg-purple-700",
      handler: signInWithYahoo
    },
    discord: {
      name: "Discord",
      icon: "discord",
      color: "bg-indigo-600 text-white hover:bg-indigo-700",
      handler: signInWithDiscord
    },
    twitch: {
      name: "Twitch",
      icon: "twitch",
      color: "bg-purple-500 text-white hover:bg-purple-600",
      handler: signInWithTwitch
    }
  };
  const sizeClasses = {
    small: "px-3 py-2 text-sm",
    default: "px-4 py-2.5 text-sm",
    large: "px-6 py-3 text-base"
  };
  const layoutClasses = {
    grid: "grid grid-cols-1 sm:grid-cols-2 gap-3",
    list: "space-y-3",
    compact: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2"
  };
  function getProviderIcon(provider) {
    const icons = {
      google: `<svg class="w-5 h-5" viewBox="0 0 24 24">
        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>`,
      apple: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
      </svg>`,
      facebook: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
      </svg>`,
      microsoft: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.4 24H0V12.6h11.4V24zM24 24H12.6V12.6H24V24zM11.4 11.4H0V0h11.4v11.4zM24 11.4H12.6V0H24v11.4z"/>
      </svg>`,
      twitter: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
      </svg>`,
      github: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
      </svg>`,
      linkedin: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
      </svg>`,
      yahoo: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0zm5.5 17.5h-3l-2.5-4-2.5 4h-3l4-6.5-3.5-5.5h3l2 3.5 2-3.5h3l-3.5 5.5 4 6.5z"/>
      </svg>`,
      discord: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419-.0002 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9554 2.4189-2.1568 2.4189Z"/>
      </svg>`,
      twitch: `<svg class="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
      </svg>`
    };
    return icons[provider] || "";
  }
  filteredProviders = providers.filter((p) => providerConfig[p]);
  const each_array = ensure_array_like(filteredProviders);
  if (showTitle) {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="text-center mb-6"><h3 class="text-lg font-medium text-gray-900 mb-2">Sign in with your account</h3> <p class="text-sm text-gray-600">Choose your preferred sign-in method</p></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> `);
  {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]--> <div${attr_class(layoutClasses[layout])}><!--[-->`);
  for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
    let provider = each_array[$$index];
    const config = providerConfig[provider];
    $$payload.out.push(`<button type="button"${attr("disabled", loading[provider], true)}${attr_class(` ${stringify(sizeClasses[buttonSize])} ${stringify(config.color)} relative flex items-center justify-center border rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 ${stringify(layout === "compact" ? "flex-col space-y-1" : "space-x-3")} `)}>`);
    if (loading[provider]) {
      $$payload.out.push("<!--[-->");
      $$payload.out.push(`<svg class="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>`);
    } else {
      $$payload.out.push("<!--[!-->");
      $$payload.out.push(`${html(getProviderIcon(provider))}`);
    }
    $$payload.out.push(`<!--]--> <span${attr_class(layout === "compact" ? "text-xs" : "")}>${escape_html(layout === "compact" ? config.name : `Continue with ${config.name}`)}</span></button>`);
  }
  $$payload.out.push(`<!--]--></div> `);
  if (layout !== "compact") {
    $$payload.out.push("<!--[-->");
    $$payload.out.push(`<div class="mt-6 text-center"><p class="text-xs text-gray-500">By signing in, you agree to our <a href="/terms" class="text-green-600 hover:text-green-500">Terms of Service</a> and <a href="/privacy" class="text-green-600 hover:text-green-500">Privacy Policy</a></p></div>`);
  } else {
    $$payload.out.push("<!--[!-->");
  }
  $$payload.out.push(`<!--]-->`);
  bind_props($$props, { showTitle, buttonSize, layout, providers });
  pop();
}
export {
  SocialLogin as S
};
