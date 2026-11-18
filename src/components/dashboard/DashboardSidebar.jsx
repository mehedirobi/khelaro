import { useCallback, useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Heart,
  UserRound,
  LogOut,
  Loader2,
  ArrowUpRight,
  CircleUserRound,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";
import Logo from "../Logo";

const API_URL = (
  import.meta.env.VITE_API_URL || "http://localhost:3000"
).replace(/\/+$/, "");

const CACHE_KEY = "khelaro-user";

const menuItems = [
  {
    name: "Overview",
    path: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "My Bookings",
    path: "/dashboard/bookings",
    icon: CalendarDays,
  },
  {
    name: "Wishlist",
    path: "/dashboard/wishlist",
    icon: Heart,
  },
  {
    name: "Profile",
    path: "/dashboard/profile",
    icon: UserRound,
  },
];

const getInitials = (name = "User") => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length > 1) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.charAt(0).toUpperCase() || "U";
};

const getCachedUser = (email) => {
  try {
    const cached = localStorage.getItem(CACHE_KEY);

    if (!cached) return null;

    const parsed = JSON.parse(cached);

    return parsed?.email?.trim().toLowerCase() === email
      ? parsed
      : null;
  } catch {
    localStorage.removeItem(CACHE_KEY);
    return null;
  }
};

const DashboardSidebar = () => {
  const { currentUser, logout } = useAuth();

  const [userData, setUserData] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userEmail = currentUser?.email?.trim().toLowerCase() || "";

  // Fetch user information
  useEffect(() => {
    if (!userEmail) {
      setUserData(null);
      return;
    }

    const controller = new AbortController();

    const loadUserData = async () => {
      const cachedUser = getCachedUser(userEmail);

      setUserData(cachedUser);

      try {
        const response = await fetch(
          `${API_URL}/users/${encodeURIComponent(userEmail)}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error(`User request failed: ${response.status}`);
        }

        const data = await response.json();
        const mongoUser = data?.user || data;

        if (
          !mongoUser ||
          typeof mongoUser !== "object" ||
          mongoUser.email?.trim().toLowerCase() !== userEmail
        ) {
          throw new Error("Invalid user response.");
        }

        if (controller.signal.aborted) return;

        setUserData(mongoUser);
        localStorage.setItem(CACHE_KEY, JSON.stringify(mongoUser));
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Dashboard user fetch error:", error);
        }
      }
    };

    loadUserData();

    return () => controller.abort();
  }, [userEmail]);

  // Reset image state when account changes
  useEffect(() => {
    setImageError(false);
  }, [userEmail]);

  // User information
  const userName =
    userData?.name?.trim() ||
    currentUser?.displayName ||
    userEmail.split("@")[0] ||
    "User";

  const displayedEmail = currentUser?.email || userData?.email || "";

  const userPhoto = userData?.photoURL || currentUser?.photoURL || "";

  const userInitials = getInitials(userName);

  // Logout handler
  const handleLogout = useCallback(async () => {
    if (isLoggingOut) return;

    setIsLoggingOut(true);

    try {
      await logout();

      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem("khelaro-uid");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  }, [isLoggingOut, logout]);

  return (
    <aside
      aria-label="Dashboard navigation"
      className="fixed inset-y-0 left-0 z-50 hidden w-[270px] flex-col border-r border-gray-200/80 bg-white lg:flex"
    >
      {/* Brand */}
      <div className="flex h-[76px] shrink-0 items-center justify-between border-b border-gray-100 px-6">
        <Link
          to="/"
          aria-label="Khelaro home"
          className="group flex items-center gap-2"
        >
          <Logo></Logo>
        </Link>

        <span className="rounded-md border border-green-100 bg-green-50 px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-green-700">
          User
        </span>
      </div>

      {/* Account */}
      <div className="border-b border-gray-100 p-5">
        <div className="flex items-center gap-3 rounded-xl bg-gray-50/80 p-3">
          <div className="relative shrink-0">
            {userPhoto && !imageError ? (
              <img
                src={userPhoto}
                alt={`${userName}'s profile`}
                loading="lazy"
                referrerPolicy="no-referrer"
                onError={() => setImageError(true)}
                className="h-11 w-11 rounded-full border border-gray-200 object-cover"
              />
            ) : (
              <div
                aria-hidden="true"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-green-100 bg-green-50 text-sm font-bold text-green-700"
              >
                {userInitials}
              </div>
            )}

            <span
              className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white bg-green-500"
              aria-label="Account active"
              title="Account active"
            />
          </div>

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-gray-900"
              title={userName}
            >
              {userName}
            </p>

            <p
              className="mt-0.5 truncate text-[11px] text-gray-500"
              title={displayedEmail}
            >
              {displayedEmail || "Loading account..."}
            </p>
          </div>

          <CircleUserRound
            size={16}
            className="shrink-0 text-gray-400"
            aria-hidden="true"
          />
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Dashboard"
        className="flex-1 overflow-y-auto px-4 py-6"
      >
        <p className="mb-3 px-3 text-[10px] font-bold uppercase tracking-[0.14em] text-gray-400">
          Workspace
        </p>

        <div className="space-y-1.5">
          {menuItems.map(({ name, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === "/dashboard"}
              className={({ isActive }) =>
                [
                  "group relative flex items-center gap-3 rounded-xl px-3.5 py-3",
                  "text-[13px] font-semibold transition-all duration-200",
                  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2",
                  isActive
                    ? "bg-green-50 text-green-700"
                    : "text-gray-500 hover:bg-gray-50 hover:text-gray-900",
                ].join(" ")
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <span
                      className="absolute bottom-2 left-0 top-2 w-[3px] rounded-r-full bg-green-600"
                      aria-hidden="true"
                    />
                  )}

                  <Icon
                    size={19}
                    strokeWidth={isActive ? 2.3 : 1.9}
                    className={[
                      "shrink-0 transition-transform duration-200",
                      isActive
                        ? "text-green-600"
                        : "text-gray-400 group-hover:text-gray-700 group-hover:scale-105",
                    ].join(" ")}
                    aria-hidden="true"
                  />

                  <span className="flex-1">{name}</span>

                  {isActive && (
                    <span className="h-1.5 w-1.5 rounded-full bg-green-600" />
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Bottom Section */}
      <div className="shrink-0 border-t border-gray-100 p-4">
        <Link
          to="/"
          className="mb-2 flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-50 hover:text-gray-900"
        >
          <ArrowUpRight size={17} aria-hidden="true" />
          <span>Visit Website</span>
        </Link>

        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-3.5 py-3 text-[13px] font-semibold text-gray-500 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/40 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? (
            <Loader2
              size={18}
              className="shrink-0 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <LogOut size={18} className="shrink-0" aria-hidden="true" />
          )}

          <span>{isLoggingOut ? "Logging out..." : "Sign out"}</span>
        </button>

        <p className="mt-4 text-center text-[10px] text-gray-400">
          © {new Date().getFullYear()} Khelaro. All rights reserved.
        </p>
      </div>
    </aside>
  );
};

export default DashboardSidebar;