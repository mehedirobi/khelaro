
import { useEffect, useState } from "react";
import { NavLink, Link } from "react-router-dom";
import {
  LayoutDashboard,
  CalendarDays,
  Heart,
  User,
  LogOut,
  Loader2,
} from "lucide-react";

import useAuth from "../../hooks/useAuth";

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
    icon: User,
  },
];

const getInitials = (name = "User") => {
  const words = name.trim().split(/\s+/);

  if (words.length > 1) {
    return `${words[0][0]}${words[1][0]}`.toUpperCase();
  }

  return name.charAt(0).toUpperCase() || "U";
};

const DashboardSidebar = () => {
  const { currentUser, logout } = useAuth();

  const [userData, setUserData] = useState(null);
  const [imageError, setImageError] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const userEmail = currentUser?.email?.trim().toLowerCase() || "";

  // Load user data
  useEffect(() => {
    const controller = new AbortController();

    const loadUserData = async () => {
      if (!userEmail) {
        setUserData(null);
        return;
      }

      // Read cached user only when email matches
      try {
        const cachedUser = localStorage.getItem(CACHE_KEY);

        if (cachedUser) {
          const parsedUser = JSON.parse(cachedUser);

          if (
            parsedUser?.email?.trim().toLowerCase() === userEmail
          ) {
            setUserData(parsedUser);
          } else {
            setUserData(null);
          }
        } else {
          setUserData(null);
        }
      } catch (error) {
        console.error("User cache error:", error);
        localStorage.removeItem(CACHE_KEY);
        setUserData(null);
      }

      try {
        const response = await fetch(
          `${API_URL}/users/${encodeURIComponent(userEmail)}`,
          {
            signal: controller.signal,
          }
        );

        if (!response.ok) {
          throw new Error(
            `Failed to load user (${response.status})`
          );
        }

        const data = await response.json();
        const mongoUser = data?.user || data;

        if (!mongoUser || typeof mongoUser !== "object") {
          throw new Error("Invalid user response.");
        }

        if (controller.signal.aborted) return;

        setUserData(mongoUser);

        localStorage.setItem(
          CACHE_KEY,
          JSON.stringify(mongoUser)
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error("Sidebar user fetch error:", error);
        }
      }
    };

    loadUserData();

    return () => controller.abort();
  }, [userEmail]);

  // Reset profile image when user changes
  useEffect(() => {
    setImageError(false);
  }, [userEmail]);

  // User information
  const userName =
    userData?.name?.trim() ||
    currentUser?.displayName ||
    userEmail.split("@")[0] ||
    "User";

  const displayedEmail = userData?.email || currentUser?.email || "";

  const userPhoto = userData?.photoURL || currentUser?.photoURL || "";

  const userInitials = getInitials(userName);

  // Logout
  const handleLogout = async () => {
    if (isLoggingOut) return;

    try {
      setIsLoggingOut(true);

      await logout();

      localStorage.removeItem(CACHE_KEY);
      localStorage.removeItem("khelaro-uid");
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <aside
      aria-label="Dashboard navigation"
      className="fixed inset-y-0 left-0 z-50 hidden w-64 flex-col border-r border-gray-200 bg-white lg:flex"
    >
      {/* Logo */}
      <div className="flex h-20 shrink-0 items-center border-b border-gray-100 px-6">
        <Link
          to="/"
          aria-label="Khelaro home"
          className="text-2xl font-bold tracking-tight text-gray-900 transition-opacity hover:opacity-80"
        >
          Khelaro<span className="text-green-600">.</span>
        </Link>
      </div>

      {/* User profile */}
      <div className="shrink-0 border-b border-gray-100 p-5">
        <div className="flex items-center gap-3">
          {userPhoto && !imageError ? (
            <img
              src={userPhoto}
              alt={`${userName}'s profile`}
              loading="lazy"
              referrerPolicy="no-referrer"
              onError={() => setImageError(true)}
              className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-gray-100"
            />
          ) : (
            <div
              aria-hidden="true"
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-green-50 text-sm font-bold text-green-700 ring-2 ring-green-100"
            >
              {userInitials}
            </div>
          )}

          <div className="min-w-0 flex-1">
            <p
              className="truncate text-sm font-semibold text-gray-900"
              title={userName}
            >
              {userName}
            </p>

            <p
              className="truncate text-xs text-gray-500"
              title={displayedEmail}
            >
              {displayedEmail || "Loading account..."}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        aria-label="Dashboard"
        className="flex-1 space-y-1 overflow-y-auto p-4"
      >
        {menuItems.map(({ name, path, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/dashboard"}
            className={({ isActive }) =>
              [
                "group flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium",
                "transition-colors duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500/40",
                isActive
                  ? "bg-green-50 text-green-700"
                  : "text-gray-600 hover:bg-gray-50 hover:text-gray-900",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={19}
                  strokeWidth={isActive ? 2.2 : 2}
                  className="shrink-0 transition-transform duration-200 group-hover:scale-105"
                  aria-hidden="true"
                />

                <span>{name}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Logout */}
      <div className="shrink-0 border-t border-gray-100 p-4">
        <button
          type="button"
          onClick={handleLogout}
          disabled={isLoggingOut}
          className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-gray-600 transition-colors duration-200 hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500/30 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isLoggingOut ? (
            <Loader2
              size={19}
              className="shrink-0 animate-spin"
              aria-hidden="true"
            />
          ) : (
            <LogOut
              size={19}
              className="shrink-0"
              aria-hidden="true"
            />
          )}

          <span>
            {isLoggingOut ? "Logging out..." : "Logout"}
          </span>
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
