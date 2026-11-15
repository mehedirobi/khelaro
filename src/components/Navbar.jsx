
import { useEffect, useRef, useState } from "react";
import {
  Link,
  NavLink,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  Menu,
  X,
  Heart,
  UserRound,
  LayoutDashboard,
  LogOut,
  ChevronDown,
  CircleUserRound,
  Search,
  Users,
  MapPin,
  CalendarDays,
  Wallet,
  Home,
  Info,
  Mail,
  Settings,
  ShieldCheck,
} from "lucide-react";
import useAuth from "../hooks/useAuth";

const navLinks = [
  {
    name: "Home",
    path: "/",
    icon: Home,
    end: true,
    color: "text-blue-600",
    activeColor: "bg-blue-50 text-blue-700",
  },
  {
    name: "Find Turf",
    path: "/turfs",
    icon: Search,
    color: "text-emerald-600",
    activeColor: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "About",
    path: "/about",
    icon: Info,
    color: "text-violet-600",
    activeColor: "bg-violet-50 text-violet-700",
  },
  {
    name: "Contact",
    path: "/contact",
    icon: Mail,
    color: "text-orange-600",
    activeColor: "bg-orange-50 text-orange-700",
  },
];

const adminLinks = [
  {
    name: "Manage Users",
    path: "/admin/users",
    icon: Users,
    color: "text-blue-600",
    activeColor: "bg-blue-50 text-blue-700",
  },
  {
    name: "Manage Turfs",
    path: "/admin/turfs",
    icon: MapPin,
    color: "text-emerald-600",
    activeColor: "bg-emerald-50 text-emerald-700",
  },
  {
    name: "Manage Bookings",
    path: "/admin/bookings",
    icon: CalendarDays,
    color: "text-violet-600",
    activeColor: "bg-violet-50 text-violet-700",
  },
  {
    name: "Revenue",
    path: "/admin/revenue",
    icon: Wallet,
    color: "text-amber-600",
    activeColor: "bg-amber-50 text-amber-700",
  },
];

const getNavClass = ({ isActive }, link) => {
  return `
    flex items-center gap-2.5 rounded-full px-4 py-2.5
    text-[13px] font-semibold transition-all duration-200
    ${
      isActive
        ? `${link.activeColor} shadow-sm`
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
    }
  `;
};

