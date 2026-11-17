
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  CalendarRange,
  Store,
  CheckCircle2,
} from "lucide-react";

const features = [
  {
    icon: Store,
    title: "Manage Your Turf",
    description:
      "Keep your venue information, pricing, and facilities updated.",
    iconClass: "bg-blue-50 text-blue-600",
  },
  {
    icon: CalendarRange,
    title: "Manage Bookings",
    description:
      "Control available slots and manage customer bookings easily.",
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: BarChart3,
    title: "Track Performance",
    description:
      "Monitor bookings and revenue from your owner dashboard.",
    iconClass: "bg-purple-50 text-purple-600",
  },
];

const benefits = [
  "Easy turf management",
  "Booking control",
  "Business insights",
];

const OwnerCTA = () => {
  return (
    <section className="bg-white py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50 via-white to-white">
          <div className="grid lg:grid-cols-[1.05fr_0.95fr]">

            {/* Main Content */}
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-12 xl:p-14">
              <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-100 bg-white px-3.5 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                For Turf Owners
              </span>

              <h2 className="mt-6 max-w-xl text-3xl font-bold leading-tight tracking-tight text-gray-900 sm:text-4xl lg:text-[42px]">
                Turn your turf into a{" "}
                <span className="text-emerald-600">
                  smarter business.
                </span>
              </h2>

              <p className="mt-5 max-w-lg text-sm leading-7 text-gray-600 sm:text-base">
                List your venue on Khelaro, manage bookings,
                control availability, and keep track of your
                business from one convenient dashboard.
              </p>

              {/* Benefits */}
              <div className="mt-7 flex flex-wrap gap-x-5 gap-y-3">
                {benefits.map((benefit) => (
                  <span
                    key={benefit}
                    className="inline-flex items-center gap-2 text-xs font-medium text-gray-600 sm:text-sm"
                  >
                    <CheckCircle2
                      size={16}
                      className="shrink-0 text-emerald-600"
                    />
                    {benefit}
                  </span>
                ))}
              </div>

              {/* CTA */}
              <div className="mt-9">
                <Link
                  to="/register?role=owner"
                  className="group inline-flex items-center justify-center gap-2.5 rounded-xl bg-emerald-600 px-6 py-3.5 text-sm font-semibold text-white shadow-md shadow-emerald-600/15 transition-all duration-300 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-lg hover:shadow-emerald-600/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                >
                  List Your Turf

                  <ArrowRight
                    size={17}
                    className="transition-transform duration-300 group-hover:translate-x-1"
                  />
                </Link>

                <p className="mt-3 text-xs text-gray-400">
                  Join Khelaro as a turf owner.
                </p>
              </div>
            </div>

            {/* Feature Panel */}
            <div className="border-t border-emerald-100 bg-white/70 p-6 sm:p-8 lg:border-l lg:border-t-0 lg:p-10">
              <div className="mb-7">
                <p className="text-sm font-semibold text-gray-900">
                  Everything you need to manage your turf
                </p>

                <p className="mt-1 text-xs leading-5 text-gray-500">
                  Manage your daily operations from one place.
                </p>
              </div>

              <div className="space-y-3">
                {features.map((feature) => {
                  const Icon = feature.icon;

                  return (
                    <article
                      key={feature.title}
                      className="group flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-4 transition-all duration-300 hover:border-emerald-100 hover:shadow-md hover:shadow-gray-200/50 sm:p-5"
                    >
                      <div
                        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${feature.iconClass} transition-transform duration-300 group-hover:scale-105`}
                      >
                        <Icon size={21} strokeWidth={2} />
                      </div>

                      <div className="min-w-0 flex-1">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {feature.title}
                        </h3>

                        <p className="mt-1.5 text-xs leading-6 text-gray-500 sm:text-sm">
                          {feature.description}
                        </p>
                      </div>

                      <ArrowRight
                        size={16}
                        className="mt-1 shrink-0 text-gray-300 transition-all duration-300 group-hover:translate-x-1 group-hover:text-emerald-600"
                      />
                    </article>
                  );
                })}
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default OwnerCTA;
