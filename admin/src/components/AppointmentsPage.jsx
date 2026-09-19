


import React, { useEffect, useMemo, useState } from "react";
import {
  pageStyles,
  statusClasses,
  keyframesStyles,
} from "../assets/dummyStyles";
import {
  Search,
  Calendar,
  BadgeIndianRupee,
} from "lucide-react";

// const API_BASE = "http://localhost:4000";
import API_BASE from '../../api';


function formatDateISO(iso) {
  if (!iso) return "N/A";

  try {
    const d = new Date(`${iso}T00:00:00`);

    if (Number.isNaN(d.getTime())) {
      return iso;
    }

    return d.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  } catch (e) {
    return iso;
  }
}

function dateTimeFromSlot(slot) {
  try {
    if (!slot?.date) {
      return new Date(0);
    }

    const [y, m, d] = slot.date.split("-");

    const base = new Date(
      Number(y),
      Number(m) - 1,
      Number(d),
      0,
      0,
      0,
      0,
    );

    const timeValue = slot.time || "12:00 AM";

    const [time, ampmRaw] = timeValue
      .trim()
      .split(/\s+/);

    let [hh, mm] = time
      .split(":")
      .map(Number);

    const ampm = (ampmRaw || "AM").toUpperCase();

    if (ampm === "PM" && hh !== 12) {
      hh += 12;
    }

    if (ampm === "AM" && hh === 12) {
      hh = 0;
    }

    base.setHours(
      hh || 0,
      mm || 0,
      0,
      0,
    );

    return base;
  } catch (e) {
    return new Date(0);
  }
}

function normalizeAppointment(a) {
  if (!a) return null;

  const doctor =
    typeof a.doctorId === "object"
      ? a.doctorId
      : null;

  const doctorName =
    doctor?.name ||
    a.doctorName ||
    a.doctor?.name ||
    "Doctor";

  const speciality =
    doctor?.specialization ||
    a.speciality ||
    a.specialization ||
    a.doctor?.specialization ||
    "General";

  const fee =
    typeof a.fees === "number"
      ? a.fees
      : typeof a.fee === "number"
        ? a.fee
        : Number(a.fees || a.fee || 0);

  const date =
    a.date ||
    a.slot?.date ||
    "";

  const time =
    a.time ||
    a.slot?.time ||
    "12:00 AM";

  const status =
    String(
      a.status ||
        a.payment?.status ||
        "Pending",
    ).trim();

  return {
    id: String(a._id || a.id || ""),

    patientName:
      a.patientName ||
      a.patient?.name ||
      a.name ||
      "Unknown Patient",

    age:
      a.age ??
      a.patient?.age ??
      "",

    gender:
      a.gender ||
      a.patient?.gender ||
      "",

    mobile:
      a.mobile ||
      a.phone ||
      a.patient?.mobile ||
      "",

    doctorName,

    speciality,

    fee,

    slot: {
      date,
      time,
    },

    status,

    raw: a,
  };
}

