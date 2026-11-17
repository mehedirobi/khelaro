
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Search,
  MapPin,
  CheckCircle2,
} from "lucide-react";

const benefits = [
  "Verified turf listings",
  "Easy booking process",
  "Flexible playing slots",
];

const FinalCTA = () => {
  return (
    <section
      aria-labelledby="final-cta-heading"
      className="relative overflow-hidden bg-gray-50 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24"
    >
      <div className="mx-auto max-w-6xl">
        <div className="relative isolate overflow-hidden rounded-3xl border border-emerald-100 bg-white px-6 py-14 text-center shadow-sm shadow-emerald-950/[0.03] sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          {/* Background decoration */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-24 -top-28 -z-10 h-80 w-80 rounded-full bg-emerald-100/70 blur-3xl"
          />

          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-24 -z-10 h-72 w-72 rounded-full bg-green-100/60 blur-3xl"
          />

          <div className="mx-auto max-w-2xl">
            {/* Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 text-emerald-600">
              <Search size={24} strokeWidth={2} />
            </div>

            {/* Badge */}
            <div className="mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3.5 py-1.5 text-xs font-semibold text-emerald-700">
              <MapPin size={14} />
              Your next game starts here
            </div>

            {/* Heading */}
            <h2
              id="final-cta-heading"
              className="mt-6 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl"
            >
              Ready for your{" "}
              <span className="text-emerald-600">next game?</span>
            </h2>

            {/* Description */}
            <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-gray-600 sm:text-base">
              Discover nearby turfs, explore playing options, and book
              your preferred slot. Your next game is just a few clicks away.
            </p>

            {/* Benefits */}
            <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-3">
              {benefits.map((benefit) => (
                <li
                  key={benefit}
                  className="flex items-center gap-2 text-xs font-medium text-gray-600 sm:text-sm"
                >
                  <CheckCircle2
                    size={16}
                    className="shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                  {benefit}
                </li>
              ))}
            </ul>

            {/* CTA */}
            <Link
              to="/turfs"
              className="group mt-9 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-7 py-3.5 text-sm font-bold text-white shadow-md shadow-emerald-600/15 transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-600 focus-visible:ring-offset-2"
            >
              Find a Turf

              <ArrowRight
                size={17}
                strokeWidth={2.2}
                className="transition-transform duration-200 group-hover:translate-x-1"
                aria-hidden="true"
              />
            </Link>

            <p className="mt-4 text-xs text-gray-400">
              Find your ground. Book your game. Play more.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FinalCTA;
