
import { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Mail,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  MapPin,
  CalendarCheck,
  Trophy,
} from "lucide-react";

import { AuthContext } from "../contexts/AuthProvider.jsx";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const FEATURES = [
  {
    icon: CheckCircle2,
    title: "Verified turfs",
    description: "Explore trusted sports venues.",
  },
  {
    icon: CalendarCheck,
    title: "Easy booking",
    description: "Reserve your preferred time slot.",
  },
  {
    icon: MapPin,
    title: "Find nearby venues",
    description: "Discover turfs around your area.",
  },
  {
    icon: ShieldCheck,
    title: "Secure experience",
    description: "Manage your bookings confidently.",
  },
];

const getErrorMessage = (error) => {
  switch (error.message) {
    case "USER_PROFILE_NOT_FOUND":
      return "Your Firebase login was successful, but your Khelaro profile was not found. Please complete registration first.";

    case "USER_EMAIL_MISMATCH":
      return "Your Firebase email and Khelaro profile email do not match.";

    case "BACKEND_CONNECTION_ERROR":
      return "Unable to connect to the Khelaro server. Please check your internet connection or backend configuration.";

    case "INVALID_ROLE":
      return "Your account has an invalid role. Please contact the administrator.";

    default:
      break;
  }

  switch (error.code) {
    case "auth/invalid-credential":
      return "Invalid email or password.";

    case "auth/user-not-found":
      return "No account found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-email":
      return "Please enter a valid email address.";

    case "auth/too-many-requests":
      return "Too many failed attempts. Please try again later.";

    case "auth/network-request-failed":
      return "Network error. Please check your internet connection.";

    case "auth/user-disabled":
      return "This account has been disabled.";

    default:
      return error.message || "Login failed. Please try again.";
  }
};

