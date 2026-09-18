import React, { useEffect, useRef, useState } from "react";
import { navbarStyles } from "../assets/dummyStyles";

import { useLocation, Link } from "react-router-dom";
import { Key, Menu, User, X } from "lucide-react";
import logo from "../assets/logo.png";

import { useClerk, useUser, UserButton } from "@clerk/react";

const STORAGE_KEY = "doctorToken_vl";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [showNavbar, setShowNavbar] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  //Hide and Show navbar on Scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 80) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
      setLastScrollY(currentScrollY);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

//Sync the doctor login state
  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === STORAGE_KEY) {
        setIsDoctorLoggedIn(Boolean(e.newValue));
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  //closse the toggle menu

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isOpen && navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const [isDoctorLoggedIn, setIsDoctorLoggedIn] = useState(() => {
    try {
      return Boolean(localStorage.getItem(STORAGE_KEY));
    } catch {
      return false;
    }
  });

  const location = useLocation();
  const navRef = useRef(null);

  const clerk = useClerk();
  const { isSignedIn } = useUser();

  const navItems = [
    { label: "Home", href: "/" },
    { label: "Doctors", href: "/doctors" },
    { label: "Services", href: "/services" },
    { label: "Appointments", href: "/appointments" },
    { label: "Contact", href: "/contact" },
  ];

  return (
    <>
      <div className={navbarStyles.navbarBorder}></div>

      <nav ref={navRef}
        className={`${navbarStyles.navbarContainer} ${
          showNavbar ? navbarStyles.navbarVisible : navbarStyles.navbarHidden
        }`}
      >
        <div className={navbarStyles.contentWrapper}>
          <div className={navbarStyles.flexContainer}>
            <Link to="/" className={navbarStyles.logoLink}>
              <div className={navbarStyles.logoContainer}>
                <div className={navbarStyles.logoImageWrapper}>
                  <img
                    src={logo}
                    alt="MediCare Logo"
                    className={navbarStyles.logoImage}
                  />
                </div>
              </div>

              <div className={navbarStyles.logoTextContainer}>
                <h1 className={navbarStyles.logoTitle}>MediCare</h1>

                <p className={navbarStyles.logoSubtitle}>
                  HealthCare Solutions
                </p>
              </div>
            </Link>

            <div className={navbarStyles.desktopNav}>
              <div className={navbarStyles.navItemsContainer}>
                {navItems.map((item) => {
                  const isActive = location.pathname === item.href;

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={`${navbarStyles.navItem} ${
                        isActive
                          ? navbarStyles.navItemActive
                          : navbarStyles.navItemInactive
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            <div className={navbarStyles.rightContainer}>
              {/* USER NOT LOGGED IN */}
              {!isSignedIn ? (
                <>
                  {/* Doctor Button */}
                  <Link
                    to="/doctor-admin/login"
                    className={navbarStyles.doctorAdminButton}
                  >
                    <User className={navbarStyles.doctorAdminIcon} />

                    <span className={navbarStyles.doctorAdminText}>Doctor</span>
                  </Link>

                  {/* Login Button */}
                  <button
                    onClick={() => clerk.openSignIn()}
                    className={navbarStyles.loginButton}
                  >
                    <Key className={navbarStyles.loginIcon} />
                    Login
                  </button>
                </>
              ) : (
                /* USER LOGGED IN */
                <UserButton />
              )}

              <button
                onClick={() => setIsOpen(!isOpen)}
                className={navbarStyles.mobileToggle}
              >
                {isOpen ? (
                  <X className={navbarStyles.toggleIcon} />
                ) : (
                  <Menu className={navbarStyles.toggleIcon} />
                )}
              </button>
            </div>
          </div>

          {isOpen && (
            <div className={navbarStyles.mobileMenu}>
              {/* Navigation Links */}
              {navItems.map((item, idx) => {
                const isActive = location.pathname === item.href;

                return (
                  <Link
                    key={idx}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`${navbarStyles.mobileMenuItem} ${
                      isActive
                        ? navbarStyles.mobileMenuItemActive
                        : navbarStyles.mobileMenuItemInactive
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {!isSignedIn ? (
                <>
                  {/* Doctor Admin */}
                  <Link
                    to="/doctor-admin/login"
                    className={navbarStyles.mobileDoctorAdminButton}
                    onClick={() => setIsOpen(false)}
                  >
                    Doctor Admin
                  </Link>

                  {/* Login */}
                  <div className={navbarStyles.mobileLoginContainer}>
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        clerk.openSignIn();
                      }}
                      className={navbarStyles.mobileLoginButton}
                    >
                      Login
                    </button>
                  </div>
                </>
              ) : (
                /* Mobile Profile */
                <div className="flex justify-center py-3">
                  <UserButton />
                </div>
              )}
            </div>
          )}
        </div>

        <style>{navbarStyles.animationStyles}</style>
      </nav>
    </>
  );
};

export default Navbar;
