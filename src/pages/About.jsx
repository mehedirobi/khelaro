
import { Link } from "react-router-dom";
import {
  ArrowRight,
  CheckCircle2,
  MapPin,
  ShieldCheck,
  Clock3,
  Users,
  Target,
  Zap,
} from "lucide-react";

const features = [
  {
    icon: MapPin,
    title: "Find Nearby Turfs",
    description:
      "Discover sports turfs across Dhaka based on your preferred location, sport, and availability.",
  },
  {
    icon: Clock3,
    title: "Easy Slot Booking",
    description:
      "Choose your preferred date and time slot and book your game in just a few simple steps.",
  },
  {
    icon: ShieldCheck,
    title: "Reliable Booking",
    description:
      "Access clear booking information and manage your reservations without unnecessary hassle.",
  },
];

const values = [
  "Simple and transparent booking",
  "Verified turf listings",
  "Clear pricing and availability",
  "A better experience for players and owners",
];

const missionCards = [
  {
    icon: Users,
    title: "For Players",
    description:
      "Discover, compare, and book sports turfs with less effort.",
    iconClass: "bg-blue-50 text-blue-600",
  },
  {
    icon: Target,
    title: "For Owners",
    description:
      "Manage turf listings, bookings, schedules, and revenue in one place.",
    iconClass: "bg-purple-50 text-purple-600",
  },
  {
    icon: Zap,
    title: "Simple Experience",
    description:
      "Enjoy a streamlined booking process designed around your needs.",
    iconClass: "bg-amber-50 text-amber-600",
  },
  {
    icon: ShieldCheck,
    title: "Trusted Platform",
    description:
      "Make informed booking decisions with clear and reliable information.",
    iconClass: "bg-emerald-50 text-emerald-600",
  },
];

const About = () => {
  return (
    <main className="overflow-hidden bg-white">
      {/* Hero Section */}
      <section className="relative border-b border-gray-100 bg-gradient-to-b from-emerald-50/70 to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 shadow-sm">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              About Khelaro
            </span>

            <h1 className="mt-6 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              Making sports turf booking{" "}
              <span className="text-emerald-600">simple.</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base sm:leading-8">
              Khelaro is a modern turf discovery and booking platform
              built for sports lovers in Dhaka. Find the right turf,
              check availability, and book your next game with ease.
            </p>

            <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
              <Link
                to="/turfs"
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow-md shadow-emerald-600/15 transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Explore Turfs
                <ArrowRight
                  size={17}
                  className="transition-transform group-hover:translate-x-1"
                />
              </Link>

              <Link
                to="/contact"
                className="inline-flex items-center justify-center rounded-xl border border-gray-200 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
              >
                Get in Touch
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
              Our Mission
            </p>

            <h2 className="mt-3 text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl">
              Spend less time searching.
              <span className="block text-emerald-600">
                Spend more time playing.
              </span>
            </h2>

            <p className="mt-5 text-sm leading-7 text-gray-600 sm:text-base">
              Finding a good sports turf should not require endless
              phone calls, messages, or uncertainty about available
              slots. Khelaro brings turf discovery and booking into
              one convenient platform.
            </p>

            <p className="mt-4 text-sm leading-7 text-gray-600 sm:text-base">
              Our goal is to create a reliable marketplace where
              players can confidently book their games and turf
              owners can efficiently manage their facilities.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {missionCards.map((card) => {
              const Icon = card.icon;

              return (
                <article
                  key={card.title}
                  className="rounded-2xl border border-gray-100 bg-gray-50/70 p-5 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:bg-white hover:shadow-lg hover:shadow-gray-200/50 sm:p-6"
                >
                  <div
                    className={`flex h-11 w-11 items-center justify-center rounded-xl ${card.iconClass}`}
                  >
                    <Icon size={21} strokeWidth={2} />
                  </div>

                  <h3 className="mt-4 text-base font-semibold text-gray-900">
                    {card.title}
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-gray-500">
                    {card.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Why Khelaro Section */}
      <section className="border-y border-gray-100 bg-gray-50/70">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
              Why Khelaro
            </p>

            <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Built around the way you play
            </h2>

            <p className="mt-4 text-sm leading-7 text-gray-500 sm:text-base">
              From discovering a turf to booking your next session,
              every step is designed to make your experience easier.
            </p>
          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <article
                  key={feature.title}
                  className="rounded-2xl border border-gray-100 bg-white p-6 transition-all duration-300 hover:-translate-y-1 hover:border-emerald-100 hover:shadow-lg hover:shadow-gray-200/50"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                    <Icon size={22} strokeWidth={2} />
                  </div>

                  <h3 className="mt-5 text-base font-semibold text-gray-900">
                    {feature.title}
                  </h3>

                  <p className="mt-2 text-sm leading-7 text-gray-500">
                    {feature.description}
                  </p>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
            What We Believe
          </p>

          <h2 className="mt-3 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
            A better way to book your game
          </h2>

          <p className="mt-4 text-sm leading-7 text-gray-500 sm:text-base">
            We are building Khelaro around convenience,
            transparency, and a better sports experience.
          </p>
        </div>

        <div className="mx-auto mt-10 grid max-w-3xl gap-3 sm:grid-cols-2">
          {values.map((value) => (
            <div
              key={value}
              className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 transition-colors hover:border-emerald-100 hover:bg-emerald-50/40"
            >
              <CheckCircle2
                size={19}
                className="shrink-0 text-emerald-600"
                strokeWidth={2}
              />

              <span className="text-sm font-medium text-gray-700">
                {value}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-emerald-600">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 sm:py-16 lg:px-8">
          <h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl">
            Ready to find your next game?
          </h2>

          <p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-emerald-50 sm:text-base">
            Explore sports turfs across Dhaka and book your next
            session with Khelaro.
          </p>

          <Link
            to="/turfs"
            className="group mt-7 inline-flex items-center justify-center gap-2 rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-emerald-600"
          >
            Find a Turf
            <ArrowRight
              size={17}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default About;
