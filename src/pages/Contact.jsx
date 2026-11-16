
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  MapPin,
  Phone,
  Send,
  Clock3,
  MessageSquare,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";

const contactInfo = [
  {
    icon: Mail,
    label: "Email Address",
    value: "support@khelaro.com",
    href: "mailto:support@khelaro.com",
    iconClass: "bg-blue-50 text-blue-600",
  },
  {
    icon: Phone,
    label: "Phone Number",
    value: "+8801336458100",
    href: "tel:+8801336458100",
    iconClass: "bg-emerald-50 text-emerald-600",
  },
  {
    icon: MapPin,
    label: "Our Location",
    value: "Dhaka, Bangladesh",
    iconClass: "bg-orange-50 text-orange-600",
  },
  {
    icon: Clock3,
    label: "Support Hours",
    value: "Sat – Thu, 9:00 AM – 8:00 PM",
    iconClass: "bg-purple-50 text-purple-600",
  },
];

const subjects = [
  { value: "booking", label: "Booking Support" },
  { value: "owner", label: "Become a Turf Owner" },
  { value: "payment", label: "Payment Issue" },
  { value: "technical", label: "Technical Issue" },
  { value: "other", label: "Other" },
];

const inputClass =
  "w-full rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400 hover:border-gray-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10";

