
import { useContext, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Eye,
  EyeOff,
  UserRound,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  CheckCircle2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Building2,
  CalendarCheck,
  MapPin,
  Trophy,
} from "lucide-react";

import { AuthContext } from "../contexts/AuthProvider.jsx";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const FEATURES = [
  {
    icon: MapPin,
    title: "Discover turfs",
    description: "Find sports venues near you.",
  },
  {
    icon: CalendarCheck,
    title: "Easy booking",
    description: "Reserve your preferred time slot.",
  },
  {
    icon: ShieldCheck,
    title: "Book confidently",
    description: "Manage your bookings with ease.",
  },
];

const getPasswordStrength = (password) => {
  if (!password) {
    return {
      label: "",
      width: "0%",
      color: "bg-gray-200",
      text: "text-gray-400",
    };
  }

  if (password.length < 6) {
    return {
      label: "Weak password",
      width: "25%",
      color: "bg-red-500",
      text: "text-red-600",
    };
  }

  let score = 1;

  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) {
    return {
      label: "Fair password",
      width: "45%",
      color: "bg-amber-500",
      text: "text-amber-600",
    };
  }

  if (score <= 3) {
    return {
      label: "Good password",
      width: "70%",
      color: "bg-green-400",
      text: "text-green-600",
    };
  }

  return {
    label: "Strong password",
    width: "100%",
    color: "bg-green-600",
    text: "text-green-700",
  };
};

const getErrorMessage = (error) => {
  if (error.code) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "An account already exists with this email address.";

      case "auth/invalid-email":
        return "Please enter a valid email address.";

      case "auth/weak-password":
        return "Your password is too weak. Please choose a stronger password.";

      case "auth/network-request-failed":
        return "Network error. Please check your internet connection.";

      case "auth/operation-not-allowed":
        return "Email and password registration is currently unavailable.";

      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";

      default:
        break;
    }
  }

  if (error.message === "BACKEND_CONNECTION_ERROR") {
    return "Unable to connect to the Khelaro server. Please check your internet connection or backend configuration.";
  }

  if (error.message === "FIREBASE_USER_NOT_CREATED") {
    return "Registration could not be completed. Please try again.";
  }

  return error.message || "Registration failed. Please try again.";
};

