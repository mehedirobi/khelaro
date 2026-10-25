import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Search,
  MapPin,
  CalendarDays,
  Trophy,
  CheckCircle2,
  Sparkles,
  ArrowUpRight,
  X,
  ChevronLeft,
  ChevronRight,
  CalendarCheck,
  RotateCcw,
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

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const pad = (number) => String(number).padStart(2, "0");

const getLocalDate = () => {
  const now = new Date();
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
};

const formatDate = (isoDate) => {
  if (!isoDate) return "";

  const [year, month, day] = isoDate.split("-");
  return `${day}-${month}-${year}`;
};

const parseDate = (value) => {
  const match = value.trim().match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (!match) return null;

  const [, day, month, year] = match;
  const d = Number(day);
  const m = Number(month);
  const y = Number(year);

  const parsed = new Date(y, m - 1, d);

  if (
    parsed.getFullYear() !== y ||
    parsed.getMonth() !== m - 1 ||
    parsed.getDate() !== d
  ) {
    return null;
  }

  const isoDate = `${year}-${month}-${day}`;

  if (isoDate < getLocalDate()) return null;

  return isoDate;
};

const Hero = () => {
  const navigate = useNavigate();
  const calendarRef = useRef(null);
  const inputRef = useRef(null);

  const [location, setLocation] = useState("");
  const [dateInput, setDateInput] = useState("");
  const [sport, setSport] = useState("");
  const [error, setError] = useState("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const today = getLocalDate();
  const selectedDate = parseDate(dateInput);

  // Close the calendar when the user clicks outside it.
  useEffect(() => {
    if (!calendarOpen) return undefined;

    const handleOutsideClick = (event) => {
      if (!calendarRef.current?.contains(event.target)) {
        setCalendarOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setCalendarOpen(false);
        inputRef.current?.focus();
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("touchstart", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("touchstart", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [calendarOpen]);

  const changeDateInput = (value) => {
    const digits = value.replace(/\D/g, "").slice(0, 8);

    let formatted = digits;

    if (digits.length > 4) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(
        2,
        4
      )}-${digits.slice(4)}`;
    } else if (digits.length > 2) {
      formatted = `${digits.slice(0, 2)}-${digits.slice(2)}`;
    }

    setDateInput(formatted);
    setError("");
  };

  const selectDate = (day) => {
    const year = visibleMonth.getFullYear();
    const month = visibleMonth.getMonth();

    const isoDate = `${year}-${pad(month + 1)}-${pad(day)}`;

    if (isoDate < today) return;

    setDateInput(formatDate(isoDate));
    setError("");
    setCalendarOpen(false);
  };

  const goToPreviousMonth = () => {
    const previous = new Date(
      visibleMonth.getFullYear(),
      visibleMonth.getMonth() - 1,
      1
    );

    const currentMonth = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );

    if (previous < currentMonth) return;

    setVisibleMonth(previous);
  };

  const goToNextMonth = () => {
    setVisibleMonth(
      new Date(
        visibleMonth.getFullYear(),
        visibleMonth.getMonth() + 1,
        1
      )
    );
  };

  const handleCalendarOpen = () => {
    const parsed = parseDate(dateInput);
    const baseDate = parsed
      ? new Date(`${parsed}T12:00:00`)
      : new Date();

    setVisibleMonth(
      new Date(baseDate.getFullYear(), baseDate.getMonth(), 1)
    );

    setCalendarOpen((open) => !open);
    setError("");
  };

  const handleSearch = (event) => {
    event.preventDefault();
    setError("");

    let isoDate = "";

    if (dateInput.trim()) {
      isoDate = parseDate(dateInput);

      if (!isoDate) {
        setError(
          "Please select a valid date or enter a future date in DD-MM-YYYY format."
        );
        inputRef.current?.focus();
        return;
      }
    }

    const params = new URLSearchParams();

    if (location) params.set("area", location);
    if (sport) params.set("sport", sport);
    if (isoDate) params.set("date", isoDate);

    const query = params.toString();

    setCalendarOpen(false);
    navigate(query ? `/turfs?${query}` : "/turfs");
  };

  const clearFilters = () => {
    setLocation("");
    setDateInput("");
    setSport("");
    setError("");
    setCalendarOpen(false);
  };

  const daysInMonth = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth() + 1,
    0
  ).getDate();

  const firstDay = new Date(
    visibleMonth.getFullYear(),
    visibleMonth.getMonth(),
    1
  ).getDay();

  const calendarDays = Array.from(
    { length: firstDay + daysInMonth },
    (_, index) => (index < firstDay ? null : index - firstDay + 1)
  );

  const currentMonth = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );

  const canGoPrevious =
    visibleMonth.getTime() > currentMonth.getTime();

  return (
    <section className="relative isolate overflow-hidden bg-gray-950">
      {/* Background */}
      <div
        className="pointer-events-none absolute inset-0"
        aria-hidden="true"
      >
        <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:48px_48px]" />

        <div className="absolute -left-40 top-0 h-[420px] w-[420px] animate-[heroFloat_8s_ease-in-out_infinite] rounded-full bg-green-500/10 blur-3xl" />

        <div className="absolute -right-40 bottom-0 h-[460px] w-[460px] animate-[heroFloat_10s_ease-in-out_infinite_reverse] rounded-full bg-emerald-500/10 blur-3xl" />

        <div className="absolute left-1/2 top-1/2 h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-green-500/5 blur-3xl" />

        <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-gray-950 to-transparent" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 pb-16 pt-16 sm:px-6 sm:pb-20 sm:pt-20 lg:px-8 lg:pb-24 lg:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          {/* Badge */}
          <div className="mb-7 inline-flex animate-[heroFadeUp_600ms_ease-out] items-center gap-2 rounded-full border border-green-500/15 bg-green-500/5 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-green-400 sm:text-xs">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-60" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            Find & book turfs across Dhaka
          </div>

          {/* Heading */}
          <h1 className="animate-[heroFadeUp_700ms_ease-out] text-4xl font-extrabold leading-[1.08] tracking-[-0.035em] text-white sm:text-5xl md:text-6xl lg:text-7xl">
            Find Your Game.
            <span className="mt-1 block bg-gradient-to-r from-green-400 via-emerald-400 to-green-500 bg-clip-text text-transparent">
              Book Your Turf.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl animate-[heroFadeUp_800ms_ease-out] text-sm leading-6 text-gray-400 sm:text-base sm:leading-7 lg:text-lg">
            Discover sports venues around Dhaka, find a turf
            that matches your needs, and plan your next game.
          </p>

          {/* Search form */}
          <form
            onSubmit={handleSearch}
            className="mx-auto mt-9 max-w-5xl animate-[heroFadeUp_900ms_ease-out] rounded-3xl border border-white/10 bg-white p-2 shadow-2xl shadow-black/30 sm:mt-10 sm:p-3"
          >
            <div className="grid gap-2 md:grid-cols-[1.2fr_1fr_1fr_auto]">
              {/* Location */}
              <div className="search-field group/field">
                <MapPin
                  size={19}
                  className="shrink-0 text-green-600 transition-transform group-hover/field:scale-110"
                />

                <div className="ml-3 min-w-0 flex-1 text-left">
                  <label
                    htmlFor="hero-location"
                    className="block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400"
                  >
                    Location
                  </label>

                  <select
                    id="hero-location"
                    value={location}
                    onChange={(event) => setLocation(event.target.value)}
                    className="mt-1 w-full cursor-pointer appearance-none bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  >
                    <option value="">All locations</option>
                    {LOCATIONS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date picker */}
              <div
                ref={calendarRef}
                className="relative min-w-0"
              >
                <div className="search-field group/field">
                  <CalendarDays
                    size={19}
                    className="shrink-0 text-green-600 transition-transform group-hover/field:scale-110"
                  />

                  <div className="ml-3 min-w-0 flex-1 text-left">
                    <label
                      htmlFor="hero-date"
                      className="block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400"
                    >
                      Booking date
                    </label>

                    <input
                      ref={inputRef}
                      id="hero-date"
                      type="text"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={10}
                      placeholder="DD-MM-YYYY"
                      value={dateInput}
                      onChange={(event) =>
                        changeDateInput(event.target.value)
                      }
                      onFocus={() => {
                        if (!calendarOpen) {
                          const parsed = parseDate(dateInput);
                          const baseDate = parsed
                            ? new Date(`${parsed}T12:00:00`)
                            : new Date();

                          setVisibleMonth(
                            new Date(
                              baseDate.getFullYear(),
                              baseDate.getMonth(),
                              1
                            )
                          );
                        }
                      }}
                      aria-invalid={Boolean(error)}
                      aria-describedby={
                        error ? "hero-search-error" : undefined
                      }
                      className="mt-1 w-full min-w-0 bg-transparent text-sm font-semibold text-gray-800 outline-none placeholder:font-medium placeholder:text-gray-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleCalendarOpen}
                    aria-label={
                      calendarOpen ? "Close calendar" : "Open calendar"
                    }
                    aria-expanded={calendarOpen}
                    className="ml-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-500 transition hover:bg-green-50 hover:text-green-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500"
                  >
                    <CalendarDays size={18} />
                  </button>
                </div>

                {/* Custom calendar popup */}
                {calendarOpen && (
                  <div
                    className="calendar-popup absolute left-0 top-full z-50 mt-3 w-[min(320px,calc(100vw-48px))] rounded-2xl border border-gray-200 bg-white p-4 text-gray-800 shadow-2xl shadow-black/20 sm:left-1/2 sm:w-[320px] sm:-translate-x-1/2"
                    role="dialog"
                    aria-label="Choose booking date"
                  >
                    {/* Calendar header */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-left">
                        <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">
                          Select a date
                        </p>
                        <h3 className="mt-1 text-base font-bold text-gray-900">
                          {MONTHS[visibleMonth.getMonth()]}{" "}
                          {visibleMonth.getFullYear()}
                        </h3>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={goToPreviousMonth}
                          disabled={!canGoPrevious}
                          aria-label="Previous month"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-30"
                        >
                          <ChevronLeft size={17} />
                        </button>

                        <button
                          type="button"
                          onClick={goToNextMonth}
                          aria-label="Next month"
                          className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 transition hover:bg-gray-50"
                        >
                          <ChevronRight size={17} />
                        </button>
                      </div>
                    </div>

                    {/* Today shortcut */}
                    <button
                      type="button"
                      onClick={() => {
                        setVisibleMonth(
                          new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            1
                          )
                        );
                        setDateInput(formatDate(today));
                        setError("");
                        setCalendarOpen(false);
                      }}
                      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-green-50 px-3 py-2 text-xs font-bold text-green-700 transition hover:bg-green-100"
                    >
                      <CalendarCheck size={15} />
                      Select today
                    </button>

                    {/* Weekdays */}
                    <div className="mt-4 grid grid-cols-7 gap-1">
                      {WEEKDAYS.map((weekday) => (
                        <div
                          key={weekday}
                          className="flex h-8 items-center justify-center text-[10px] font-bold uppercase text-gray-400"
                        >
                          {weekday}
                        </div>
                      ))}

                      {calendarDays.map((day, index) => {
                        if (day === null) {
                          return (
                            <div
                              key={`empty-${index}`}
                              aria-hidden="true"
                              className="h-9"
                            />
                          );
                        }

                        const year = visibleMonth.getFullYear();
                        const month = visibleMonth.getMonth();
                        const isoDate = `${year}-${pad(month + 1)}-${pad(day)}`;
                        const disabled = isoDate < today;
                        const isSelected = selectedDate === isoDate;
                        const isToday = today === isoDate;

                        return (
                          <button
                            key={isoDate}
                            type="button"
                            disabled={disabled}
                            onClick={() => selectDate(day)}
                            aria-label={`${day} ${MONTHS[month]} ${year}`}
                            aria-pressed={isSelected}
                            className={[
                              "calendar-day flex h-9 items-center justify-center rounded-xl text-xs font-semibold transition",
                              isSelected
                                ? "bg-green-600 text-white shadow-md shadow-green-600/20"
                                : isToday
                                  ? "border border-green-500 text-green-700"
                                  : "text-gray-700 hover:bg-green-50 hover:text-green-700",
                              disabled
                                ? "cursor-not-allowed opacity-25 hover:bg-transparent"
                                : "",
                            ].join(" ")}
                          >
                            {day}
                          </button>
                        );
                      })}
                    </div>

                    {/* Calendar footer */}
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                      <p className="text-[11px] text-gray-500">
                        {dateInput && selectedDate
                          ? `Selected: ${formatDate(selectedDate)}`
                          : "Choose a future date"}
                      </p>

                      <button
                        type="button"
                        onClick={() => {
                          setDateInput("");
                          setError("");
                          setCalendarOpen(false);
                        }}
                        className="flex items-center gap-1 text-xs font-semibold text-gray-500 transition hover:text-red-600"
                      >
                        <RotateCcw size={13} />
                        Clear
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sport */}
              <div className="search-field group/field">
                <Trophy
                  size={19}
                  className="shrink-0 text-green-600 transition-transform group-hover/field:scale-110"
                />

                <div className="ml-3 min-w-0 flex-1 text-left">
                  <label
                    htmlFor="hero-sport"
                    className="block text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400"
                  >
                    Sport
                  </label>

                  <select
                    id="hero-sport"
                    value={sport}
                    onChange={(event) => setSport(event.target.value)}
                    className="mt-1 w-full cursor-pointer appearance-none bg-transparent text-sm font-semibold text-gray-800 outline-none"
                  >
                    <option value="">All sports</option>
                    {SPORTS.map((item) => (
                      <option key={item.value} value={item.value}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Search button */}
              <button
                type="submit"
                className="group/button relative flex min-h-14 items-center justify-center gap-2 overflow-hidden rounded-2xl bg-green-600 px-6 text-sm font-bold text-white shadow-lg shadow-green-600/20 transition duration-300 hover:-translate-y-0.5 hover:bg-green-700 active:translate-y-0"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Search
                    size={18}
                    strokeWidth={2.2}
                    className="transition-transform duration-300 group-hover/button:rotate-6"
                  />
                  Search
                </span>

                <span className="absolute inset-0 -translate-x-full bg-white/10 transition-transform duration-500 group-hover/button:translate-x-full" />
              </button>
            </div>

            {error && (
              <p
                id="hero-search-error"
                role="alert"
                className="mt-3 px-3 text-left text-xs font-medium text-red-600"
              >
                {error}
              </p>
            )}

            {(location || dateInput || sport) && (
              <div className="flex justify-end px-2 pb-1 pt-2">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 transition hover:text-green-700"
                >
                  <X size={14} />
                  Clear filters
                </button>
              </div>
            )}
          </form>

          <p className="mt-3 text-xs text-gray-500">
            Choose a date from the calendar or type DD-MM-YYYY.
          </p>

          {/* Trust points */}
          <div className="mt-7 flex flex-wrap justify-center gap-x-7 gap-y-3 text-xs font-medium text-gray-400 sm:text-sm">
            {[
              "Verified turfs",
              "Easy booking",
              "Secure payments",
            ].map((item) => (
              <span key={item} className="flex items-center gap-2">
                <CheckCircle2 size={15} className="text-green-500" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Decorative stats */}
        <div className="mx-auto mt-14 max-w-3xl animate-[heroFadeUp_1000ms_ease-out] sm:mt-16">
          <div className="grid grid-cols-3 overflow-hidden rounded-2xl border border-white/10 bg-white/[0.02] backdrop-blur-sm">
            <div className="px-2 py-5 text-center transition-colors hover:bg-white/[0.03] sm:py-6">
              <div className="mx-auto flex w-fit items-center gap-1.5">
                <Sparkles size={15} className="text-green-500" />
                <p className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Explore
                </p>
              </div>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">
                Sports turfs
              </p>
            </div>

            <div className="border-x border-white/10 px-2 py-5 text-center transition-colors hover:bg-white/[0.03] sm:py-6">
              <p className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                Dhaka
              </p>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">
                Local venues
              </p>
            </div>

            <div className="px-2 py-5 text-center transition-colors hover:bg-white/[0.03] sm:py-6">
              <div className="mx-auto flex w-fit items-center gap-1.5">
                <p className="text-xl font-extrabold tracking-tight text-white sm:text-2xl">
                  Book
                </p>
                <ArrowUpRight
                  size={15}
                  className="text-green-500 transition-transform hover:-translate-y-0.5"
                />
              </div>
              <p className="mt-1 text-[10px] font-medium uppercase tracking-wider text-gray-500 sm:text-xs">
                Your next game
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div
        className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-gray-950 to-transparent"
        aria-hidden="true"
      />

      <style>{`
        .search-field {
          display: flex;
          min-height: 60px;
          min-width: 0;
          align-items: center;
          border-radius: 1rem;
          background: #f9fafb;
          padding: 0.75rem 1rem;
          transition: background-color 200ms ease, box-shadow 200ms ease;
        }

        .search-field:hover {
          background: #f3f4f6;
        }

        .search-field:focus-within {
          background: #fff;
          box-shadow: 0 0 0 2px rgba(22, 163, 74, 0.18);
        }

        .calendar-popup {
          animation: calendarEnter 160ms ease-out;
        }

        @keyframes calendarEnter {
          from {
            opacity: 0;
            transform: translateY(-5px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroFadeUp {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes heroFloat {
          0%, 100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(0, -18px, 0);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          *, *::before, *::after {
            animation-duration: 0.01ms !important;
            animation-iteration-count: 1 !important;
            transition-duration: 0.01ms !important;
            scroll-behavior: auto !important;
          }
        }
      `}</style>
    </section>
  );
};

export default Hero;