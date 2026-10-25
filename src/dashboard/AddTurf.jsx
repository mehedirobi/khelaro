
import { useContext, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Image as ImageIcon,
  Users,
  Clock,
  Banknote,
  FileText,
  ArrowLeft,
  Plus,
  LoaderCircle,
  CheckCircle2,
  AlertCircle,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

import { AuthContext } from "../contexts/AuthProvider";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const INITIAL_FORM = {
  name: "",
  location: "",
  address: "",
  description: "",
  image: "",
  pricePerHour: "",
  capacity: "",
  openingTime: "08:00",
  closingTime: "23:00",
  facilities: "",
};

const inputClass =
  "block min-h-12 w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 disabled:cursor-not-allowed disabled:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:disabled:bg-gray-800";

const labelClass =
  "mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-200";

const FieldError = ({ children }) =>
  children ? (
    <p className="mt-1.5 flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
      <AlertCircle size={13} />
      {children}
    </p>
  ) : null;

const AddTurf = () => {
  const navigate = useNavigate();
  const { currentUser } = useContext(AuthContext);

  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [imageError, setImageError] = useState(false);

  const facilities = useMemo(
    () =>
      formData.facilities
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean),
    [formData.facilities]
  );

  const validateForm = () => {
    const nextErrors = {};

    if (formData.name.trim().length < 3) {
      nextErrors.name = "Enter a turf name with at least 3 characters.";
    }

    if (!formData.location.trim()) {
      nextErrors.location = "Location is required.";
    }

    if (!formData.address.trim()) {
      nextErrors.address = "Full address is required.";
    }

    if (formData.description.trim().length < 20) {
      nextErrors.description =
        "Description must contain at least 20 characters.";
    }

    let imageUrl;

    try {
      imageUrl = new URL(formData.image.trim());

      if (
        !["https:", "http:"].includes(imageUrl.protocol)
      ) {
        nextErrors.image = "Enter a valid HTTP or HTTPS image URL.";
      }
    } catch {
      nextErrors.image = "Enter a valid image URL.";
    }

    const price = Number(formData.pricePerHour);
    const capacity = Number(formData.capacity);

    if (
      formData.pricePerHour.trim() === "" ||
      !Number.isFinite(price) ||
      price <= 0
    ) {
      nextErrors.pricePerHour = "Price must be greater than zero.";
    }

    if (
      formData.capacity.trim() === "" ||
      !Number.isInteger(capacity) ||
      capacity < 1
    ) {
      nextErrors.capacity = "Capacity must be a positive whole number.";
    }

    if (!formData.openingTime || !formData.closingTime) {
      nextErrors.hours = "Opening and closing times are required.";
    } else if (formData.openingTime >= formData.closingTime) {
      nextErrors.hours =
        "Closing time must be later than opening time.";
    }

    setErrors(nextErrors);

    return Object.keys(nextErrors).length === 0;
  };

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => {
      if (!previous[name] && !previous.hours) return previous;

      const next = { ...previous };
      delete next[name];

      if (name === "openingTime" || name === "closingTime") {
        delete next.hours;
      }

      return next;
    });

    if (name === "image") {
      setImageError(false);
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (loading) return;

    if (!currentUser) {
      toast.error("Please sign in before adding a turf.");
      return;
    }

    if (!validateForm()) {
      toast.error("Please correct the highlighted fields.");
      return;
    }

    setLoading(true);

    try {
      const turfInfo = {
        name: formData.name.trim(),
        location: formData.location.trim(),
        address: formData.address.trim(),
        description: formData.description.trim(),
        image: formData.image.trim(),
        pricePerHour: Number(formData.pricePerHour),
        capacity: Number(formData.capacity),
        openingTime: formData.openingTime,
        closingTime: formData.closingTime,
        facilities: [...new Set(facilities)],
        ownerId: currentUser.uid,
        ownerName: currentUser.displayName || "",
        ownerEmail: currentUser.email || "",
        status: "pending",
        createdAt: new Date().toISOString(),
      };

      const response = await fetch(`${API_URL}/turfs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(turfInfo),
      });

      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(data.message || "Failed to add turf.");
      }

      toast.success("Turf submitted for approval.");
      navigate("/owner-dashboard/turfs", { replace: true });
    } catch (error) {
      console.error("Add turf error:", error);

      toast.error(
        error.message || "Unable to add turf. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const previewUrl = formData.image.trim();

  return (
    <main className="mx-auto min-w-0 max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Header */}
      <header>
        <button
          type="button"
          onClick={() => navigate("/owner-dashboard")}
          disabled={loading}
          className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-gray-500 transition hover:text-emerald-600 disabled:opacity-50 dark:text-gray-400"
        >
          <ArrowLeft size={17} />
          Back to dashboard
        </button>

        <p className="text-sm font-semibold text-emerald-600">
          Venue Management
        </p>

        <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-3xl">
          Add New Turf
        </h1>

        <p className="mt-2 max-w-2xl text-sm leading-6 text-gray-500 dark:text-gray-400">
          Provide accurate venue details so customers can discover
          your turf and request bookings.
        </p>
      </header>

      {/* Approval notice */}
      <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/40">
        <AlertCircle
          size={19}
          className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
        />

        <div>
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            Review and approval
          </p>
          <p className="mt-1 text-sm leading-5 text-amber-800 dark:text-amber-300">
            New listings are submitted as pending. Make sure the
            venue information is correct before submitting.
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="space-y-8 p-5 sm:p-8">
          {/* Basic information */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Basic Information
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Tell customers about your venue.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label htmlFor="name" className={labelClass}>
                  Turf name <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="e.g. Mirpur Football Arena"
                    minLength={3}
                    maxLength={100}
                    required
                    disabled={loading}
                    aria-invalid={Boolean(errors.name)}
                    className={`${inputClass} pl-11`}
                  />
                </div>

                <FieldError>{errors.name}</FieldError>
              </div>

              <div>
                <label htmlFor="location" className={labelClass}>
                  Area / Location <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <MapPin
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="location"
                    name="location"
                    value={formData.location}
                    onChange={handleChange}
                    placeholder="Mirpur, Dhaka"
                    required
                    disabled={loading}
                    aria-invalid={Boolean(errors.location)}
                    className={`${inputClass} pl-11`}
                  />
                </div>

                <FieldError>{errors.location}</FieldError>
              </div>

              <div>
                <label htmlFor="address" className={labelClass}>
                  Full address <span className="text-red-500">*</span>
                </label>

                <input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="Street, road, landmark"
                  required
                  disabled={loading}
                  aria-invalid={Boolean(errors.address)}
                  className={inputClass}
                />

                <FieldError>{errors.address}</FieldError>
              </div>

              <div className="md:col-span-2">
                <label htmlFor="description" className={labelClass}>
                  Description <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <FileText
                    size={18}
                    className="absolute left-3.5 top-3.5 text-gray-400"
                  />

                  <textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Describe the playing surface, environment, facilities, and what makes your venue suitable for customers..."
                    rows={5}
                    minLength={20}
                    maxLength={2000}
                    required
                    disabled={loading}
                    aria-invalid={Boolean(errors.description)}
                    className={`${inputClass} resize-y py-3 pl-11`}
                  />
                </div>

                <div className="mt-1.5 flex justify-between gap-3">
                  <FieldError>{errors.description}</FieldError>
                  <span className="ml-auto shrink-0 text-xs text-gray-400">
                    {formData.description.length}/2000
                  </span>
                </div>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Image */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Venue Image
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Add a publicly accessible image URL for your turf.
              </p>
            </div>

            <label htmlFor="image" className={labelClass}>
              Image URL <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <ImageIcon
                size={18}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
              />

              <input
                id="image"
                name="image"
                type="url"
                value={formData.image}
                onChange={handleChange}
                placeholder="https://example.com/turf-image.jpg"
                required
                disabled={loading}
                aria-invalid={Boolean(errors.image)}
                className={`${inputClass} pl-11`}
              />
            </div>

            <FieldError>{errors.image}</FieldError>

            {previewUrl && !errors.image && (
              <div className="relative mt-4 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700">
                {!imageError ? (
                  <img
                    src={previewUrl}
                    alt="Turf image preview"
                    onError={() => setImageError(true)}
                    onLoad={() => setImageError(false)}
                    className="h-52 w-full bg-gray-50 object-cover sm:h-64"
                  />
                ) : (
                  <div
                    role="status"
                    className="flex h-40 flex-col items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400"
                  >
                    <AlertCircle size={24} />
                    Image preview unavailable. Check the image URL.
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => {
                    setFormData((previous) => ({
                      ...previous,
                      image: "",
                    }));
                    setImageError(false);
                    setErrors((previous) => {
                      const next = { ...previous };
                      delete next.image;
                      return next;
                    });
                  }}
                  disabled={loading}
                  aria-label="Remove image URL"
                  className="absolute right-3 top-3 rounded-lg bg-black/60 p-2 text-white hover:bg-black/80"
                >
                  <X size={16} />
                </button>
              </div>
            )}

            <p className="mt-2 text-xs leading-5 text-gray-400">
              Use an image URL that your customers can access. A preview
              does not guarantee the server can store or serve the image.
            </p>
          </section>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Pricing and capacity */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Pricing and Capacity
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Set the hourly price and maximum player capacity.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="pricePerHour" className={labelClass}>
                  Price per hour (BDT) <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Banknote
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="pricePerHour"
                    name="pricePerHour"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.pricePerHour}
                    onChange={handleChange}
                    placeholder="1500"
                    required
                    disabled={loading}
                    aria-invalid={Boolean(errors.pricePerHour)}
                    className={`${inputClass} pl-11`}
                  />
                </div>

                <FieldError>{errors.pricePerHour}</FieldError>

                {formData.pricePerHour !== "" &&
                  Number.isFinite(Number(formData.pricePerHour)) &&
                  Number(formData.pricePerHour) > 0 && (
                    <p className="mt-2 text-xs font-medium text-emerald-600">
                      {`৳${Number(formData.pricePerHour).toLocaleString("en-BD")} per hour`}
                    </p>
                  )}
              </div>

              <div>
                <label htmlFor="capacity" className={labelClass}>
                  Player capacity <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Users
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="capacity"
                    name="capacity"
                    type="number"
                    min="1"
                    step="1"
                    value={formData.capacity}
                    onChange={handleChange}
                    placeholder="10"
                    required
                    disabled={loading}
                    aria-invalid={Boolean(errors.capacity)}
                    className={`${inputClass} pl-11`}
                  />
                </div>

                <FieldError>{errors.capacity}</FieldError>
              </div>
            </div>
          </section>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Operating hours */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Operating Hours
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Define when customers can book your venue.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <div>
                <label htmlFor="openingTime" className={labelClass}>
                  Opening time <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Clock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="openingTime"
                    name="openingTime"
                    type="time"
                    value={formData.openingTime}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="closingTime" className={labelClass}>
                  Closing time <span className="text-red-500">*</span>
                </label>

                <div className="relative">
                  <Clock
                    size={18}
                    className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400"
                  />

                  <input
                    id="closingTime"
                    name="closingTime"
                    type="time"
                    value={formData.closingTime}
                    onChange={handleChange}
                    required
                    disabled={loading}
                    className={`${inputClass} pl-11`}
                  />
                </div>
              </div>
            </div>

            <FieldError>{errors.hours}</FieldError>

            <p className="mt-2 text-xs leading-5 text-gray-400">
              This form currently supports same-day operating hours only.
              Overnight schedules require explicit backend and booking logic.
            </p>
          </section>

          <div className="border-t border-gray-100 dark:border-gray-800" />

          {/* Facilities */}
          <section>
            <div className="mb-5">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Facilities
              </h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                List the amenities available at your venue.
              </p>
            </div>

            <label htmlFor="facilities" className={labelClass}>
              Available facilities
            </label>

            <input
              id="facilities"
              name="facilities"
              value={formData.facilities}
              onChange={handleChange}
              placeholder="Parking, Floodlights, Changing Room, Washroom"
              disabled={loading}
              className={inputClass}
            />

            <p className="mt-2 text-xs text-gray-400">
              Separate facilities with commas.
            </p>

            {facilities.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {facilities.map((facility, index) => (
                  <span
                    key={`${facility}-${index}`}
                    className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-300"
                  >
                    {facility}
                  </span>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Footer */}
        <footer className="flex flex-col-reverse gap-3 border-t border-gray-100 bg-gray-50/70 p-5 dark:border-gray-800 dark:bg-gray-950/50 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <p className="text-xs leading-5 text-gray-500 dark:text-gray-400">
            <CheckCircle2
              size={15}
              className="mr-1 inline text-emerald-600"
            />
            Required fields must be completed before submission.
          </p>

          <div className="flex flex-col-reverse gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => navigate("/owner-dashboard/turfs")}
              disabled={loading}
              className="min-h-11 rounded-xl border border-gray-200 bg-white px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <LoaderCircle size={17} className="animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Submit Turf
                </>
              )}
            </button>
          </div>
        </footer>
      </form>
    </main>
  );
};

export default AddTurf;