const Register = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const { register, loading: authLoading } = useContext(AuthContext);

  const initialRole =
    searchParams.get("role")?.toLowerCase() === "owner"
      ? "owner"
      : "customer";

  const [role, setRole] = useState(initialRole);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const isLoading = submitting || authLoading;

  const passwordStrength = useMemo(
    () => getPasswordStrength(formData.password),
    [formData.password]
  );

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleRoleChange = (selectedRole) => {
    setRole(selectedRole);
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isLoading) return;

    setError("");

    const name = formData.name.trim();
    const email = formData.email.trim().toLowerCase();
    const phone = formData.phone.trim();
    const password = formData.password;
    const confirmPassword = formData.confirmPassword;

    if (!name || !email || !password || !confirmPassword) {
      setError("Please complete all required fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setSubmitting(true);

      const userRole = role === "customer" ? "user" : "owner";

      // Step 1: Create Firebase account
      const firebaseUser = await register(name, email, password);

      if (!firebaseUser?.uid) {
        throw new Error("FIREBASE_USER_NOT_CREATED");
      }

      // Step 2: Prepare MongoDB user profile
      const userInfo = {
        uid: firebaseUser.uid,
        name,
        email,
        phone,
        role: userRole,
      };

      // Step 3: Save profile to backend
      let response;

      try {
        response = await fetch(`${API_URL}/users`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(userInfo),
        });
      } catch (fetchError) {
        console.error("Registration API error:", fetchError);
        throw new Error("BACKEND_CONNECTION_ERROR");
      }

      let data = null;

      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to save user information."
        );
      }

      // Step 4: Redirect according to role
      navigate(
        userRole === "owner"
          ? "/owner-dashboard"
          : "/dashboard",
        { replace: true }
      );
    } catch (error) {
      console.error("Registration error:", error);

      if (
        error.message?.includes("Failed to save user information") ||
        error.message === "BACKEND_CONNECTION_ERROR"
      ) {
        setError(
          "Your Firebase account may have been created, but we couldn't save your Khelaro profile. Please contact support before trying to register again."
        );
      } else {
        setError(getErrorMessage(error));
      }
    } finally {
      setSubmitting(false);
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

          {/* Left brand panel */}
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
                  Built for the game
                </div>

                <h1 className="text-4xl font-bold leading-[1.15] tracking-tight text-gray-900 xl:text-[46px]">
                  Find your turf.
                  <span className="mt-1 block text-green-600">
                    Book your game.
                  </span>
                </h1>

                <p className="mt-6 max-w-sm text-sm leading-7 text-gray-600 xl:text-base">
                  Join Khelaro and discover a simpler way
                  to find, compare, and book sports venues
                  around Dhaka.
                </p>

                {/* Visual card */}
                <div className="relative mt-10 overflow-hidden rounded-2xl border border-green-200/80 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-gray-500">
                        Your game starts here
                      </p>

                      <h3 className="mt-1 text-lg font-bold text-gray-900">
                        Find. Book. Play.
                      </h3>
                    </div>

                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">
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
              <p className="mb-5 text-xs font-semibold uppercase tracking-[0.15em] text-gray-500">
                Everything you need to get started
              </p>

              <div className="space-y-4">
                {FEATURES.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <div
                      key={feature.title}
                      className="flex items-center gap-3"
                    >
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-green-600 shadow-sm">
                        <Icon size={18} />
                      </div>

                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          {feature.title}
                        </p>

                        <p className="mt-0.5 text-xs text-gray-500">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* Registration panel */}
          <section className="flex items-center justify-center px-6 py-10 sm:px-10 sm:py-12 lg:px-12 xl:px-16">
            <div className="w-full max-w-md">

              {/* Mobile logo */}
              <Link
                to="/"
                className="mb-9 inline-flex items-center gap-2.5 lg:hidden"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-600 text-lg font-bold text-white shadow-md shadow-green-600/20">
                  K
                </div>

                <span className="text-xl font-bold tracking-tight text-gray-900">
                  Khelaro
                </span>
              </Link>

              {/* Heading */}
              <div className="animate-[registerFadeUp_0.5s_ease-out]">
                <div className="mb-3 inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.16em] text-green-600">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  Get started
                </div>

                <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-[34px]">
                  Create your account
                </h2>

                <p className="mt-3 text-sm leading-6 text-gray-500">
                  Join Khelaro and get ready for your next game.
                </p>
              </div>

              {/* Error */}
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

              <form
                onSubmit={handleSubmit}
                className="mt-7 space-y-4 animate-[registerFadeUp_0.65s_ease-out]"
              >
                {/* Account type */}
                <fieldset disabled={isLoading}>
                  <legend className="mb-2 block text-sm font-semibold text-gray-700">
                    Choose account type
                  </legend>

                  <div className="grid grid-cols-2 gap-3">
                    {/* Customer */}
                    <button
                      type="button"
                      onClick={() => handleRoleChange("customer")}
                      aria-pressed={role === "customer"}
                      className={`rounded-xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                        role === "customer"
                          ? "border-green-500 bg-green-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            role === "customer"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <UserRound size={17} />
                        </div>

                        {role === "customer" && (
                          <CheckCircle2
                            size={18}
                            className="text-green-600"
                          />
                        )}
                      </div>

                      <p className="mt-3 text-sm font-semibold text-gray-900">
                        Customer
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Book sports turfs
                      </p>
                    </button>

                    {/* Owner */}
                    <button
                      type="button"
                      onClick={() => handleRoleChange("owner")}
                      aria-pressed={role === "owner"}
                      className={`rounded-xl border p-4 text-left transition-all duration-200 focus:outline-none focus:ring-4 focus:ring-green-500/10 ${
                        role === "owner"
                          ? "border-green-500 bg-green-50 shadow-sm"
                          : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                            role === "owner"
                              ? "bg-green-600 text-white"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          <Building2 size={17} />
                        </div>

                        {role === "owner" && (
                          <CheckCircle2
                            size={18}
                            className="text-green-600"
                          />
                        )}
                      </div>

                      <p className="mt-3 text-sm font-semibold text-gray-900">
                        Turf Owner
                      </p>

                      <p className="mt-1 text-xs text-gray-500">
                        Manage your turfs
                      </p>
                    </button>
                  </div>
                </fieldset>

                {/* Full name */}
                <div>
                  <label
                    htmlFor="name"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Full name
                  </label>

                  <div className="group relative">
                    <UserRound
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-green-600"
                    />

                    <input
                      id="name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Enter your full name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      maxLength={80}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>
                </div>

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

                {/* Phone */}
                <div>
                  <label
                    htmlFor="phone"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Phone number
                    <span className="ml-1.5 text-xs font-normal text-gray-400">
                      (Optional)
                    </span>
                  </label>

                  <div className="group relative">
                    <Phone
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-green-600"
                    />

                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      placeholder="+880 1XXXXXXXXX"
                      value={formData.phone}
                      onChange={handleChange}
                      disabled={isLoading}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label
                    htmlFor="password"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Password
                  </label>

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
                      autoComplete="new-password"
                      placeholder="Create a password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                      disabled={isLoading}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
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

                  {/* Password strength */}
                  {formData.password && (
                    <div className="mt-3">
                      <div
                        className="h-1.5 overflow-hidden rounded-full bg-gray-100"
                        role="progressbar"
                        aria-label="Password strength"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Number.parseInt(
                          passwordStrength.width,
                          10
                        )}
                      >
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength.color}`}
                          style={{
                            width: passwordStrength.width,
                          }}
                        />
                      </div>

                      <p
                        className={`mt-1.5 text-[11px] font-medium ${passwordStrength.text}`}
                      >
                        {passwordStrength.label}
                      </p>
                    </div>
                  )}

                  <p className="mt-2 text-xs text-gray-400">
                    Use at least 6 characters.
                  </p>
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="mb-2 block text-sm font-semibold text-gray-700"
                  >
                    Confirm password
                  </label>

                  <div className="group relative">
                    <Lock
                      size={18}
                      aria-hidden="true"
                      className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-green-600"
                    />

                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={
                        showConfirmPassword ? "text" : "password"
                      }
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={isLoading}
                      className="h-12 w-full rounded-xl border border-gray-200 bg-white pl-11 pr-12 text-sm text-gray-900 outline-none transition-all placeholder:text-gray-400 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10 disabled:cursor-not-allowed disabled:bg-gray-50"
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword((prev) => !prev)
                      }
                      disabled={isLoading}
                      aria-label={
                        showConfirmPassword
                          ? "Hide confirm password"
                          : "Show confirm password"
                      }
                      aria-pressed={showConfirmPassword}
                      className="absolute right-3.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-green-500/30 disabled:cursor-not-allowed"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {formData.confirmPassword && (
                    <p
                      className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                        formData.password === formData.confirmPassword
                          ? "text-green-600"
                          : "text-red-500"
                      }`}
                    >
                      {formData.password === formData.confirmPassword ? (
                        <>
                          <CheckCircle2 size={13} />
                          Passwords match
                        </>
                      ) : (
                        <>
                          <AlertCircle size={13} />
                          Passwords do not match
                        </>
                      )}
                    </p>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="group relative mt-3 flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-green-600 text-sm font-semibold text-white shadow-md shadow-green-600/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-green-700 hover:shadow-lg hover:shadow-green-600/20 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0"
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create account
                      <ArrowRight
                        size={17}
                        className="transition-transform duration-300 group-hover:translate-x-1"
                      />
                    </>
                  )}
                </button>
              </form>

              {/* Login link */}
              <p className="mt-7 text-center text-sm text-gray-500">
                Already have an account?{" "}
                <Link
                  to="/login"
                  className="font-semibold text-green-600 transition-colors hover:text-green-700"
                >
                  Sign in
                </Link>
              </p>

              {/* Security note */}
              <div className="mt-7 flex items-center justify-center gap-2 border-t border-gray-100 pt-6 text-xs text-gray-400">
                <ShieldCheck size={15} className="text-green-600" />
                Your account information is securely protected.
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Animations */}
      <style>{`
        @keyframes registerFadeUp {
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
            transition-duration: 0.01ms !important;
          }
        }
      `}</style>
    </main>
  );
};

export default Register;
