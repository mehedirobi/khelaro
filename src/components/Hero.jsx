
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  CalendarDays,
  Trophy,
  CheckCircle2,
  ArrowRight,
  X,
} from "lucide-react";

const LOCATIONS = [
  { label: "Mirpur", value: "mirpur" },
  { label: "Uttara", value: "uttara" },
  { label: "Mohammadpur", value: "mohammadpur" },
  { label: "Dhanmondi", value: "dhanmondi" },
  { label: "Badda", value: "badda" },
  { label: "Bashundhara", value: "bashundhara" },
];

const SPORTS = [
  { label: "Football", value: "football" },
  { label: "Cricket", value: "cricket" },
  { label: "Badminton", value: "badminton" },
];

const getLocalDate = () => {
  const now = new Date();
  const pad = (value) => String(value).padStart(2, "0");

  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
};

const Hero = () => {
  const navigate = useNavigate();

  const [location, setLocation] = useState("");
  const [date, setDate] = useState("");
  const [sport, setSport] = useState("");

  const [error, setError] = useState("");

  const hasFilters = Boolean(location || date || sport);

  const handleSearch = (event) => {
    event.preventDefault();
    setError("");

    if (date && date < getLocalDate()) {
      setError("Please select today or a future date.");
      return;
    }

    const params = new URLSearchParams();

    if (location) params.set("area", location);
    if (sport) params.set("sport", sport);
    if (date) params.set("date", date);

    const query = params.toString();

    navigate(query ? `/turfs?${query}` : "/turfs");
  };

  const clearFilters = () => {
    setLocation("");
    setDate("");
    setSport("");
    setError("");
  };

  const searchFields = [
    {
      icon: MapPin,
      label: "Location",
      color: "text-emerald-600",
      bg: "bg-emerald-50",
      value: location,
      placeholder: "All locations",
      options: LOCATIONS,
      onChange: setLocation,
      id: "hero-location",
    },
    {
      icon: Trophy,
      label: "Sport",
      color: "text-violet-600",
      bg: "bg-violet-50",
      value: sport,
      placeholder: "All sports",
      options: SPORTS,
      onChange: setSport,
      id: "hero-sport",
    },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-emerald-50/70 via-white to-white">

      {/* Subtle Background Decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-emerald-100/50 blur-3xl"
      />

      <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">

        {/* Hero Content */}
        <div className="mx-auto max-w-4xl text-center">

          {/* Badge */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-3.5 py-2 text-xs font-semibold text-emerald-700 shadow-sm">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Your Game Starts Here
          </div>

          {/* Heading */}
          <h1 className="text-4xl font-extrabold leading-[1.15] tracking-tight text-gray-950 sm:text-5xl md:text-6xl">
            Find Your Game.
            <span className="mt-1 block text-emerald-600">
              Book Your Turf.
            </span>
          </h1>

          {/* Description */}
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-500 sm:text-base">
            Discover the best sports turfs around Dhaka. Choose
            your favorite sport, find the perfect venue, and book
            your next game effortlessly.
          </p>
        </div>

        {/* Search Form */}
        <div className="mx-auto mt-10 max-w-5xl sm:mt-12">
          <form
            onSubmit={handleSearch}
            className="rounded-2xl border border-gray-200/80 bg-white p-3 shadow-[0_12px_40px_rgba(0,0,0,0.06)] sm:p-4"
          >
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto]">

              {/* Location & Sport Fields */}
              {searchFields.slice(0, 1).map((field) => {
                const Icon = field.icon;

                return (
                  <div
                    key={field.id}
                    className="search-input-group"
                  >
                    <div className={`search-icon ${field.bg}`}>
                      <Icon size={19} className={field.color} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={field.id}
                        className="search-label"
                      >
                        {field.label}
                      </label>

                      <select
                        id={field.id}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.value)
                        }
                        className="search-control"
                      >
                        <option value="">
                          {field.placeholder}
                        </option>

                        {field.options.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}

              {/* Booking Date */}
              <div className="search-input-group">
                <div className="search-icon bg-blue-50">
                  <CalendarDays
                    size={19}
                    className="text-blue-600"
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <label
                    htmlFor="hero-date"
                    className="search-label"
                  >
                    Booking Date
                  </label>

                  <input
                    id="hero-date"
                    type="date"
                    value={date}
                    min={getLocalDate()}
                    onChange={(event) => {
                      setDate(event.target.value);
                      setError("");
                    }}
                    className="search-control"
                  />
                </div>
              </div>

              {/* Sport */}
              {searchFields.slice(1).map((field) => {
                const Icon = field.icon;

                return (
                  <div
                    key={field.id}
                    className="search-input-group"
                  >
                    <div className={`search-icon ${field.bg}`}>
                      <Icon size={19} className={field.color} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <label
                        htmlFor={field.id}
                        className="search-label"
                      >
                        {field.label}
                      </label>

                      <select
                        id={field.id}
                        value={field.value}
                        onChange={(event) =>
                          field.onChange(event.target.value)
                        }
                        className="search-control"
                      >
                        <option value="">
                          {field.placeholder}
                        </option>

                        {field.options.map((option) => (
                          <option
                            key={option.value}
                            value={option.value}
                          >
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              })}

              {/* Search Button */}
              <button
                type="submit"
                className="flex min-h-[62px] items-center justify-center gap-2 rounded-xl bg-emerald-600 px-7 text-sm font-bold text-white shadow-sm transition-all duration-200 hover:bg-emerald-700 hover:shadow-md active:scale-[0.98] lg:min-w-[135px]"
              >
                <Search size={18} />
                Search
              </button>
            </div>

            {/* Error */}
            {error && (
              <p
                role="alert"
                className="mt-3 px-2 text-xs font-medium text-red-600"
              >
                {error}
              </p>
            )}

            {/* Clear Filters */}
            {hasFilters && (
              <div className="mt-3 flex justify-end border-t border-gray-100 pt-3">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 transition-colors hover:text-red-600"
                >
                  <X size={14} />
                  Clear filters
                </button>
              </div>
            )}
          </form>

          {/* Search Hint */}
          <p className="mt-3 text-center text-xs text-gray-400">
            Find the right venue for your next game.
          </p>
        </div>

        {/* Trust Indicators */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-x-7 gap-y-3">
          {[
            "Easy Turf Discovery",
            "Simple Booking",
            "Multiple Sports",
          ].map((item) => (
            <div
              key={item}
              className="flex items-center gap-2 text-xs font-medium text-gray-500 sm:text-sm"
            >
              <CheckCircle2
                size={16}
                className="shrink-0 text-emerald-600"
              />
              {item}
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <button
            type="button"
            onClick={() => navigate("/turfs")}
            className="group inline-flex items-center gap-2 text-sm font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
          >
            Explore all turfs
            <ArrowRight
              size={16}
              className="transition-transform duration-200 group-hover:translate-x-1"
            />
          </button>
        </div>
      </div>

      {/* Search Field Styles */}
      <style>{`
        .search-input-group {
          display: flex;
          min-width: 0;
          min-height: 62px;
          align-items: center;
          gap: 12px;
          border: 1px solid #f3f4f6;
          border-radius: 12px;
          background: #f9fafb;
          padding: 10px 14px;
          transition: all 200ms ease;
        }

        .search-input-group:hover {
          border-color: #d1fae5;
          background: #f7fdf9;
        }

        .search-input-group:focus-within {
          border-color: #86efac;
          background: white;
          box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.08);
        }

        .search-icon {
          display: flex;
          width: 38px;
          height: 38px;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
        }

        .search-label {
          display: block;
          margin-bottom: 3px;
          color: #9ca3af;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.07em;
          text-transform: uppercase;
        }

        .search-control {
          display: block;
          width: 100%;
          min-width: 0;
          border: none;
          background: transparent;
          color: #1f2937;
          font-size: 13px;
          font-weight: 600;
          outline: none;
        }

        .search-control option {
          background: white;
          color: #1f2937;
        }

        .search-control:focus-visible {
          outline: none;
        }

        @media (prefers-reduced-motion: reduce) {
          .search-input-group,
          button {
            transition: none !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;