const getMenuLinkClass = ({ isActive }, item) => {
  return `
    flex items-center gap-3 rounded-xl px-3 py-2.5
    text-sm font-medium transition-colors duration-200
    ${
      isActive
        ? `${item.activeColor} font-semibold`
        : "text-gray-600 hover:bg-gray-50 hover:text-gray-950"
    }
  `;
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  const profileRef = useRef(null);

  const navigate = useNavigate();
  const location = useLocation();

  const { currentUser, loading, logout } = useAuth();

  // User role
  const userRole = String(currentUser?.role || "user")
    .trim()
    .toLowerCase();

  const isAdmin = userRole === "admin";
  const isOwner = userRole === "owner";
  const isCustomer = !isAdmin && !isOwner;

  // Role-based routes
  const dashboardPath = isAdmin
    ? "/admin-dashboard"
    : isOwner
      ? "/owner-dashboard"
      : "/dashboard";

  const profilePath = isAdmin
    ? "/admin-dashboard"
    : isOwner
      ? "/owner-dashboard/profile"
      : "/dashboard/profile";

  const wishlistPath = "/dashboard/wishlist";

  // User information
  const userName =
    currentUser?.displayName ||
    currentUser?.email?.split("@")[0] ||
    "User";

  const userEmail = currentUser?.email || "";
  const userPhoto = currentUser?.photoURL || "";
  const userInitial = userName.charAt(0).toUpperCase() || "U";

  const roleLabel = isAdmin
    ? "Administrator"
    : isOwner
      ? "Turf Owner"
      : "Customer";

  const roleStyles = isAdmin
    ? "bg-red-50 text-red-600"
    : isOwner
      ? "bg-blue-50 text-blue-600"
      : "bg-emerald-50 text-emerald-700";

  // Scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    handleScroll();

    window.addEventListener("scroll", handleScroll, {
      passive: true,
    });

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  // Close menus when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsProfileOpen(false);
  }, [location.pathname]);

  // Close profile dropdown on outside click and Escape
  useEffect(() => {
    if (!isProfileOpen) return;

    const handleOutsideClick = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target)
      ) {
        setIsProfileOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileOpen]);

  // Logout
  const handleLogout = async () => {
    try {
      await logout();
      setIsProfileOpen(false);
      setIsMenuOpen(false);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Reusable navigation links
  const renderNavLinks = (mobile = false) =>
    navLinks.map((link) => {
      const Icon = link.icon;

      return (
        <NavLink
          key={link.path}
          to={link.path}
          end={link.end}
          onClick={() => {
            if (mobile) setIsMenuOpen(false);
          }}
          className={(props) =>
            mobile
              ? `
                flex items-center gap-3 rounded-xl px-4 py-3
                text-sm font-semibold transition-all duration-200
                ${
                  props.isActive
                    ? `${link.activeColor} shadow-sm`
                    : "text-gray-600 hover:bg-gray-50"
                }
              `
              : getNavClass(props, link)
          }
        >
          {({ isActive }) => (
            <>
              <Icon
                size={mobile ? 19 : 16}
                strokeWidth={2.2}
                className={
                  isActive ? "" : `${link.color} opacity-90`
                }
              />
              <span>{link.name}</span>
            </>
          )}
        </NavLink>
      );
    });

  // Reusable dashboard menu links
  const renderAdminLinks = (mobile = false) =>
    adminLinks.map((item) => {
      const Icon = item.icon;

      return (
        <NavLink
          key={item.path}
          to={item.path}
          onClick={() => {
            setIsProfileOpen(false);
            if (mobile) setIsMenuOpen(false);
          }}
          className={(props) =>
            mobile
              ? getMenuLinkClass(props, item)
              : getMenuLinkClass(props, item)
          }
        >
          <Icon size={17} className={item.color} />
          <span>{item.name}</span>
        </NavLink>
      );
    });

  const renderUserAvatar = (size = "h-9 w-9") => (
    <div
      className={`
        ${size} flex shrink-0 items-center justify-center
        overflow-hidden rounded-full bg-emerald-100
        text-sm font-bold text-emerald-700
        ring-2 ring-emerald-50
      `}
    >
      {userPhoto ? (
        <img
          src={userPhoto}
          alt={`${userName}'s profile`}
          className="h-full w-full object-cover"
          referrerPolicy="no-referrer"
        />
      ) : (
        userInitial
      )}
    </div>
  );

  return (
    <header
      className={`
        sticky top-0 z-50 w-full border-b
        transition-all duration-300
        ${
          isScrolled
            ? "border-gray-200/80 bg-white/95 shadow-sm backdrop-blur-xl"
            : "border-gray-100 bg-white"
        }
      `}
    >
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">

        {/* Logo */}
        <Link
          to="/"
          onClick={() => setIsMenuOpen(false)}
          aria-label="Khelaro Home"
          className="group flex shrink-0 items-center gap-2.5"
        >
          <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-emerald-500 to-green-700 shadow-sm transition-transform duration-300 group-hover:scale-105">
            <span className="text-xl font-extrabold text-white">
              K
            </span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
          </div>

          <div className="leading-none">
            <span className="block text-[21px] font-extrabold tracking-tight text-gray-950">
              Khelaro
            </span>
            <span className="mt-1 block text-[9px] font-semibold uppercase tracking-[0.19em] text-gray-400">
              Play. Book. Enjoy.
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          aria-label="Main navigation"
          className="hidden items-center gap-1 rounded-full bg-gray-50/80 p-1 lg:flex"
        >
          {renderNavLinks()}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden shrink-0 items-center gap-2 lg:flex">

          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-10 w-24 animate-pulse rounded-full bg-gray-100" />
              <div className="h-10 w-10 animate-pulse rounded-full bg-gray-100" />
            </div>
          ) : currentUser ? (
            <>
              {/* Wishlist */}
              {isCustomer && (
                <NavLink
                  to={wishlistPath}
                  aria-label="Wishlist"
                  title="Wishlist"
                  className={({ isActive }) => `
                    relative flex h-10 w-10 items-center justify-center
                    rounded-full transition-all duration-200
                    ${
                      isActive
                        ? "bg-rose-50 text-rose-600"
                        : "text-rose-500 hover:bg-rose-50"
                    }
                  `}
                >
                  <Heart size={19} strokeWidth={2} />
                </NavLink>
              )}

              {/* Dashboard */}
              <NavLink
                to={dashboardPath}
                end
                className={({ isActive }) => `
                  flex h-10 items-center gap-2 rounded-full
                  border px-4 text-[13px] font-semibold
                  transition-all duration-200
                  ${
                    isActive
                      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                      : "border-gray-200 bg-white text-gray-700 hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                  }
                `}
              >
                <LayoutDashboard size={16} />
                Dashboard
              </NavLink>

              {/* Profile Dropdown */}
              <div className="relative ml-1" ref={profileRef}>
                <button
                  type="button"
                  onClick={() =>
                    setIsProfileOpen((prev) => !prev)
                  }
                  aria-expanded={isProfileOpen}
                  aria-haspopup="true"
                  aria-label="Open profile menu"
                  className={`
                    flex h-11 items-center gap-2 rounded-full
                    border px-2 py-1 transition-all duration-200
                    ${
                      isProfileOpen
                        ? "border-emerald-200 bg-emerald-50"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50"
                    }
                  `}
                >
                  {renderUserAvatar("h-8 w-8")}

                  <ChevronDown
                    size={15}
                    className={`mr-1 text-gray-400 transition-transform duration-200 ${
                      isProfileOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown */}
                {isProfileOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-[calc(100%+12px)] z-50 w-72 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-[0_12px_40px_rgba(0,0,0,0.10)]"
                  >
                    {/* User Information */}
                    <div className="border-b border-gray-100 bg-gray-50/70 p-4">
                      <div className="flex items-center gap-3">
                        {renderUserAvatar("h-11 w-11")}

                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-bold text-gray-900">
                            {userName}
                          </p>
                          <p className="truncate text-xs text-gray-500">
                            {userEmail}
                          </p>
                        </div>
                      </div>

                      <span
                        className={`mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${roleStyles}`}
                      >
                        <ShieldCheck size={12} />
                        {roleLabel}
                      </span>
                    </div>

                    {/* Menu Links */}
                    <div className="space-y-1 p-2">
                      <NavLink
                        to={dashboardPath}
                        end
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                        className={(props) =>
                          getMenuLinkClass(props, {
                            activeColor:
                              "bg-emerald-50 text-emerald-700",
                          })
                        }
                      >
                        <LayoutDashboard
                          size={17}
                          className="text-emerald-600"
                        />
                        Dashboard
                      </NavLink>

                      {isAdmin && (
                        <>
                          <div className="my-2 border-t border-gray-100" />
                          <p className="px-3 pb-1 pt-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            Administration
                          </p>
                          {renderAdminLinks()}
                        </>
                      )}

                      <NavLink
                        to={profilePath}
                        role="menuitem"
                        onClick={() => setIsProfileOpen(false)}
                        className={(props) =>
                          getMenuLinkClass(props, {
                            activeColor:
                              "bg-violet-50 text-violet-700",
                          })
                        }
                      >
                        <CircleUserRound
                          size={17}
                          className="text-violet-600"
                        />
                        My Profile
                      </NavLink>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-gray-100 p-2">
                      <button
                        type="button"
                        role="menuitem"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut size={17} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Login */}
              <Link
                to="/login"
                className="flex h-10 items-center gap-2 rounded-full px-4 text-[13px] font-semibold text-gray-600 transition-colors hover:bg-gray-50 hover:text-gray-950"
              >
                <UserRound size={16} />
                Login
              </Link>

              {/* Get Started */}
              <Link
                to="/register"
                className="flex h-10 items-center gap-2 rounded-full bg-emerald-600 px-5 text-[13px] font-bold text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-emerald-700 hover:shadow-md active:translate-y-0"
              >
                Get Started
                <span aria-hidden="true">→</span>
              </Link>
            </>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button
          type="button"
          onClick={() => setIsMenuOpen((prev) => !prev)}
          aria-label={isMenuOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMenuOpen}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-700 transition-colors hover:bg-gray-50 lg:hidden"
        >
          {isMenuOpen ? <X size={21} /> : <Menu size={21} />}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="border-t border-gray-100 bg-white shadow-lg lg:hidden">
          <div className="mx-auto max-w-7xl px-4 py-5 sm:px-6">

            {/* Mobile User Information */}
            {!loading && currentUser && (
              <div className="mb-4 flex items-center gap-3 rounded-2xl bg-gray-50 p-3">
                {renderUserAvatar("h-11 w-11")}

                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-bold text-gray-900">
                    {userName}
                  </p>
                  <p className="truncate text-xs text-gray-500">
                    {userEmail}
                  </p>
                  <span className={`mt-1 inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold ${roleStyles}`}>
                    {roleLabel}
                  </span>
                </div>
              </div>
            )}

            {/* Main Navigation */}
            <nav
              aria-label="Mobile navigation"
              className="flex flex-col gap-1"
            >
              {renderNavLinks(true)}
            </nav>

            {/* User Navigation */}
            {!loading && currentUser && (
              <>
                <div className="my-4 border-t border-gray-100" />

                <p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  My Account
                </p>

                <div className="flex flex-col gap-1">
                  <NavLink
                    to={dashboardPath}
                    end
                    onClick={() => setIsMenuOpen(false)}
                    className={(props) =>
                      getMenuLinkClass(props, {
                        activeColor:
                          "bg-emerald-50 text-emerald-700",
                      })
                    }
                  >
                    <LayoutDashboard
                      size={18}
                      className="text-emerald-600"
                    />
                    Dashboard
                  </NavLink>

                  {isCustomer && (
                    <NavLink
                      to={wishlistPath}
                      onClick={() => setIsMenuOpen(false)}
                      className={(props) =>
                        getMenuLinkClass(props, {
                          activeColor:
                            "bg-rose-50 text-rose-700",
                        })
                      }
                    >
                      <Heart size={18} className="text-rose-500" />
                      Wishlist
                    </NavLink>
                  )}

                  {isAdmin && (
                    <>
                      <div className="my-2 border-t border-gray-100" />
                      <p className="px-3 pb-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                        Administration
                      </p>
                      {renderAdminLinks(true)}
                    </>
                  )}

                  <NavLink
                    to={profilePath}
                    onClick={() => setIsMenuOpen(false)}
                    className={(props) =>
                      getMenuLinkClass(props, {
                        activeColor:
                          "bg-violet-50 text-violet-700",
                      })
                    }
                  >
                    <CircleUserRound
                      size={18}
                      className="text-violet-600"
                    />
                    My Profile
                  </NavLink>
                </div>
              </>
            )}

            {/* Mobile Actions */}
            <div className="mt-4 border-t border-gray-100 pt-4">
              {!loading && currentUser ? (
                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100"
                >
                  <LogOut size={17} />
                  Logout
                </button>
              ) : !loading ? (
                <div className="grid grid-cols-2 gap-3">
                  <Link
                    to="/login"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    <UserRound size={17} />
                    Login
                  </Link>

                  <Link
                    to="/register"
                    onClick={() => setIsMenuOpen(false)}
                    className="flex h-11 items-center justify-center gap-2 rounded-xl bg-emerald-600 text-sm font-bold text-white transition-colors hover:bg-emerald-700"
                  >
                    Get Started
                  </Link>
                </div>
              ) : (
                <div className="h-11 animate-pulse rounded-xl bg-gray-100" />
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
