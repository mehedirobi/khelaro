
import { useCallback, useContext, useEffect, useState } from "react";
import {
  UserRound,
  Mail,
  Phone,
  ShieldCheck,
  Loader2,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Pencil,
} from "lucide-react";
import toast from "react-hot-toast";

import { AuthContext } from "../contexts/AuthProvider";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const getErrorMessage = async (response) => {
  try {
    const data = await response.json();
    return data.message || data.error || "Something went wrong.";
  } catch {
    return "Something went wrong. Please try again.";
  }
};

const normalizeProfile = (data, currentUser) => ({
  name: data?.name ?? currentUser?.displayName ?? "",
  email: data?.email ?? currentUser?.email ?? "",
  phone: data?.phone ?? "",
  role: data?.role ?? "owner",
});

const OwnerProfile = () => {
  const { currentUser } = useContext(AuthContext);

  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    role: "owner",
  });

  const [initialProfile, setInitialProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const [errors, setErrors] = useState({});

  const fetchProfile = useCallback(
    async (signal) => {
      if (!currentUser?.email) {
        setProfile({
          name: "",
          email: "",
          phone: "",
          role: "owner",
        });
        setInitialProfile(null);
        setLoadError("Please sign in to view your profile.");
        setLoading(false);
        return;
      }

      setLoading(true);
      setLoadError("");

      try {
        const response = await fetch(
          `${API_URL}/users/${encodeURIComponent(currentUser.email)}`,
          { signal }
        );

        if (!response.ok) {
          throw new Error(await getErrorMessage(response));
        }

        const data = await response.json();
        const normalized = normalizeProfile(
          data.user ?? data,
          currentUser
        );

        if (signal?.aborted) return;

        setProfile(normalized);
        setInitialProfile(normalized);
        setErrors({});
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Owner profile error:", error);
        setLoadError(error.message || "Failed to load your profile.");
      } finally {
        if (!signal?.aborted) {
          setLoading(false);
        }
      }
    },
    [currentUser?.email, currentUser?.displayName]
  );

  useEffect(() => {
    const controller = new AbortController();

    fetchProfile(controller.signal);

    return () => controller.abort();
  }, [fetchProfile, refreshKey]);

  const isDirty =
    initialProfile !== null &&
    (profile.name !== initialProfile.name ||
      profile.phone !== initialProfile.phone);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const nextErrors = {};
    const name = profile.name.trim();
    const phone = profile.phone.trim();

    if (!name) {
      nextErrors.name = "Full name is required.";
    } else if (name.length < 2) {
      nextErrors.name = "Name must contain at least 2 characters.";
    } else if (name.length > 80) {
      nextErrors.name = "Name cannot exceed 80 characters.";
    }

    if (phone && !/^[+\d\s()-]{7,20}$/.test(phone)) {
      nextErrors.phone = "Enter a valid phone number.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (saving || !validateForm()) return;

    if (!currentUser?.email) {
      toast.error("Please sign in again.");
      return;
    }

    try {
      setSaving(true);

      const payload = {
        name: profile.name.trim(),
        phone: profile.phone.trim(),
      };

      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(currentUser.email)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        throw new Error(await getErrorMessage(response));
      }

      const data = await response.json();

      // Support either { user: {...} } or a direct profile response.
      const returnedUser = data.user ?? data;

      const updatedProfile = {
        ...profile,
        ...returnedUser,
        name: returnedUser.name ?? payload.name,
        email: currentUser.email,
        phone: returnedUser.phone ?? payload.phone,
      };

      setProfile(updatedProfile);
      setInitialProfile(updatedProfile);
      setErrors({});

      toast.success("Profile updated successfully.");
    } catch (error) {
      console.error("Update owner profile error:", error);
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (!initialProfile) return;

    setProfile(initialProfile);
    setErrors({});
  };

  const displayName = profile.name.trim() || "Turf Owner";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  if (loading) {
    return (
      <div className="flex min-h-[360px] items-center justify-center">
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <Loader2
            size={20}
            className="animate-spin text-emerald-600"
          />
          Loading your profile...
        </div>
      </div>
    );
  }

  if (loadError && !initialProfile) {
    return (
      <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-gray-800 dark:bg-gray-900">
        <AlertCircle className="mx-auto text-red-500" size={32} />

        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-white">
          Unable to load profile
        </h2>

        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {loadError}
        </p>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
        >
          <RefreshCw size={16} />
          Try again
        </button>
      </div>
    );
  }

  return (
    <section className="mx-auto max-w-3xl space-y-6">
      {/* Page header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            My Profile
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Manage your turf owner account information.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setRefreshKey((value) => value + 1)}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      {loadError && (
        <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <AlertCircle size={18} className="mt-0.5 shrink-0" />
          <p>{loadError} Your last successfully loaded profile is still displayed.</p>
        </div>
      )}

      {/* Profile identity card */}
      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="h-24 bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-500" />

        <div className="px-5 pb-6 sm:px-7">
          <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex min-w-0 items-end gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-emerald-100 text-2xl font-bold text-emerald-700 shadow-sm dark:border-gray-900 dark:bg-emerald-500/20 dark:text-emerald-300">
                {currentUser?.photoURL ? (
                  <img
                    src={currentUser.photoURL}
                    alt={displayName}
                    referrerPolicy="no-referrer"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  avatarLetter
                )}
              </div>

              <div className="min-w-0 pb-1">
                <h2 className="break-words text-lg font-bold text-gray-900 dark:text-white">
                  {displayName}
                </h2>
                <p className="break-all text-sm text-gray-500 dark:text-gray-400">
                  {profile.email}
                </p>
              </div>
            </div>

            <span className="inline-flex w-fit items-center gap-1.5 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-semibold capitalize text-emerald-700 dark:border-emerald-500/20 dark:bg-emerald-500/10 dark:text-emerald-300">
              <ShieldCheck size={14} />
              {profile.role || "Owner"}
            </span>
          </div>

          <div className="mt-6 flex items-start gap-2 border-t border-gray-100 pt-4 text-sm text-gray-500 dark:border-gray-800 dark:text-gray-400">
            <CheckCircle2
              size={17}
              className="mt-0.5 shrink-0 text-emerald-600"
            />
            <p>
              Keep your contact details up to date so customers and the
              platform can reach you when necessary.
            </p>
          </div>
        </div>
      </div>

      {/* Profile form */}
      <form
        onSubmit={handleSubmit}
        className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-7 dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400">
            <Pencil size={19} />
          </div>

          <div>
            <h2 className="font-semibold text-gray-900 dark:text-white">
              Personal Information
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Update your name and contact number.
            </p>
          </div>
        </div>

        <div className="space-y-5">
          {/* Name */}
          <div>
            <label
              htmlFor="owner-name"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Full Name <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <UserRound
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="owner-name"
                name="name"
                type="text"
                autoComplete="name"
                value={profile.name}
                onChange={handleChange}
                maxLength={80}
                required
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "owner-name-error" : undefined}
                className={`h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:ring-4 focus:ring-emerald-500/10 dark:bg-gray-950 dark:text-white ${
                  errors.name
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-emerald-500 dark:border-gray-700"
                }`}
                placeholder="Enter your full name"
              />
            </div>

            {errors.name && (
              <p id="owner-name-error" className="mt-1.5 text-xs text-red-500">
                {errors.name}
              </p>
            )}
          </div>

          {/* Email */}
          <div>
            <label
              htmlFor="owner-email"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Email Address
            </label>

            <div className="relative">
              <Mail
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="owner-email"
                type="email"
                value={profile.email}
                readOnly
                autoComplete="email"
                className="h-12 w-full cursor-not-allowed rounded-xl border border-gray-200 bg-gray-50 pl-11 pr-4 text-sm text-gray-500 outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
              />
            </div>

            <p className="mt-1.5 text-xs text-gray-400">
              Email is read-only here because it is linked to your account.
            </p>
          </div>

          {/* Phone */}
          <div>
            <label
              htmlFor="owner-phone"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Phone Number
            </label>

            <div className="relative">
              <Phone
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="owner-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                inputMode="tel"
                value={profile.phone}
                onChange={handleChange}
                maxLength={20}
                aria-invalid={Boolean(errors.phone)}
                aria-describedby={errors.phone ? "owner-phone-error" : undefined}
                placeholder="+8801XXXXXXXXX"
                className={`h-12 w-full rounded-xl border bg-white pl-11 pr-4 text-sm text-gray-900 outline-none transition focus:ring-4 focus:ring-emerald-500/10 dark:bg-gray-950 dark:text-white ${
                  errors.phone
                    ? "border-red-400 focus:border-red-500"
                    : "border-gray-200 focus:border-emerald-500 dark:border-gray-700"
                }`}
              />
            </div>

            {errors.phone && (
              <p id="owner-phone-error" className="mt-1.5 text-xs text-red-500">
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="mt-7 flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:items-center sm:justify-between dark:border-gray-800">
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {isDirty ? (
              <span className="text-amber-600 dark:text-amber-400">
                You have unsaved changes.
              </span>
            ) : (
              "Your profile is up to date."
            )}
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            {isDirty && (
              <button
                type="button"
                onClick={handleReset}
                disabled={saving}
                className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-semibold text-gray-600 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800"
              >
                Discard Changes
              </button>
            )}

            <button
              type="submit"
              disabled={saving || !isDirty}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? (
                <Loader2 size={17} className="animate-spin" />
              ) : (
                <Save size={17} />
              )}
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </form>
    </section>
  );
};

export default OwnerProfile;
