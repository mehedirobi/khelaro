
import { Link } from "react-router-dom";
import {
  MapPin,
  Mail,
  Phone,
  ArrowUpRight,
  ArrowRight,
} from "lucide-react";
import {
  FaFacebookF,
  FaInstagram,
  FaLinkedinIn,
} from "react-icons/fa";
import Logo from "./Logo";

const platformLinks = [
  { name: "Find a Turf", path: "/turfs" },
  { name: "How It Works", path: "/about" },
  { name: "Become a Turf Owner", path: "/register?role=owner" },
  { name: "Contact Us", path: "/contact" },
];

const supportLinks = [
  { name: "Help Center", path: "/help" },
  { name: "Terms & Conditions", path: "/terms" },
  { name: "Privacy Policy", path: "/privacy" },
  { name: "Refund Policy", path: "/refund" },
];

const socialLinks = [
  {
    name: "Facebook",
    href: "#",
    icon: FaFacebookF,
    color: "text-blue-600",
    hover: "hover:bg-blue-50",
  },
  {
    name: "Instagram",
    href: "#",
    icon: FaInstagram,
    color: "text-pink-600",
    hover: "hover:bg-pink-50",
  },
  {
    name: "LinkedIn",
    href: "#",
    icon: FaLinkedinIn,
    color: "text-sky-600",
    hover: "hover:bg-sky-50",
  },
];

const contactInfo = [
  {
    icon: MapPin,
    label: "Dhaka, Bangladesh",
    color: "text-emerald-600",
  },
  {
    icon: Mail,
    label: "support@khelaro.com",
    href: "mailto:support@khelaro.com",
    color: "text-blue-600",
  },
  {
    icon: Phone,
    label: "+880 1336 458100",
    href: "tel:+8801336458100",
    color: "text-violet-600",
  },
];

const FooterLink = ({ link }) => (
  <li>
    <Link
      to={link.path}
      className="group inline-flex items-center gap-1 text-[13px] text-gray-500 transition-colors duration-200 hover:text-emerald-700"
    >
      {link.name}
      <ArrowUpRight
        size={12}
        className="opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100"
      />
    </Link>
  </li>
);

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-100 bg-white">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        {/* Main Footer */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-9 py-10 md:grid-cols-4 md:gap-10 lg:py-12">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              aria-label="Khelaro home"
              className="inline-flex items-center gap-2.5"
            >
             <Logo></Logo>
            </Link>

            <p className="mt-3 max-w-[260px] text-[13px] leading-6 text-gray-500">
              Discover and book sports turfs around Dhaka.
              Find your game and get ready to play.
            </p>

            <Link
              to="/turfs"
              className="group mt-4 inline-flex items-center gap-1.5 text-[13px] font-semibold text-emerald-700 transition-colors hover:text-emerald-800"
            >
              Explore turfs
              <ArrowRight
                size={14}
                className="transition-transform duration-200 group-hover:translate-x-1"
              />
            </Link>

            {/* Social Links */}
            <div className="mt-5 flex items-center gap-2">
              {socialLinks.map((social) => {
                const Icon = social.icon;

                return (
                  <a
                    key={social.name}
                    href={social.href}
                    aria-label={social.name}
                    className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gray-50 ${social.color} ${social.hover} transition-colors duration-200`}
                  >
                    <Icon size={14} />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Platform */}
          <div>
            <h3 className="text-[13px] font-bold text-gray-900">
              Platform
            </h3>

            <ul className="mt-4 space-y-3">
              {platformLinks.map((link) => (
                <FooterLink key={link.name} link={link} />
              ))}
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-[13px] font-bold text-gray-900">
              Support
            </h3>

            <ul className="mt-4 space-y-3">
              {supportLinks.map((link) => (
                <FooterLink key={link.name} link={link} />
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-[13px] font-bold text-gray-900">
              Get in Touch
            </h3>

            <ul className="mt-4 space-y-3">
              {contactInfo.map((item) => {
                const Icon = item.icon;

                const content = (
                  <span className="flex items-center gap-2.5 text-[13px] text-gray-500 transition-colors hover:text-gray-900">
                    <Icon
                      size={16}
                      className={`shrink-0 ${item.color}`}
                    />
                    <span className="break-all">{item.label}</span>
                  </span>
                );

                return (
                  <li key={item.label}>
                    {item.href ? (
                      <a href={item.href}>{content}</a>
                    ) : (
                      content
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="flex flex-col gap-3 border-t border-gray-100 py-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-gray-400">
            © {currentYear} Khelaro. All rights reserved.
          </p>

          <p className="text-xs text-gray-400">
            Built for players. Made for the game.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