const AppointmentsPage = () => {
  const isAdmin = true;

  const [appointments, setAppointments] =
    useState([]);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [query, setQuery] =
    useState("");

  const [filterDate, setFilterDate] =
    useState("");

  const [filterSpeciality, setFilterSpeciality] =
    useState("all");

  const [showAll, setShowAll] =
    useState(false);

  useEffect(() => {
    async function loadAppointments() {
      setLoading(true);
      setError(null);

      try {
        const url =
          `${API_BASE}/api/appointments?limit=200`;

        console.log(
          "Appointments API:",
          url,
        );

        const res = await fetch(url);

        const data = await res
          .json()
          .catch(() => ({}));

        console.log(
          "Appointments API response:",
          data,
        );

        if (!res.ok) {
          throw new Error(
            data?.message ||
              `Failed to fetch (${res.status})`,
          );
        }

        let items = [];

        if (Array.isArray(data?.appointment)) {
          items = data.appointment;
        } else if (Array.isArray(data?.data)) {
          items = data.data;
        } else if (Array.isArray(data?.items)) {
          items = data.items;
        } else if (Array.isArray(data)) {
          items = data;
        }

        console.log(
          "Appointments received:",
          items,
        );

        const normalized =
          items
            .map(normalizeAppointment)
            .filter(
              (item) => item?.id,
            );

        console.log(
          "Normalized appointments:",
          normalized,
        );

        setAppointments(normalized);
      } catch (err) {
        console.error(
          "Load appointments error:",
          err,
        );

        setError(
          err.message ||
            "Failed to load appointments",
        );

        setAppointments([]);
      } finally {
        setLoading(false);
      }
    }

    loadAppointments();
  }, []);

  const specialities = useMemo(() => {
    const set = new Set(
      appointments.map(
        (a) =>
          a.speciality || "General",
      ),
    );

    return [
      "all",
      ...Array.from(set),
    ];
  }, [appointments]);

  const filtered = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase();

    return appointments.filter(
      (a) => {
        if (
          filterSpeciality !==
            "all" &&
          (a.speciality || "")
            .toLowerCase() !==
            filterSpeciality.toLowerCase()
        ) {
          return false;
        }

        if (
          filterDate &&
          a.slot?.date !==
            filterDate
        ) {
          return false;
        }

        if (!q) {
          return true;
        }

        return (
          (a.doctorName || "")
            .toLowerCase()
            .includes(q) ||
          (a.speciality || "")
            .toLowerCase()
            .includes(q) ||
          (a.patientName || "")
            .toLowerCase()
            .includes(q) ||
          (a.mobile || "")
            .toLowerCase()
            .includes(q)
        );
      },
    );
  }, [
    appointments,
    query,
    filterDate,
    filterSpeciality,
  ]);

  const sortedFiltered = useMemo(() => {
    return filtered
      .slice()
      .sort((a, b) => {
        const da =
          dateTimeFromSlot(
            a.slot,
          ).getTime();

        const db =
          dateTimeFromSlot(
            b.slot,
          ).getTime();

        return db - da;
      });
  }, [filtered]);

  const displayed = useMemo(
    () =>
      showAll
        ? sortedFiltered
        : sortedFiltered.slice(
            0,
            8,
          ),
    [
      sortedFiltered,
      showAll,
    ],
  );

  async function adminCancelAppointment(
    id,
  ) {
    const appt =
      appointments.find(
        (x) => x.id === id,
      );

    if (!appt) return;

    const statusLower =
      String(
        appt.status || "",
      ).toLowerCase();

    const isCancelled =
      statusLower ===
        "canceled" ||
      statusLower ===
        "cancelled";

    const isCompleted =
      statusLower ===
      "completed";

    if (
      isCancelled ||
      isCompleted
    ) {
      return;
    }

    const ok = window.confirm(
      `As admin, mark appointment for ${appt.patientName} with ${appt.doctorName} on ${formatDateISO(appt.slot.date)} at ${appt.slot.time} as CANCELLED?`,
    );

    if (!ok) return;

    try {
      setAppointments(
        (prev) =>
          prev.map((p) =>
            p.id === id
              ? {
                  ...p,
                  status:
                    "Canceled",
                }
              : p,
          ),
      );

      const res =
        await fetch(
          `${API_BASE}/api/appointments/${id}/cancel`,
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
            },
          },
        );

      const data =
        await res
          .json()
          .catch(() => ({}));

      if (!res.ok) {
        throw new Error(
          data?.message ||
            `Cancel failed (${res.status})`,
        );
      }

      const updated =
        data?.appointment ||
        data?.appointments ||
        data?.data ||
        null;

      if (updated) {
        const normalized =
          normalizeAppointment(
            updated,
          );

        if (normalized) {
          setAppointments(
            (prev) =>
              prev.map((p) =>
                p.id === id
                  ? normalized
                  : p,
              ),
          );
        }
      }
    } catch (err) {
      console.error(
        "Cancel error:",
        err,
      );

      setError(
        err.message ||
          "Failed to cancel appointment",
      );

      window.location.reload();
    }
  }

  return (
    <div
      className={
        pageStyles.container
      }
    >
      <style>
        {keyframesStyles}
      </style>

      <div
        className={
          pageStyles.maxWidthContainer
        }
      >
        <header
          className={
            pageStyles.headerContainer
          }
        >
          <div
            className={
              pageStyles.headerTitleSection
            }
          >
            <h1
              className={
                pageStyles.headerTitle
              }
            >
              Appointments
            </h1>

            <p
              className={
                pageStyles.headerSubtitle
              }
            >
              Manage and search
              upcoming patient
              appointments
            </p>
          </div>

          <div
            className={
              pageStyles.headerControlsSection
            }
          >
            <div className="flex flex-col md:flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
              <div
                className={
                  pageStyles.searchContainer
                }
              >
                <Search
                  size={16}
                  className={
                    pageStyles.searchIcon
                  }
                />

                <input
                  className={
                    pageStyles.searchInput
                  }
                  placeholder="Search doctor, patient, speciality or mobile"
                  value={query}
                  onChange={(e) =>
                    setQuery(
                      e.target.value,
                    )
                  }
                />
              </div>

              <div
                className={
                  pageStyles.filterContainer
                }
              >
                <div
                  className={
                    pageStyles.dateFilter
                  }
                >
                  <Calendar
                    size={14}
                    className={
                      pageStyles.dateFilterIcon
                    }
                  />

                  <input
                    type="date"
                    className={
                      pageStyles.dateInput
                    }
                    value={
                      filterDate
                    }
                    onChange={(e) =>
                      setFilterDate(
                        e.target
                          .value,
                      )
                    }
                  />
                </div>

                <select
                  className={
                    pageStyles.selectFilter
                  }
                  value={
                    filterSpeciality
                  }
                  onChange={(e) =>
                    setFilterSpeciality(
                      e.target
                        .value,
                    )
                  }
                >
                  {specialities.map(
                    (s) => (
                      <option
                        value={s}
                        key={s}
                      >
                        {s ===
                        "all"
                          ? "All Specialties"
                          : s}
                      </option>
                    ),
                  )}
                </select>

                <button
                  onClick={() => {
                    setQuery("");
                    setFilterDate(
                      "",
                    );
                    setFilterSpeciality(
                      "all",
                    );
                    setShowAll(
                      false,
                    );
                    setError(null);
                  }}
                  className={
                    pageStyles.clearButton
                  }
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </header>

        {loading ? (
          <div
            className={
              pageStyles.loadingErrorContainer
            }
          >
            Loading...
          </div>
        ) : error ? (
          <div
            className={
              pageStyles.errorContainer
            }
          >
            {error}
          </div>
        ) : sortedFiltered.length ===
          0 ? (
          <div
            className={
              pageStyles.noResultsContainer
            }
          >
            No appointments found
          </div>
        ) : (
          <main
            className={
              pageStyles.gridContainer
            }
          >
            {displayed.map(
              (a, idx) => {
                const statusLower =
                  String(
                    a.status ||
                      "",
                  ).toLowerCase();

                const isCancelled =
                  statusLower ===
                    "canceled" ||
                  statusLower ===
                    "cancelled";

                const isCompleted =
                  statusLower ===
                  "completed";

                const isDisabled =
                  isCancelled ||
                  isCompleted;

                return (
                  <div
                    key={a.id}
                    style={{
                      animation:
                        `fadeUp 420ms cubic-bezier(.2,.9,.2,1) forwards`,
                      animationDelay:
                        `${idx * 70}ms`,
                      opacity: 0,
                    }}
                    className={
                      pageStyles.card
                    }
                  >
                    <div
                      className={
                        pageStyles.cardHeader
                      }
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className={
                              pageStyles.cardTitle
                            }
                          >
                            {
                              a.patientName
                            }
                          </h3>

                          <div
                            className={
                              pageStyles.patientInfo
                            }
                          >
                            <span>
                              {a.age
                                ? `${a.age} yrs`
                                : ""}
                            </span>

                            {a.age &&
                              a.gender && (
                                <span>
                                  :
                                </span>
                              )}

                            <span>
                              {
                                a.gender
                              }
                            </span>

                            {a.mobile && (
                              <span className="hidden md:inline">
                                :
                              </span>
                            )}

                            <span className="max-w-[120px]">
                              {
                                a.mobile
                              }
                            </span>
                          </div>
                        </div>

                        <div
                          className={
                            pageStyles.doctorInfo
                          }
                        >
                          {
                            a.doctorName
                          }

                          {" : "}

                          <span
                            className={
                              pageStyles.doctorSpeciality
                            }
                          >
                            {
                              a.speciality
                            }
                          </span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={
                            pageStyles.feeLabel
                          }
                        >
                          Fees
                        </div>

                        <div
                          className={
                            pageStyles.feeAmount
                          }
                        >
                          <BadgeIndianRupee
                            size={16}
                          />

                          <span>
                            ₹
                            {a.fee}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div
                        className={
                          pageStyles.slotContainer
                        }
                      >
                        <Calendar
                          size={14}
                          className={
                            pageStyles.slotIcon
                          }
                        />

                        <span>
                          {formatDateISO(
                            a.slot
                              .date,
                          )}

                          {" — "}

                          {
                            a.slot
                              .time
                          }
                        </span>
                      </div>

                      <div
                        className={`${pageStyles.statusBadge} ${statusClasses(
                          a.status,
                        )}`}
                      >
                        {a.status
                          ? a.status.toUpperCase()
                          : "PENDING"}
                      </div>

                      <div className="flex items-center gap-2">
                        {isAdmin && (
                          <button
                            onClick={() =>
                              adminCancelAppointment(
                                a.id,
                              )
                            }
                            title={
                              isDisabled
                                ? isCompleted
                                  ? "Cannot cancel a completed appointment"
                                  : "Already cancelled"
                                : "Admin Cancel"
                            }
                            disabled={
                              isDisabled
                            }
                            aria-disabled={
                              isDisabled
                            }
                            className={pageStyles.cancelButton(
                              isDisabled,
                              isCompleted,
                            )}
                          >
                            {isDisabled
                              ? isCompleted
                                ? "Completed"
                                : "Admin Cancelled"
                              : "Admin Cancel"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              },
            )}
          </main>
        )}

        {sortedFiltered.length >
          8 && (
          <div className="flex justify-center mt-4">
            <button
              onClick={() =>
                setShowAll(
                  (s) => !s,
                )
              }
              className={
                pageStyles.showMoreButton
              }
            >
              {showAll
                ? "Show Less"
                : `Show more (${sortedFiltered.length - 8})`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AppointmentsPage;
