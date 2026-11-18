
import {
  User,
  Mail,
  Phone,
  MapPin,
  Camera,
  Save,
  X,
  ArrowLeft,
  ShieldCheck,
  CheckCircle2,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import Swal from "sweetalert2";
import useAuth from "../hooks/useAuth";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/$/, "");

const CLOUDINARY_CLOUD_NAME =
  import.meta.env.VITE_CLOUDINARY_CLOUD_NAME;

const UPLOAD_PRESET =
  import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET;

const CLOUDINARY_URL = CLOUDINARY_CLOUD_NAME
  ? `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`
  : "";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024;

const INITIAL_FORM = {
  name: "",
  email: "",
  phone: "",
  location: "",
  photoURL: "",
};

const SWAL_CONFIG = {
  confirmButtonColor: "#16a34a",
  customClass: {
    popup: "rounded-2xl",
    confirmButton: "rounded-lg px-5 py-2.5",
  },
};

const Profile = () => {
  const { currentUser, loading: authLoading } = useAuth();

  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photoError, setPhotoError] = useState(false);

  const userEmail = currentUser?.email?.trim().toLowerCase() || "";

  // Load profile
  useEffect(() => {
    if (authLoading) return;

    if (!userEmail) {
      setLoading(false);
      return;
    }

    const controller = new AbortController();

    const loadProfile = async () => {
      setLoading(true);

      try {
        const response = await fetch(
          `${API_URL}/users/${encodeURIComponent(userEmail)}`,
          { signal: controller.signal }
        );

        const data = await response.json().catch(() => ({}));

        if (!response.ok) {
          throw new Error(data?.message || "Failed to load profile.");
        }

        const user = data?.user || {};

        setFormData({
          name: user.name || currentUser?.displayName || "",
          email: user.email || userEmail,
          phone: user.phone || "",
          location: user.location || "",
          photoURL: user.photoURL || currentUser?.photoURL || "",
        });

        setPhotoError(false);
      } catch (error) {
        if (error.name === "AbortError") return;

        console.error("Load profile error:", error);

        Swal.fire({
          ...SWAL_CONFIG,
          icon: "error",
          title: "Unable to load profile",
          text: error.message || "Please try again later.",
        });
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    };

    loadProfile();

    return () => controller.abort();
  }, [
    authLoading,
    userEmail,
    currentUser?.displayName,
    currentUser?.photoURL,
  ]);

  // Form change
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  // Upload profile photo
  const handleImageSelect = async (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const resetInput = () => {
      event.target.value = "";
    };

    if (!CLOUDINARY_URL || !UPLOAD_PRESET) {
      await Swal.fire({
        ...SWAL_CONFIG,
        icon: "error",
        title: "Upload unavailable",
        text: "Cloudinary is not configured correctly.",
      });

      resetInput();
      return;
    }

    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      await Swal.fire({
        ...SWAL_CONFIG,
        icon: "warning",
        title: "Invalid image format",
        text: "Please select a JPG, PNG, or WebP image.",
      });

      resetInput();
      return;
    }

    if (file.size > MAX_IMAGE_SIZE) {
      await Swal.fire({
        ...SWAL_CONFIG,
        icon: "warning",
        title: "Image too large",
        text: "Please select an image smaller than 5MB.",
      });

      resetInput();
      return;
    }

    try {
      setUploading(true);

      const uploadData = new FormData();

      uploadData.append("file", file);
      uploadData.append("upload_preset", UPLOAD_PRESET);

      const response = await fetch(CLOUDINARY_URL, {
        method: "POST",
        body: uploadData,
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok || !data?.secure_url) {
        throw new Error(
          data?.error?.message || "Image upload failed."
        );
      }

      setFormData((previous) => ({
        ...previous,
        photoURL: data.secure_url,
      }));

      setPhotoError(false);
    } catch (error) {
      console.error("Image upload error:", error);

      Swal.fire({
        ...SWAL_CONFIG,
        icon: "error",
        title: "Upload failed",
        text: error.message || "Could not upload your profile photo.",
      });
    } finally {
      setUploading(false);
      resetInput();
    }
  };

  // Remove photo
  const handleRemovePhoto = () => {
    setFormData((previous) => ({
      ...previous,
      photoURL: "",
    }));

    setPhotoError(false);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Save profile
  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!userEmail || saving || uploading) return;

    const name = formData.name.trim();
    const phone = formData.phone.trim();
    const location = formData.location.trim();

    if (!name) {
      Swal.fire({
        ...SWAL_CONFIG,
        icon: "warning",
        title: "Name required",
        text: "Please enter your full name.",
      });

      return;
    }

    try {
      setSaving(true);

      const payload = {
        name,
        phone,
        location,
        photoURL: formData.photoURL,
      };

      const response = await fetch(
        `${API_URL}/users/${encodeURIComponent(userEmail)}`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data?.message || "Failed to update profile.");
      }

      const updatedUser = data?.user || {};

      const updatedFormData = {
        name: updatedUser.name ?? name,
        email: updatedUser.email ?? userEmail,
        phone: updatedUser.phone ?? phone,
        location: updatedUser.location ?? location,
        photoURL: updatedUser.photoURL ?? formData.photoURL,
      };

      setFormData(updatedFormData);
      setPhotoError(false);

      localStorage.setItem(
        "khelaro-user",
        JSON.stringify({
          ...updatedUser,
          ...updatedFormData,
        })
      );

      await Swal.fire({
        ...SWAL_CONFIG,
        icon: "success",
        title: "Profile updated",
        text: "Your personal information has been saved successfully.",
        timer: 1700,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Update profile error:", error);

      Swal.fire({
        ...SWAL_CONFIG,
        icon: "error",
        title: "Update failed",
        text: error.message || "Something went wrong.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Loading
  if (authLoading || loading) {
    return <LoadingState message="Loading your profile..." />;
  }

  // Authentication
  if (!currentUser) {
    return (
      <main className="flex min-h-[65vh] items-center justify-center px-4">
        <div className="w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-green-50 text-green-600">
            <User size={25} />
          </div>

          <h2 className="mt-5 text-xl font-bold text-gray-900">
            Login required
          </h2>

          <p className="mt-2 text-sm leading-6 text-gray-500">
            Please sign in to access and manage your profile.
          </p>

          <Link
            to="/login"
            className="mt-6 inline-flex h-11 w-full items-center justify-center rounded-xl bg-green-600 px-5 text-sm font-semibold text-white transition hover:bg-green-700"
          >
            Sign In
          </Link>
        </div>
      </main>
    );
  }

  const profileInitial =
    formData.name.trim().charAt(0).toUpperCase() || "U";

  const hasPhoto = Boolean(formData.photoURL) && !photoError;

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">

      {/* Page Header */}
      <header className="mb-8">
        <Link
          to="/turfs"
          className="mb-6 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-green-600"
        >
          <ArrowLeft size={17} />
          Back to Home
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-green-600">
              <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
              Account Settings
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
              My Profile
            </h1>

            <p className="mt-2 max-w-lg text-sm leading-6 text-gray-500">
              Manage your personal information and keep your account details up to date.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-green-100 bg-green-50 px-3 py-2 text-xs font-semibold text-green-700">
            <ShieldCheck size={15} />
            Account Profile
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="grid items-start gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">

        {/* Profile Sidebar */}
        <aside className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Profile Cover */}
          <div className="h-24 bg-gradient-to-r from-green-700 via-green-600 to-emerald-500">
            <div className="h-full w-full bg-[radial-gradient(circle_at_80%_20%,rgba(255,255,255,0.18),transparent_35%)]" />
          </div>

          <div className="px-6 pb-6">

            {/* Avatar */}
            <div className="-mt-12 flex items-end justify-between">
              <div className="relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-green-50 text-3xl font-bold text-green-700 shadow-sm">
                {hasPhoto ? (
                  <img
                    src={formData.photoURL}
                    alt={`${formData.name || "User"} profile`}
                    className="h-full w-full object-cover"
                    onError={() => setPhotoError(true)}
                  />
                ) : (
                  profileInitial
                )}
              </div>

              <div className="mb-1 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  aria-label="Upload profile photo"
                  className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-600 shadow-sm transition hover:border-green-200 hover:bg-green-50 hover:text-green-600 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {uploading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-green-200 border-t-green-600" />
                  ) : (
                    <Camera size={18} />
                  )}
                </button>

                {formData.photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    disabled={uploading}
                    aria-label="Remove profile photo"
                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-400 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500 disabled:opacity-50"
                  >
                    <X size={17} />
                  </button>
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handleImageSelect}
                className="hidden"
                aria-label="Choose profile photo"
              />
            </div>

            {/* User Details */}
            <div className="mt-4">
              <h2 className="truncate text-lg font-bold text-gray-900">
                {formData.name || "Your Name"}
              </h2>

              <p className="mt-1 truncate text-sm text-gray-500">
                {formData.email}
              </p>

              <div className="mt-4 flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700">
                  <CheckCircle2 size={13} />
                  Active Player
                </span>
              </div>

              <p className="mt-3 text-xs leading-5 text-gray-400">
                Upload a JPG, PNG, or WebP image. Maximum file size: 5MB.
              </p>
            </div>

            <div className="my-6 border-t border-gray-100" />

            {/* Contact Information */}
            <div>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                Contact Information
              </h3>

              <div className="space-y-4">
                <ProfileInfo
                  icon={Mail}
                  label="Email Address"
                  value={formData.email}
                />

                <ProfileInfo
                  icon={Phone}
                  label="Phone Number"
                  value={formData.phone || "Not provided"}
                />

                <ProfileInfo
                  icon={MapPin}
                  label="Location"
                  value={formData.location || "Not provided"}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Profile Form */}
        <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">

          {/* Form Header */}
          <div className="border-b border-gray-100 px-5 py-5 sm:px-7">
            <h2 className="text-base font-bold text-gray-900 sm:text-lg">
              Personal Information
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Update your personal details and contact information.
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="space-y-6 p-5 sm:p-7">

              {/* Basic Details */}
              <div>
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Basic Details
                  </h3>
                  <p className="mt-1 text-xs text-gray-400">
                    Your name and registered email address.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <InputField
                    id="name"
                    name="name"
                    label="Full Name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter your full name"
                    icon={User}
                    required
                  />

                  <InputField
                    id="email"
                    name="email"
                    label="Email Address"
                    type="email"
                    value={formData.email}
                    icon={Mail}
                    disabled
                  />
                </div>

                <p className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                  <ShieldCheck size={13} />
                  Your registered email address cannot be changed.
                </p>
              </div>

              <div className="border-t border-gray-100" />

              {/* Contact Details */}
              <div>
                <div className="mb-5">
                  <h3 className="text-sm font-semibold text-gray-800">
                    Contact Details
                  </h3>
                  <p className="mt-1 text-xs text-gray-400">
                    Help us keep your contact information up to date.
                  </p>
                </div>

                <div className="grid gap-5 sm:grid-cols-2">
                  <InputField
                    id="phone"
                    name="phone"
                    label="Phone Number"
                    type="tel"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="+880 1XXXXXXXXX"
                    icon={Phone}
                    autoComplete="tel"
                  />

                  <InputField
                    id="location"
                    name="location"
                    label="Location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Dhaka, Bangladesh"
                    icon={MapPin}
                    autoComplete="address-level2"
                  />
                </div>
              </div>
            </div>

            {/* Form Footer */}
            <div className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/70 px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-7">
              <p className="text-xs text-gray-400">
                Make sure your information is accurate.
              </p>

              <button
                type="submit"
                disabled={saving || uploading}
                className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-green-600 px-5 text-sm font-semibold text-white shadow-sm shadow-green-600/10 transition duration-200 hover:bg-green-700 hover:shadow-md hover:shadow-green-600/20 focus:outline-none focus:ring-4 focus:ring-green-500/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                    Saving Changes...
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    Save Changes
                  </>
                )}
              </button>
            </div>
          </form>
        </section>
      </div>
    </main>
  );
};

