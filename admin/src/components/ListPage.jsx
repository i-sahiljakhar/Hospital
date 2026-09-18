

import React, { useEffect, useMemo, useState } from "react";
import { doctorListStyles } from "../assets/dummyStyles";
import {
  BadgeIndianRupee,
  EyeClosed,
  Search,
  Star,
  Trash2,
  Users,
} from "lucide-react";

// Format date: 2026-09-10 -> 10 Sep 2026
function formatDateISO(iso) {
  if (!iso || typeof iso !== "string") return iso;

  const parts = iso.split("-");

  if (parts.length !== 3) return iso;

  const [y, m, d] = parts;

  const dateObj = new Date(Number(y), Number(m) - 1, Number(d));

  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "June",
    "July",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  const day = String(Number(d));
  const month = monthNames[dateObj.getMonth()] || "";

  return `${day} ${month} ${y}`;
}

// Convert date into YYYY-MM-DD
function normalizeToDateString(d) {
  if (!d) return null;

  const dt = new Date(d);

  if (Number.isNaN(dt.getTime())) {
    return null;
  }

  return dt.toISOString().split("T")[0];
}

// Convert schedule into date -> slots map
function buildScheduleMap(schedule) {
  const map = {};

  if (!schedule || typeof schedule !== "object") {
    return map;
  }

  Object.entries(schedule).forEach(([key, value]) => {
    const normalizedDate = normalizeToDateString(key) || String(key);

    map[normalizedDate] = Array.isArray(value) ? value.slice() : [];
  });

  return map;
}

// Sort schedule dates
function getSortedScheduleDates(scheduleLike) {
  let keys = [];

  if (Array.isArray(scheduleLike)) {
    keys = scheduleLike.map(normalizeToDateString).filter(Boolean);
  } else if (scheduleLike && typeof scheduleLike === "object") {
    keys = Object.keys(scheduleLike).map(normalizeToDateString).filter(Boolean);
  }

  keys = Array.from(new Set(keys));

  const parsed = keys.map((ds) => ({
    ds,
    date: new Date(ds),
  }));

  const dateVal = (d) => Date.UTC(d.getFullYear(), d.getMonth(), d.getDate());

  const today = new Date();
  const todayVal = dateVal(today);

  // Past dates: latest first
  const past = parsed
    .filter((p) => dateVal(p.date) < todayVal)
    .sort((a, b) => dateVal(b.date) - dateVal(a.date));

  // Future dates: nearest first
  const future = parsed
    .filter((p) => dateVal(p.date) >= todayVal)
    .sort((a, b) => dateVal(a.date) - dateVal(b.date));

  return [...past, ...future].map((p) => p.ds);
}