const Login = () => {
  const navigate = useNavigate();

  const { login, loading: authLoading } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const isLoading = loading || authLoading;

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const getMongoUser = async (email) => {
    if (!email) {
      throw new Error("Firebase account email was not found.");
    }

    const normalizedEmail = email.trim().toLowerCase();

    let response;

    try {
      response = await fetch(
        `${API_URL}/users/${encodeURIComponent(normalizedEmail)}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
          },
        }
      );
    } catch (fetchError) {
      console.error("MongoDB user fetch error:", fetchError);
      throw new Error("BACKEND_CONNECTION_ERROR");
    }

    let data = null;

    try {
      data = await response.json();
    } catch {
      data = null;
    }

    if (response.status === 404) {
      throw new Error("USER_PROFILE_NOT_FOUND");
    }

    if (!response.ok) {
      throw new Error(
        data?.message || "Failed to load user profile."
      );
    }

    const user = data?.user;

    if (!user || typeof user.email !== "string") {
      throw new Error("USER_PROFILE_NOT_FOUND");
    }

    const databaseEmail = user.email.trim().toLowerCase();

    if (databaseEmail !== normalizedEmail) {
      throw new Error("USER_EMAIL_MISMATCH");
    }

    return user;
  };

  const redirectUser = (userData) => {
    const role = String(userData?.role || "user")
      .trim()
      .toLowerCase();

    const routes = {
      admin: "/admin-dashboard",
      owner: "/owner-dashboard",
      user: "/dashboard",
    };

    navigate(routes[role] || routes.user, {
      replace: true,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setError("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setError("Please enter your email and password.");
      return;
    }

    try {
      setLoading(true);

      // Step 1: Firebase authentication
      const firebaseUser = await login(email, password);

      if (!firebaseUser) {
        throw new Error("Firebase login failed. Please try again.");
      }

      const firebaseEmail = firebaseUser.email
        ?.trim()
        .toLowerCase();

      if (!firebaseEmail) {
        throw new Error("Firebase account email was not found.");
      }

      // Step 2: Fetch MongoDB profile
      const mongoUser = await getMongoUser(firebaseEmail);

      // Step 3: Validate user role
      const role = String(mongoUser?.role || "")
        .trim()
        .toLowerCase();

      const allowedRoles = ["user", "owner", "admin"];

      if (!allowedRoles.includes(role)) {
        throw new Error("INVALID_ROLE");
      }

      const finalUserData = {
        ...mongoUser,
        uid: firebaseUser.uid || mongoUser.uid || "",
        email: firebaseEmail,
        role,
      };

      // Step 4: Store user information
      localStorage.setItem(
        "khelaro-user",
        JSON.stringify(finalUserData)
      );

      if (firebaseUser.uid) {
        localStorage.setItem("khelaro-uid", firebaseUser.uid);
      }

      // Step 5: Redirect according to role
      redirectUser(finalUserData);
    } catch (error) {
      console.error("Login error:", error);
      setError(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative min-h-[calc(100vh-72px)] overflow-hidden bg-[#f8faf9] px-4 py-8 sm:px-6 lg:px-8">
      {/* Background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-20 h-80 w-80 rounded-full bg-green-100/60 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 bottom-0 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl"
      />

      <div className="relative mx-auto flex min-h-[calc(100vh-136px)] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-[0_24px_80px_-35px_rgba(15,23,42,0.18)] lg:grid-cols-2">

          {/* Left panel */}
          <section className="relative hidden overflow-hidden bg-[#f0fdf4] p-10 lg:flex lg:flex-col lg:justify-between xl:p-14">
            {/* Decorative elements */}
            <div
              aria-hidden="true"
              className="absolute -right-24 -top-24 h-80 w-80 rounded-full border border-green-200/70"
            />
            <div
              aria-hidden="true"
              className="absolute -right-12 -top-12 h-56 w-56 rounded-full border border-green-200/70"
            />
            <div
              aria-hidden="true"
              className="absolute -bottom-28 -left-28 h-80 w-80 rounded-full bg-green-200/30 blur-3xl"
            />

            <div className="relative z-10">
              {/* Logo */}
              <Link
                to="/"
                className="group inline-flex items-center gap-3"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-green-600 text-xl font-bold text-white shadow-lg shadow-green-600/20 transition-transform duration-300 group-hover:-rotate-6 group-hover:scale-105">
                  K
                </div>

                <span className="text-2xl font-bold tracking-tight text-gray-900">
                  Khelaro
                </span>
              </Link>

              {/* Hero content */}
              <div className="mt-20 max-w-md">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-green-200 bg-white/80 px-3.5 py-2 text-xs font-semibold text-green-700 shadow-sm">
                  <Sparkles size={14} />
                  Play more. Worry less.
                </div>

                <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-gray-900 xl:text-[46px]">
                  Your next game is
                  <span className="mt-1 block text-green-600">
                    just a booking away.
                  </span>
                </h1>

                <p className="mt-6 max-w-sm text-sm leading-7 text-gray-600 xl:text-base">
                  Discover the best sports venues, check
                  availability, and reserve your preferred
                  playing slot with ease.
                </p>

                {/* Visual card */}
                <div className="relative mt-10 overflow-hidden rounded-2xl border border-green-200/80 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Your game starts here
                      </p>
                      <h3 className="mt-1 text-lg font-bold text-gray-900">
                        Find. Book. Play.
                      </h3>
                    </div>

                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-50 text-green-600">
                      <Trophy size={25} />
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-2">
                    <span className="h-1.5 flex-1 rounded-full bg-green-600" />
                    <span className="h-1.5 flex-1 rounded-full bg-green-200" />
                    <span className="h-1.5 flex-1 rounded-full bg-green-200" />
                  </div>
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="relative z-10 mt-12 border-t border-green-200/80 pt-7">
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                Why choose Khelaro
              </p>

              <div className="grid grid-cols-2 gap-x-5 gap-y-5">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div
                      key={feature.title}
                      className="flex items-start gap-3"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                        <Icon size={17} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {feature.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-gray-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Right panel */}
          <section className="flex items-center justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
            <div className="w-full max-w-md">

              {/* Mobile logo */}
              <Link
                to="/"
                className="mb-10 inline-flex items-center gap-2.5 lg:hidden"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-lg font-bold text-white shadow-md shadow-green-600/20">
                  K
                </div>

                <span className="text-xl font-bold tracking-tight text-gray-900">
                  Khelaro
                </span>
              </Link>

              {/* Heading */}
              <div className="animate-[loginFadeUp_0.5s_ease-out]">
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  Welcome back
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-[34px]">
                  Sign in to Khelaro
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Enter your account details to manage your
                  bookings and find your next game.
                </p>
              </div>

              {/* Error message */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mt-6 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-100 text-red-600">
                    <AlertCircle size={17} />
                  </div>

                  <p className="pt-1 text-sm leading-5 text-red-700">
                    {error}
                  </p>
                </div>
              )}

              {/* Login form */}
              <form
                onSubmit={handleSubmit}
                className="mt-8 space-y-5 animate-[loginFadeUp_0.65s_ease-out]"
              >
                {/* Email */}
                <div>
                  <label
                    htmlFor="email"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Email address
                  </label>

                  <div className="group relative">
                    <Mail
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-green-600"
                    />

                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <label
                      htmlFor="password"
                      className="text-sm font-semibold text-gray-700"
                    >
                      Password
                    </label>

                    <Link
                      to="/forgot-password"
                      className="text-xs font-semibold text-green-600 transition-colors hover:text-green-700"
                    >
                      Forgot password?
                    </Link>
                  </div>

                  <div className="group relative">
                    <Lock
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-green-600"
                    />

                    <input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="current-password"
                      placeholder="Enter your password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowPassword((prev) => !prev)
                      }
                      disabled={isLoading}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                      aria-pressed={showPassword}
                      className="absolute right-3.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:cursor-not-allowed"
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative mt-2 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-green-600 text-sm font-semibold text-white shadow-md shadow-green-600/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign in
                      <ArrowRight
                        size={17}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Register */}
              <p className="mt-7 text-center text-sm text-gray-500">
                Don't have an account?{" "}
                <Link
                  to="/register"
                  className="font-semibold text-green-600 transition-colors hover:text-green-700"
                >
                  Create an account
                </Link>
              </p>

              {/* Owner CTA */}
              <div className="group relative mt-9 overflow-hidden rounded-2xl border border-green-100 bg-green-50/70 p-5 transition-all duration-300 hover:border-green-200 hover:bg-green-50">
                <div
                  aria-hidden="true"
                  className="absolute -right-8 -top-8 h-28 w-28 rounded-full bg-green-200/30 blur-2xl transition-transform duration-500 group-hover:scale-150"
                />

                <div className="relative flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                    <ShieldCheck size={19} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900">
                      Own a sports turf?
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-gray-500">
                      List your venue on Khelaro and manage
                      bookings online.
                    </p>

                    <Link
                      to="/register?role=owner"
                      className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-green-700 transition-all hover:gap-2.5"
                    >
                      Become a turf owner
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <p className="mt-8 text-center text-xs text-gray-400">
                © {new Date().getFullYear()} Khelaro. All rights reserved.
              </p>
            </div>
          </section>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes loginFadeUp {
          from {
            opacity: 0;
            transform: translateY(12px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *,
          *::before,
          *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            scroll-behavior: auto !important;
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
};

export default Login;