// Loading State
const LoadingState = ({ message }) => (
  <main className="flex min-h-[65vh] items-center justify-center px-4">
    <div className="text-center">
      <div className="mx-auto h-10 w-10 animate-spin rounded-full border-[3px] border-green-100 border-t-green-600" />

      <p className="mt-4 text-sm font-medium text-gray-500">
        {message}
      </p>
    </div>
  </main>
);

// Profile Information
const ProfileInfo = ({ icon: Icon, label, value }) => (
  <div className="flex min-w-0 items-start gap-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
      <Icon size={16} />
    </div>

    <div className="min-w-0 flex-1">
      <p className="text-xs font-medium text-gray-400">{label}</p>
      <p className="mt-1 break-words text-sm font-medium text-gray-700">
        {value}
      </p>
    </div>
  </div>
);

// Reusable Input
const InputField = ({
  id,
  name,
  label,
  type = "text",
  value = "",
  onChange,
  placeholder,
  icon: Icon,
  disabled = false,
  required = false,
  autoComplete,
}) => (
  <div className="min-w-0">
    <label
      htmlFor={id}
      className="mb-2 block text-sm font-semibold text-gray-700"
    >
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </label>

    <div className="relative">
      <Icon
        size={17}
        aria-hidden="true"
        className={`pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 ${
          disabled ? "text-gray-300" : "text-gray-400"
        }`}
      />

      <input
        id={id}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        autoComplete={
          autoComplete ||
          (id === "name"
            ? "name"
            : id === "email"
              ? "email"
              : "off")
        }
        className={`h-12 w-full rounded-xl border pl-10 pr-4 text-sm outline-none transition-all duration-200 placeholder:text-gray-400 ${
          disabled
            ? "cursor-not-allowed border-gray-100 bg-gray-50 text-gray-500"
            : "border-gray-200 bg-white text-gray-900 hover:border-gray-300 focus:border-green-500 focus:ring-4 focus:ring-green-500/10"
        }`}
      />
    </div>
  </div>
);

export default Profile;