const ListPage = () => {
  const API_BASE = "http://localhost:4000";

  const [doctors, setDoctors] = useState([]);
  const [expanded, setExpanded] = useState(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [loading, setLoading] = useState(false);

  const [isMobileScreen, setIsMobileScreen] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    function onResize() {
      setIsMobileScreen(window.innerWidth < 640);
    }

    onResize();

    window.addEventListener("resize", onResize);

    return () => {
      window.removeEventListener("resize", onResize);
    };
  }, []);

  // Fetch doctors
  async function fetchDoctors() {
    setLoading(true);

    try {
      const res = await fetch(`${API_BASE}/api/doctors`);

      const body = await res.json().catch(() => null);

      if (res.ok && body && body.success) {
        const list = Array.isArray(body.data)
          ? body.data
          : Array.isArray(body.doctors)
            ? body.doctors
            : [];

        const normalized = list.map((doctor) => {
          const scheduleMap = buildScheduleMap(doctor.schedule || {});

          return {
            ...doctor,
            schedule: scheduleMap,
          };
        });

        setDoctors(normalized);
      } else {
        console.error("Failed to fetch doctors", {
          status: res.status,
          body,
        });

        setDoctors([]);
      }
    } catch (error) {
      console.error("Network error fetching doctors:", error);

      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Search + status filter
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();

    let list = doctors;

    if (filterStatus === "available") {
      list = list.filter(
        (doctor) =>
          (doctor.availability || "").toString().toLowerCase() === "available",
      );
    } else if (filterStatus === "unavailable") {
      list = list.filter(
        (doctor) =>
          (doctor.availability || "").toString().toLowerCase() !== "available",
      );
    }

    if (!q) {
      return list;
    }

    return list.filter((doctor) => {
      return (
        (doctor.name || "").toLowerCase().includes(q) ||
        (doctor.specialization || "").toLowerCase().includes(q)
      );
    });
  }, [doctors, query, filterStatus]);

  // Show first 6 doctors
  const displayed = useMemo(() => {
    if (showAll) {
      return filtered;
    }

    return filtered.slice(0, 6);
  }, [filtered, showAll]);

  // Expand / collapse doctor
  function toggle(id) {
    setExpanded((prev) => (prev === id ? null : id));
  }

  // Delete doctor
  async function removeDoctor(id) {
    const doctor = doctors.find((d) => (d._id || d.id) === id);

    if (!doctor) return;

    const ok = window.confirm(`Delete ${doctor.name}? This cannot be undone.`);

    if (!ok) return;

    try {
      const res = await fetch(`${API_BASE}/api/doctors/${id}`, {
        method: "DELETE",
      });

      const body = await res.json().catch(() => null);

      if (!res.ok) {
        alert(body?.message || "Failed to delete doctor");

        return;
      }

      setDoctors((prev) =>
        prev.filter((doctor) => (doctor._id || doctor.id) !== id),
      );

      if (expanded === id) {
        setExpanded(null);
      }
    } catch (error) {
      console.error("Delete error:", error);

      alert("Network error deleting doctor");
    }
  }

  // Apply availability filter
  function applyStatusFilter(status) {
    setFilterStatus((prev) => (prev === status ? "all" : status));

    setExpanded(null);
    setShowAll(false);
  }

  // Clear search + filters
  function clearFilters() {
    setQuery("");
    setExpanded(null);
    setShowAll(false);
    setFilterStatus("all");
  }

  return (
    <section className={doctorListStyles.container}>
      {/* Header */}
      <header className={doctorListStyles.headerContainer}>
        <div className={doctorListStyles.headerTopSection}>
          {/* Title */}
          <div className={doctorListStyles.headerIconContainer}>
            <div className={doctorListStyles.headerIcon}>
              <Users size={20} className={doctorListStyles.headerIconSvg} />
            </div>

            <div>
              <h1 className={doctorListStyles.headerTitle}>Find a Doctor</h1>

              <p className={doctorListStyles.headerSubtitle}>
                Search by name or specialization
              </p>
            </div>
          </div>

          {/* Search */}
          <div className={doctorListStyles.searchBox}>
            <Search size={16} className={doctorListStyles.searchIcon} />

            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setShowAll(false);
              }}
              placeholder="Search Doctors, specialization"
              className={doctorListStyles.searchInput}
            />

            <button
              type="button"
              onClick={clearFilters}
              className={doctorListStyles.clearButton}
            >
              Clear
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className={doctorListStyles.filterContainer}>
          <button
            type="button"
            onClick={() => applyStatusFilter("available")}
            className={doctorListStyles.filterButton(
              filterStatus === "available",
              "emerald",
            )}
          >
            Available
          </button>

          <button
            type="button"
            onClick={() => applyStatusFilter("unavailable")}
            className={doctorListStyles.filterButton(
              filterStatus === "unavailable",
              "red",
            )}
          >
            Unavailable
          </button>
        </div>
      </header>

      {/* Doctor List */}
      <main className={doctorListStyles.gridContainer}>
        {loading && (
          <div className={doctorListStyles.loadingContainer}>
            Loading Doctors...
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className={doctorListStyles.noResultsContainer}>
            No doctors match your search
          </div>
        )}

        {!loading &&
          displayed.map((doc) => {
            const id = doc._id || doc.id;

            const isOpen = expanded === id;

            const isAvailable =
              (doc.availability || "").toString().toLowerCase() === "available";

            const scheduleMap = buildScheduleMap(doc.schedule || {});

            const sortedDates = getSortedScheduleDates(scheduleMap);

            return (
              <article key={id} className={doctorListStyles.article}>
                {/* Doctor basic information */}
                <div className={doctorListStyles.articleContent}>
                  <img
                    src={doc.imageUrl || doc.image || ""}
                    alt={doc.name || "Doctor"}
                    className={doctorListStyles.doctorImage}
                  />

                  <div className={doctorListStyles.doctorInfoContainer}>
                    <div className={doctorListStyles.doctorHeader}>
                      <div className="min-w-0 w-full">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className={doctorListStyles.doctorName}>
                            {doc.name}
                          </h3>

                          <span
                            className={doctorListStyles.availabilityBadge(
                              isAvailable,
                            )}
                          >
                            <span
                              className={doctorListStyles.availabilityDot(
                                isAvailable,
                              )}
                            />

                            {isAvailable ? "Available" : "Unavailable"}
                          </span>
                        </div>

                        <div className={doctorListStyles.doctorDetails}>
                          {doc.specialization || "General"} •{" "}
                          {doc.experience || 0} Years
                        </div>
                      </div>

                      <div className={doctorListStyles.ratingContainer}>
                        <div className={doctorListStyles.rating}>
                          <Star size={14} />
                          {doc.rating || 0}
                        </div>

                        <button
                          type="button"
                          onClick={() => toggle(id)}
                          className={doctorListStyles.toggleButton(isOpen)}
                        >
                          <EyeClosed size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className={doctorListStyles.statsContainer}>
                      <div className={doctorListStyles.statsLabel}>
                        Patients
                      </div>

                      <div className={doctorListStyles.statsValue}>
                        <Users size={14} />
                        {doc.patients || 0}
                      </div>

                      <div className={doctorListStyles.actionContainer}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => removeDoctor(id)}
                            className={doctorListStyles.deleteButton}
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>

                          <div className={doctorListStyles.feesLabel}>
                            Fees:
                          </div>

                          <div className={doctorListStyles.feesValue}>
                            <BadgeIndianRupee size={16} />
                            {doc.fee || 0}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expandable details */}
                <div
                  className={doctorListStyles.expandableContent}
                  style={{
                    maxHeight: isOpen ? (isMobileScreen ? 320 : 600) : 0,
                    transition:
                      "max-height 420ms cubic-bezier(.2,.9,.2,1), padding 220ms ease",
                    paddingTop: isOpen ? 16 : 0,
                    paddingBottom: isOpen ? 16 : 0,
                  }}
                >
                  {isOpen && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* About */}
                      <div className={doctorListStyles.aboutSection}>
                        <h4 className={doctorListStyles.aboutHeading}>About</h4>

                        <p className={doctorListStyles.aboutText}>
                          {doc.about || "No information available."}
                        </p>

                        {/* Qualifications */}
                        <div className="mt-4">
                          <div
                            className={doctorListStyles.qualificationsHeading}
                          >
                            Qualifications
                          </div>

                          <div className={doctorListStyles.qualificationsText}>
                            {doc.qualifications || "Not provided"}
                          </div>
                        </div>

                        {/* Schedule */}
                        <div className="mt-4">
                          <div className={doctorListStyles.scheduleHeading}>
                            Schedule
                          </div>

                          <div className="mt-2 flex flex-wrap gap-2">
                            {sortedDates.length === 0 ? (
                              <span className="text-sm text-gray-500">
                                No schedule available
                              </span>
                            ) : (
                              sortedDates.map((date) => {
                                const slots = scheduleMap[date] || [];

                                return (
                                  <div
                                    key={date}
                                    className="min-w-full md:min-w-0"
                                  >
                                    <div
                                      className={doctorListStyles.scheduleDate}
                                    >
                                      {formatDateISO(date)}
                                    </div>

                                    <div className="mt-1 flex flex-wrap gap-2">
                                      {slots.length === 0 ? (
                                        <span className="text-sm text-gray-500">
                                          No slots
                                        </span>
                                      ) : (
                                        slots.map((slot, index) => (
                                          <span
                                            key={index}
                                            className={
                                              doctorListStyles.scheduleSlot
                                            }
                                          >
                                            {slot}
                                          </span>
                                        ))
                                      )}
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Sidebar */}
                      <aside className={doctorListStyles.statsSidebar}>
                        <div className={doctorListStyles.statsItemHeading}>
                          Success
                        </div>

                        <div className={doctorListStyles.statsItemValue}>
                          {doc.success || 0}%
                        </div>

                        <div className={doctorListStyles.statsItemHeading}>
                          Patients
                        </div>

                        <div className={doctorListStyles.statsItemValue}>
                          {doc.patients || 0}
                        </div>

                        <div className={doctorListStyles.statsItemHeading}>
                          Location
                        </div>

                        <div className={doctorListStyles.locationValue}>
                          {doc.location || "Not provided"}
                        </div>
                      </aside>
                    </div>
                  )}
                </div>
              </article>
            );
          })}

        {filtered.length > 6 && (
          <div className={doctorListStyles.showMoreContainer}>
            <button
              onClick={() => setShowAll((s) => !s)}
              className={doctorListStyles.showMoreButton}
            >
              {showAll ? "Show Less" : `Show more(${filtered.length - 4}`}
            </button>
          </div>
        )}
      </main>
    </section>
  );
};

export default ListPage;
