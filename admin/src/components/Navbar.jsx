import React, {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";

import {
  Home,
  UserPlus,
  Users,
  Calendar,
  Grid,
  PlusSquare,
  List,
  X,
  Menu,
} from "lucide-react";

import { navbarStyles as ns } from "../assets/dummyStyles";
import logoImg from "../assets/logo.png";

import { useAuth, useClerk, useUser } from "@clerk/clerk-react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  const navInnerRef = useRef(null);
  const indicatorRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();

  // Clerk
  const clerk = useClerk();
  const { getToken, isLoaded: authLoaded } = useAuth();
  const { isSignedIn, user, isLoaded: userLoaded } = useUser();

  // ---------------------------------------
  // Move active navigation indicator
  // ---------------------------------------
  const moveIndicator = useCallback(() => {
    const container = navInnerRef.current;
    const indicator = indicatorRef.current;

    if (!container || !indicator) return;

    const active = container.querySelector(".nav-item.active");

    if (!active) {
      indicator.style.opacity = "0";
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    const left = activeRect.left - containerRect.left + container.scrollLeft;

    const width = activeRect.width;

    indicator.style.transform = `translateX(${left}px)`;
    indicator.style.width = `${width}px`;
    indicator.style.opacity = "1";
  }, []);

  // ---------------------------------------
  // Update indicator when route changes
  // ---------------------------------------
  useLayoutEffect(() => {
    moveIndicator();

    const timer = setTimeout(() => {
      moveIndicator();
    }, 120);

    return () => clearTimeout(timer);
  }, [location.pathname, moveIndicator]);

  // ---------------------------------------
  // Resize / Scroll observer
  // ---------------------------------------
  useEffect(() => {
    const container = navInnerRef.current;

    if (!container) return;

    const onScroll = () => {
      moveIndicator();
    };

    container.addEventListener("scroll", onScroll, {
      passive: true,
    });

    const resizeObserver = new ResizeObserver(() => {
      moveIndicator();
    });

    resizeObserver.observe(container);

    if (container.parentElement) {
      resizeObserver.observe(container.parentElement);
    }

    window.addEventListener("resize", moveIndicator);

    moveIndicator();

    return () => {
      container.removeEventListener("scroll", onScroll);
      resizeObserver.disconnect();
      window.removeEventListener("resize", moveIndicator);
    };
  }, [moveIndicator]);

  // ---------------------------------------
  // Escape key
  // ---------------------------------------
  useEffect(() => {
    const onKey = (event) => {
      if (event.key === "Escape" && open) {
        setOpen(false);
      }
    };

    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // ---------------------------------------
  // Store Clerk token
  // ---------------------------------------
  useEffect(() => {
    let mounted = true;

    const storeToken = async () => {
      if (!authLoaded || !userLoaded) return;

      // User is not signed in
      if (!isSignedIn) {
        try {
          localStorage.removeItem("clerk_token");
        } catch (error) {
          console.warn("Failed to remove Clerk token:", error);
        }

        return;
      }

      try {
        if (getToken) {
          const token = await getToken();

          if (!mounted) return;

          if (token) {
            try {
              localStorage.setItem("clerk_token", token);
            } catch (error) {
              console.warn("Failed to save Clerk token:", error);
            }
          }
        }
      } catch (error) {
        console.warn("Could not retrieve Clerk token:", error);
      }
    };

    storeToken();

    return () => {
      mounted = false;
    };
  }, [authLoaded, userLoaded, isSignedIn, getToken]);

  // ---------------------------------------
  // Login
  // ---------------------------------------
  const handleOpenSignIn = () => {
    if (!clerk || !clerk.openSignIn) {
      console.warn("Clerk is not available");
      return;
    }

    clerk.openSignIn();
    navigate("/h");
  };

  // ---------------------------------------
  // Logout
  // ---------------------------------------
  const handleSignOut = async () => {
    if (!clerk || !clerk.signOut) {
      console.warn("clerk is not available");
      return;
    }
    try {
      await clerk.signOut();
    } catch (error) {
      console.error("Sign out failed", err);
    } finally {
      try {
        localStorage.removeItem("clerk_token");
      } catch (error) {
        //ignore
      }
      navigate("/");
    }
  };

  // ---------------------------------------
  // JSX
  // ---------------------------------------
  return (
    <header className={ns.header}>
      <nav className={ns.navContainer}>
        <div className={ns.flexContainer}>
          {/* Logo */}
          <div className={ns.logoContainer}>
            <img src={logoImg} alt="MediCare Logo" className={ns.logoImage} />

            <Link to="/">
              <div className={ns.logoLink}>MediCare</div>

              <div className={ns.logoSubtext}>HealthCare Solutions</div>
            </Link>
          </div>

          {/* Center Navigation */}
          <div className={ns.centerNavContainer}>
            <div className={ns.glowEffect}>
              <div className={ns.centerNavInner}>
                <div
                  ref={navInnerRef}
                  className={ns.centerNavScrollContainer}
                  tabIndex={0}
                  style={{
                    WebkitOverflowScrolling: "touch",
                  }}
                >
                  <CenterNavItem
                    to="/h"
                    label="Dashboard"
                    icon={<Home size={16} />}
                  />

                  <CenterNavItem
                    to="/add"
                    label="Add Doctor"
                    icon={<UserPlus size={16} />}
                  />

                  <CenterNavItem
                    to="/list"
                    label="List Doctors"
                    icon={<Users size={16} />}
                  />

                  <CenterNavItem
                    to="/appointments"
                    label="Appointments"
                    icon={<Calendar size={16} />}
                  />

                  <CenterNavItem
                    to="/service-dashboard"
                    label="Service Dashboard"
                    icon={<Grid size={16} />}
                  />

                  <CenterNavItem
                    to="/add-service"
                    label="Add Service"
                    icon={<PlusSquare size={16} />}
                  />

                  <CenterNavItem
                    to="/list-service"
                    label="List Services"
                    icon={<List size={16} />}
                  />

                  <CenterNavItem
                    to="/service-appointments"
                    label="Service Appointments"
                    icon={<Calendar size={16} />}
                  />

                  {/* Active indicator */}
                  <div
                    ref={indicatorRef}
                    className="absolute bottom-0 left-0 h-0.5 transition-all duration-300 opacity-0"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right Side */}
          <div className={ns.rightContainer}>
            {/* Authentication */}
            {isSignedIn ? (
              <button
                onClick={handleSignOut}
                className={ns.signOutButton + " " + ns.cursorPointer}
              >
                Sign Out
              </button>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <button
                  onClick={handleOpenSignIn}
                  className={ns.loginButton + " " + ns.cursorPointer}
                >
                  Login
                </button>
              </div>
            )}
            {/** mobile toggel */}
            <button
              onClick={() => setOpen((v) => !v)}
              className={ns.mobileMenuButton}
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
        {/** mobile navigation*/}
        {open && (
          <div
            className={ns.mobileMenuContainer}
            onClick={() => setOpen(false)}
          />
        )}
        {open && (
          <div className={ns.mobileMenuContainer} id="mobile-menu">
            <div className={ns.mobileMenuInner}>
              <MobileItem
                to="/h"
                label="Dashboard"
                icon={<Home size={16} />}
                onClick={() => setOpen(false)}
              />

              <MobileItem
                to="/add"
                label="Add Doctor"
                icon={<UserPlus size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/list"
                label="List Doctors"
                icon={<Users size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/appointments"
                label="Appointments"
                icon={<Calendar size={16} />}
                onClick={() => setOpen(false)}
              />

              <MobileItem
                to="/service-dashboard"
                label="Service Dashboard"
                icon={<Grid size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/add-service"
                label="Add Service"
                icon={<PlusSquare size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/list-service"
                label="List Services"
                icon={<List size={16} />}
                onClick={() => setOpen(false)}
              />
              <MobileItem
                to="/service-appointments"
                label="Service Appointments"
                icon={<Calendar size={16} />}
                onClick={() => setOpen(false)}
              />

              <div className={ns.mobileAuthContainer}>
                {isSignedIn ? (
                  <button
                    onClick={() => {
                      handleSignOut();
                      setOpen(false);
                    }}
                    className={ns.mobileSignOutButton}
                  >
                    Sign Out
                  </button>
                ) : (
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        handleOpenSignIn();
                        setOpen(false);
                      }}
                      className={ns.mobileLoginButton + " " + ns.cursorPointer}
                    >
                      Login
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;

// ---------------------------------------
// Center Navigation Item
// ---------------------------------------
function CenterNavItem({ to, icon, label }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `nav-item ${isActive ? "active" : ""} ${ns.centerNavItemBase} ${
          isActive ? ns.centerNavItemActive : ""
        }`
      }
    >
      <span>{icon}</span>

      <span className="font-medium">{label}</span>
    </NavLink>
  );
}

function MobileItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      onClick={onClick}
      className={({ isActive }) =>
        `${ns.mobileItemBase} ${isActive ? ns.mobileItemActive : ns.mobileItemInactive}`
      }
    >
      {icon} <span className="font-medium text-sm">{label}</span>
    </NavLink>
  );
}