const Contact = () => {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    setFormError("");

    const formData = new FormData(e.currentTarget);

    const name = formData.get("name")?.toString().trim();
    const email = formData.get("email")?.toString().trim();
    const subject = formData.get("subject")?.toString();
    const message = formData.get("message")?.toString().trim();

    if (!name || !email || !subject || !message) {
      setFormError("Please complete all required fields.");
      return;
    }

    const selectedSubject = subjects.find(
      (item) => item.value === subject
    )?.label;

    const emailSubject = `Khelaro Support - ${selectedSubject}`;

    const emailBody = [
      `Name: ${name}`,
      `Email: ${email}`,
      `Subject: ${selectedSubject}`,
      "",
      "Message:",
      message,
    ].join("\n");

    const mailtoUrl =
      `mailto:support@khelaro.com?subject=${encodeURIComponent(emailSubject)}` +
      `&body=${encodeURIComponent(emailBody)}`;

    window.location.href = mailtoUrl;
    setSubmitted(true);
  };

  return (
    <main className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden border-b border-gray-100 bg-gradient-to-b from-emerald-50/70 to-white">
        <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-100/50 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-emerald-50 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-wider text-emerald-700 shadow-sm">
              <MessageSquare size={15} />
              Contact Khelaro
            </span>

            <h1 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl lg:text-5xl">
              How can we{" "}
              <span className="text-emerald-600">help?</span>
            </h1>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-gray-600 sm:text-base sm:leading-8">
              Have a question about bookings, payments, or
              becoming a turf owner? Get in touch with us.
              We're here to help.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
        <div className="grid items-start gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">

          {/* Contact Information */}
          <aside className="rounded-2xl border border-gray-100 bg-gray-50/70 p-6 sm:p-8">
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-emerald-600">
                Get in Touch
              </p>

              <h2 className="mt-3 text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                We'd love to hear from you.
              </h2>

              <p className="mt-4 text-sm leading-7 text-gray-500">
                Whether you're a player looking for assistance
                or a turf owner interested in joining Khelaro,
                feel free to contact us.
              </p>
            </div>

            <div className="mt-8 space-y-3">
              {contactInfo.map((item) => {
                const Icon = item.icon;

                const content = (
                  <div className="flex items-center gap-4 rounded-xl border border-transparent p-3 transition-colors hover:border-gray-200 hover:bg-white">
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${item.iconClass}`}
                    >
                      <Icon size={19} strokeWidth={2} />
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-medium text-gray-500">
                        {item.label}
                      </p>

                      <p className="mt-1 break-words text-sm font-semibold text-gray-800">
                        {item.value}
                      </p>
                    </div>
                  </div>
                );

                return item.href ? (
                  <a
                    key={item.label}
                    href={item.href}
                    className="block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    {content}
                  </a>
                ) : (
                  <div key={item.label}>{content}</div>
                );
              })}
            </div>

            {/* Support Information */}
            <div className="mt-7 flex items-start gap-3 border-t border-gray-200 pt-6">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <MessageSquare size={18} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-900">
                  Need assistance?
                </h3>

                <p className="mt-1 text-sm leading-6 text-gray-500">
                  Contact our support team for booking and
                  account-related assistance.
                </p>
              </div>
            </div>
          </aside>

          {/* Contact Form */}
          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8 lg:p-9">
            {!submitted ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-bold tracking-tight text-gray-900">
                      Send us a message
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-gray-500">
                      Fill in the details below and tell us
                      how we can assist you.
                    </p>
                  </div>

                  <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 sm:flex">
                    <Send size={19} />
                  </div>
                </div>

                <form
                  onSubmit={handleSubmit}
                  className="mt-8 space-y-5"
                >
                  {/* Name and Email */}
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label
                        htmlFor="contact-name"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Full Name
                      </label>

                      <input
                        id="contact-name"
                        name="name"
                        type="text"
                        autoComplete="name"
                        required
                        maxLength={100}
                        placeholder="Enter your name"
                        className={`${inputClass} h-12`}
                      />
                    </div>

                    <div>
                      <label
                        htmlFor="contact-email"
                        className="mb-2 block text-sm font-semibold text-gray-700"
                      >
                        Email Address
                      </label>

                      <input
                        id="contact-email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        maxLength={254}
                        placeholder="you@example.com"
                        className={`${inputClass} h-12`}
                      />
                    </div>
                  </div>

                  {/* Subject */}
                  <div>
                    <label
                      htmlFor="contact-subject"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Subject
                    </label>

                    <select
                      id="contact-subject"
                      name="subject"
                      required
                      defaultValue=""
                      className={`${inputClass} h-12`}
                    >
                      <option value="" disabled>
                        Select a subject
                      </option>

                      {subjects.map((subject) => (
                        <option
                          key={subject.value}
                          value={subject.value}
                        >
                          {subject.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Message */}
                  <div>
                    <label
                      htmlFor="contact-message"
                      className="mb-2 block text-sm font-semibold text-gray-700"
                    >
                      Your Message
                    </label>

                    <textarea
                      id="contact-message"
                      name="message"
                      required
                      rows={6}
                      minLength={10}
                      maxLength={3000}
                      placeholder="Tell us how we can help..."
                      className={`${inputClass} resize-y py-3`}
                    />
                  </div>

                  {/* Error Message */}
                  {formError && (
                    <p
                      role="alert"
                      className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"
                    >
                      {formError}
                    </p>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    className="group inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-emerald-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
                  >
                    Send Message

                    <Send
                      size={16}
                      className="transition-transform group-hover:translate-x-1"
                    />
                  </button>

                  <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
                    <ShieldCheck size={15} />
                    Your information is used to prepare your message.
                  </div>
                </form>
              </>
            ) : (
              /* Email Draft Confirmation */
              <div
                role="status"
                className="flex min-h-[480px] flex-col items-center justify-center px-4 text-center"
              >
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                  <CheckCircle2 size={42} strokeWidth={1.8} />
                </div>

                <h3 className="mt-7 text-2xl font-bold text-gray-900">
                  Email draft prepared
                </h3>

                <p className="mt-3 max-w-md text-sm leading-7 text-gray-500">
                  Your email application should open with
                  your message. Review the details and press
                  Send to contact the Khelaro support team.
                </p>

                <a
                  href="mailto:support@khelaro.com"
                  className="mt-5 inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 hover:text-emerald-700"
                >
                  support@khelaro.com
                  <ArrowRight size={15} />
                </a>

                <button
                  type="button"
                  onClick={() => setSubmitted(false)}
                  className="mt-7 rounded-xl border border-gray-200 px-5 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                >
                  Back to Contact Form
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Help Center CTA */}
      <section className="border-t border-gray-100 bg-gray-50/70">
        <div className="mx-auto max-w-7xl px-4 py-14 text-center sm:px-6 lg:px-8">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
            <MessageSquare size={21} />
          </div>

          <h2 className="mt-5 text-2xl font-bold tracking-tight text-gray-900">
            Looking for quick answers?
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-gray-500">
            Visit our help center to find useful information
            about using Khelaro.
          </p>

          <Link
            to="/help"
            className="group mt-6 inline-flex items-center gap-2 rounded-xl border border-emerald-200 bg-white px-5 py-3 text-sm font-semibold text-emerald-700 transition-colors hover:border-emerald-300 hover:bg-emerald-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2"
          >
            Visit Help Center

            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-1"
            />
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Contact;
