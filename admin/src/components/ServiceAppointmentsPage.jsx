


import React, { useEffect, useMemo, useState } from "react";
import { serviceAppointmentsStyles } from "../assets/dummyStyles";
import {
  Loader2,
  SearchIcon,
  XIcon,
  CheckCircle,
  XCircle,
  UserRound,
  Phone,
  CalendarDays,
  Clock3,
  IndianRupee,
} from "lucide-react";
import API_BASE from '../../api';
//const API_BASE = "http://localhost:4000";

function formatTwo(n) {
  return String(n).padStart(2, "0");
}

function formatDateNice(dateStr) {
  if (!dateStr) return "";

  const d = new Date(`${dateStr}T00:00:00`);

  if (Number.isNaN(d.getTime())) {
    return String(dateStr);
  }

  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function parseTimeToParts(timeStr) {
  if (!timeStr) {
    return {
      hour: 12,
      minute: 0,
      ampm: "AM",
    };
  }

  const value = String(timeStr).trim();

  const m = value.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);

  if (!m) {
    return {
      hour: 12,
      minute: 0,
      ampm: "AM",
    };
  }

  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const ampm = m[3] ? m[3].toUpperCase() : null;

  if (!ampm) {
    return {
      hour: hh % 12 === 0 ? 12 : hh % 12,
      minute: mm,
      ampm: hh >= 12 ? "PM" : "AM",
    };
  }

  return {
    hour: hh,
    minute: mm,
    ampm,
  };
}

function timePartsToInputValue(a) {
  const hour = Number(a.hour || 12);
  const minute = Number(a.minute || 0);
  const ampm = String(a.ampm || "AM").toUpperCase();

  let hh24 = hour % 12;

  if (ampm === "PM") {
    hh24 += 12;
  }

  if (ampm === "AM" && hour === 12) {
    hh24 = 0;
  }

  if (ampm === "PM" && hour === 12) {
    hh24 = 12;
  }

  return `${formatTwo(hh24)}:${formatTwo(minute)}`;
}

function formatTimeDisplay(a) {
  if (a.time) {
    const value = String(a.time).trim();

    if (/AM|PM/i.test(value)) {
      return value;
    }

    const parsed = parseTimeToParts(value);

    return `${formatTwo(parsed.hour)}:${formatTwo(
      parsed.minute
    )} ${parsed.ampm}`;
  }

  return `${formatTwo(a.hour || 12)}:${formatTwo(
    a.minute || 0
  )} ${a.ampm || "AM"}`;
}

function getTodayISO() {
  const d = new Date();

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}-${m}-${day}`;
}

function isDateBefore(aDateStr, bDateStr) {
  if (!aDateStr || !bDateStr) return false;

  const a = new Date(`${aDateStr}T00:00:00`);
  const b = new Date(`${bDateStr}T00:00:00`);

  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) {
    return false;
  }

  return a.getTime() < b.getTime();
}

function StatusBadge({ status }) {
  const normalizedStatus = String(status || "Pending").trim();

  const classes = serviceAppointmentsStyles.statusBadge(
    normalizedStatus
  );

  return (
    <span className={classes}>
      {normalizedStatus === "Confirmed" && (
        <CheckCircle className="h-4 w-4" />
      )}

      {normalizedStatus === "Canceled" && (
        <XCircle className="h-4 w-4" />
      )}

      {normalizedStatus}
    </span>
  );
}

function Toast({ toasts, removeToast }) {
  return (
    <div className={serviceAppointmentsStyles.toastContainer}>
      {toasts.map((t) => (
        <div
          key={t.id}
          className={serviceAppointmentsStyles.toast}
        >
          <div
            className={serviceAppointmentsStyles.toastContent}
          >
            <div className="mt-0.5">
              {t.type === "error" ? (
                <XCircle
                  className={
                    serviceAppointmentsStyles.detailIcon
                  }
                />
              ) : (
                <CheckCircle
                  className={
                    serviceAppointmentsStyles.detailIcon
                  }
                />
              )}
            </div>

            <div
              className={serviceAppointmentsStyles.toastText}
            >
              <div
                className={
                  serviceAppointmentsStyles.toastTitle
                }
              >
                {t.title}
              </div>

              <div
                className={
                  serviceAppointmentsStyles.toastMessage
                }
              >
                {t.message}
              </div>
            </div>

            <button
              type="button"
              onClick={() => removeToast(t.id)}
              className={
                serviceAppointmentsStyles.toastCloseButton
              }
              aria-label="close toast"
            >
              <XIcon size={16} />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function StatusSelect({
  appointment,
  onChange,
  disabled,
}) {
  const terminal =
    appointment.status === "Completed" ||
    appointment.status === "Canceled";

  return (
    <select
      value={appointment.status || "Pending"}
      onChange={(e) => onChange(e.target.value)}
      disabled={terminal || disabled}
      className={serviceAppointmentsStyles.statusSelect(
        terminal || disabled
      )}
      title={
        terminal
          ? "Status cannot be changed"
          : "Change status"
      }
    >
      <option value="Pending">Pending</option>
      <option value="Confirmed">Confirmed</option>
      <option value="Completed">Completed</option>
      <option value="Canceled">Canceled</option>
    </select>
  );
}

function RescheduleButton({
  appointment,
  onReschedule,
  disabled,
}) {
  const terminal =
    appointment.status === "Completed" ||
    appointment.status === "Canceled";

  const [editing, setEditing] = useState(false);

  const todayISO = getTodayISO();

  const [date, setDate] = useState(
    appointment.date || todayISO
  );

  const [time, setTime] = useState(
    appointment.time
      ? timePartsToInputValue(
          parseTimeToParts(appointment.time)
        )
      : timePartsToInputValue(appointment)
  );

  useEffect(() => {
    const baseDate = appointment.date || "";

    const initialDate =
      baseDate && !isDateBefore(baseDate, todayISO)
        ? baseDate
        : todayISO;

    setDate(initialDate);

    if (appointment.time) {
      setTime(
        timePartsToInputValue(
          parseTimeToParts(appointment.time)
        )
      );
    } else {
      setTime(timePartsToInputValue(appointment));
    }
  }, [
    appointment.date,
    appointment.time,
    appointment.hour,
    appointment.minute,
    appointment.ampm,
  ]);

  function save() {
    if (!date || !time) {
      return;
    }

    if (isDateBefore(date, getTodayISO())) {
      alert(
        "Please choose today or a future date for rescheduling."
      );
      return;
    }

    onReschedule(date, time);
    setEditing(false);
  }

  function cancel() {
    const baseDate = appointment.date || "";

    const restoreDate =
      baseDate && !isDateBefore(baseDate, getTodayISO())
        ? baseDate
        : getTodayISO();

    setDate(restoreDate);

    if (appointment.time) {
      setTime(
        timePartsToInputValue(
          parseTimeToParts(appointment.time)
        )
      );
    } else {
      setTime(timePartsToInputValue(appointment));
    }

    setEditing(false);
  }

  if (editing) {
    return (
      <div
        className={
          serviceAppointmentsStyles.rescheduleEditContainer
        }
      >
        <input
          type="date"
          min={todayISO}
          value={date}
          onChange={(e) => setDate(e.target.value)}
          className={
            serviceAppointmentsStyles.rescheduleDateInput
          }
        />

        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className={
            serviceAppointmentsStyles.rescheduleTimeInput
          }
        />

        <div
          className={
            serviceAppointmentsStyles.rescheduleActions
          }
        >
          <button
            type="button"
            onClick={save}
            disabled={disabled || terminal}
            className={
              serviceAppointmentsStyles.rescheduleSaveButton
            }
          >
            Save
          </button>

          <button
            type="button"
            onClick={cancel}
            className={
              serviceAppointmentsStyles.rescheduleCancelButton
            }
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      disabled={terminal || disabled}
      className={
        serviceAppointmentsStyles.rescheduleButton(
          terminal || disabled
        )
      }
    >
      Reschedule
    </button>
  );
}

const ServiceAppointmentsPage = () => {
  const [appointments, setAppointments] = useState([]);

  const [toasts, setToasts] = useState([]);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");

  const [debouncedSearch, setDebouncedSearch] =
    useState("");

  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 220);

    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  function pushToast(
    title,
    message,
    type = "success"
  ) {
    const toastId = Date.now() + Math.random();

    setToasts((prev) => [
      ...prev,
      {
        id: toastId,
        title,
        message,
        type,
      },
    ]);
  }

  function removeToast(id) {
    setToasts((prev) =>
      prev.filter((toast) => toast.id !== id)
    );
  }

  useEffect(() => {
    if (toasts.length === 0) return;

    const timers = toasts.map((toast) =>
      setTimeout(() => {
        setToasts((prev) =>
          prev.filter((item) => item.id !== toast.id)
        );
      }, 3000)
    );

    return () => {
      timers.forEach((timer) =>
        clearTimeout(timer)
      );
    };
  }, [toasts]);

  async function fetchAppointments() {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${API_BASE}/api/service-appointments?limit=500`
      );

      const body = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body?.message ||
            `Failed to fetch appointments (${response.status})`
        );
      }

      const list = Array.isArray(body.appointments)
        ? body.appointments
        : Array.isArray(body.appointment)
        ? body.appointment
        : Array.isArray(body.items)
        ? body.items
        : Array.isArray(body.data)
        ? body.data
        : Array.isArray(body)
        ? body
        : [];

      const normalized = list
        .map((a) => {
          let timeStr =
            a.time ||
            a.slot?.time ||
            a.rescheduledTo?.time ||
            "";

          if (
            !timeStr &&
            a.hour !== undefined &&
            a.minute !== undefined
          ) {
            timeStr = `${formatTwo(
              a.hour || 12
            )}:${formatTwo(a.minute ?? 0)} ${
              a.ampm || "AM"
            }`;
          }

          const parsed = parseTimeToParts(timeStr);

          return {
            ...a,

            id: String(a._id || a.id || ""),

            patientName:
              a.patientName ||
              a.patient?.name ||
              a.name ||
              "Unknown Patient",

            gender:
              a.gender ||
              a.patient?.gender ||
              "",

            mobile:
              a.mobile ||
              a.phone ||
              a.patient?.mobile ||
              "",

            age:
              a.age ||
              a.patient?.age ||
              "",

            serviceName:
              a.serviceName ||
              a.service?.name ||
              a.service ||
              a.name ||
              "General Service",

            fees:
              a.fees ??
              a.fee ??
              a.price ??
              a.payment?.amount ??
              0,

            date:
              a.date ||
              a.slot?.date ||
              a.rescheduledTo?.date ||
              "",

            time: timeStr,

            hour: parsed.hour,

            minute: parsed.minute,

            ampm: parsed.ampm,

            status: String(
              a.status || "Pending"
            ).trim(),

            raw: a,
          };
        })
        .filter((a) => a.id);

      setAppointments(normalized);
    } catch (err) {
      console.error(
        "fetchAppointments:",
        err
      );

      setError(
        err.message ||
          "Failed to load appointments"
      );

      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }

  function extractUpdated(body) {
    return (
      body?.data ||
      body?.appointment ||
      body ||
      {}
    );
  }

  async function changeStatusRemote(
    id,
    newStatus
  ) {
    if (!id) {
      pushToast(
        "Update Failed",
        "Appointment ID is missing.",
        "error"
      );
      return;
    }

    const old = appointments.find(
      (appointment) => appointment.id === id
    );

    if (!old) {
      pushToast(
        "Update Failed",
        "Appointment not found.",
        "error"
      );
      return;
    }

    if (
      old.status === "Completed" ||
      old.status === "Canceled"
    ) {
      pushToast(
        "Cannot change status",
        `Appointment #${id} is already ${old.status}.`,
        "error"
      );
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/service-appointments/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            status: newStatus,
          }),
        }
      );

      const body = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body?.message ||
            `Status update failed (${response.status})`
        );
      }

      const updated = extractUpdated(body);

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id
            ? {
                ...appointment,

                status:
                  String(
                    updated.status ||
                      newStatus
                  ).trim(),

                date:
                  updated.date ||
                  updated.rescheduledTo?.date ||
                  appointment.date,

                time:
                  updated.time ||
                  updated.rescheduledTo?.time ||
                  appointment.time,

                raw:
                  updated &&
                  Object.keys(updated).length
                    ? updated
                    : appointment.raw,
              }
            : appointment
        )
      );

      pushToast(
        "Status Updated",
        `Appointment #${id} is now ${newStatus}.`
      );
    } catch (err) {
      console.error(
        "changeStatusRemote:",
        err
      );

      setAppointments((prev) =>
        prev.map((appointment) =>
          appointment.id === id
            ? {
                ...appointment,
                status: old.status,
              }
            : appointment
        )
      );

      pushToast(
        "Update Failed",
        err.message ||
          "Failed to update status.",
        "error"
      );
    }
  }

  async function rescheduleRemote(
    id,
    dateStr,
    time24
  ) {
    if (!id || !dateStr || !time24) {
      return;
    }

    const appointment = appointments.find(
      (a) => a.id === id
    );

    if (!appointment) {
      return;
    }

    const [hh, mm] = time24
      .split(":")
      .map(Number);

    const hour12 =
      hh % 12 === 0 ? 12 : hh % 12;

    const ampm =
      hh >= 12 ? "PM" : "AM";

    const timeStr = `${formatTwo(
      hour12
    )}:${formatTwo(mm)} ${ampm}`;

    try {
      const response = await fetch(
        `${API_BASE}/api/service-appointments/${id}`,
        {
          method: "PUT",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            rescheduledTo: {
              date: dateStr,
              time: timeStr,
            },

            status: "Rescheduled",
          }),
        }
      );

      const body = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body?.message ||
            `Reschedule failed (${response.status})`
        );
      }

      const updated = extractUpdated(body);

      const finalDate =
        updated.date ||
        updated.rescheduledTo?.date ||
        dateStr;

      const finalTime =
        updated.time ||
        updated.rescheduledTo?.time ||
        timeStr;

      const parsed =
        parseTimeToParts(finalTime);

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,

                date: finalDate,

                time: finalTime,

                hour: parsed.hour,

                minute: parsed.minute,

                ampm: parsed.ampm,

                status:
                  String(
                    updated.status ||
                      "Rescheduled"
                  ).trim(),

                raw:
                  updated &&
                  Object.keys(updated).length
                    ? updated
                    : a.raw,
              }
            : a
        )
      );

      pushToast(
        "Rescheduled",
        `Appointment #${id} moved to ${formatDateNice(
          finalDate
        )} ${finalTime}.`
      );
    } catch (err) {
      console.error(
        "rescheduleRemote:",
        err
      );

      pushToast(
        "Reschedule Failed",
        err.message ||
          "Unable to reschedule appointment.",
        "error"
      );

      await fetchAppointments();
    }
  }

  async function cancelRemote(id) {
    if (!id) return;

    const appointment = appointments.find(
      (a) => a.id === id
    );

    if (!appointment) {
      return;
    }

    if (appointment.status === "Canceled") {
      return;
    }

    if (appointment.status === "Completed") {
      pushToast(
        "Cannot Cancel",
        "Completed appointment cannot be canceled.",
        "error"
      );
      return;
    }

    const confirmed = window.confirm(
      `Mark appointment for ${
        appointment.patientName
      } on ${formatDateNice(
        appointment.date
      )} as CANCELED?`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE}/api/service-appointments/${id}/cancel`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const body = await response
        .json()
        .catch(() => ({}));

      if (!response.ok) {
        throw new Error(
          body?.message ||
            `Cancel failed (${response.status})`
        );
      }

      const updated = extractUpdated(body);

      setAppointments((prev) =>
        prev.map((a) =>
          a.id === id
            ? {
                ...a,

                status:
                  String(
                    updated.status ||
                      "Canceled"
                  ).trim(),

                raw:
                  updated &&
                  Object.keys(updated).length
                    ? updated
                    : a.raw,
              }
            : a
        )
      );

      pushToast(
        "Appointment Canceled",
        "Service appointment has been canceled."
      );
    } catch (err) {
      console.error(
        "cancelRemote:",
        err
      );

      pushToast(
        "Cancel Failed",
        err.message ||
          "Unable to cancel appointment.",
        "error"
      );

      await fetchAppointments();
    }
  }

  const filtered = useMemo(() => {
    const q =
      debouncedSearch.toLowerCase();

    return appointments
      .filter((a) =>
        q
          ? String(a.patientName || "")
              .toLowerCase()
              .includes(q) ||
            String(a.mobile || "")
              .toLowerCase()
              .includes(q) ||
            String(a.serviceName || "")
              .toLowerCase()
              .includes(q)
          : true
      )
      .filter((a) =>
        statusFilter
          ? String(a.status || "").trim() ===
            statusFilter
          : true
      );
  }, [
    appointments,
    debouncedSearch,
    statusFilter,
  ]);

  function getTimestamp(a) {
    try {
      const [
        y,
        m,
        d,
      ] = (a.date || "1970-01-01")
        .split("-")
        .map(Number);

      let hour =
        Number(a.hour) || 0;

      if (
        (a.ampm || "AM") === "PM" &&
        hour !== 12
      ) {
        hour += 12;
      }

      if (
        (a.ampm || "AM") === "AM" &&
        hour === 12
      ) {
        hour = 0;
      }

      const minute =
        Number(a.minute) || 0;

      return new Date(
        y,
        (m || 1) - 1,
        d || 1,
        hour,
        minute
      ).getTime();
    } catch {
      return 0;
    }
  }

  const displayList = useMemo(() => {
    const copy = filtered.slice();

    copy.sort(
      (x, y) =>
        getTimestamp(y) -
        getTimestamp(x)
    );

    return copy;
  }, [filtered]);

  return (
    <div
      className={
        serviceAppointmentsStyles.container
      }
    >
      <header
        className={
          serviceAppointmentsStyles.headerContainer
        }
      >
        <div
          className={
            serviceAppointmentsStyles.headerTitleContainer
          }
        >
          <h1
            className={
              serviceAppointmentsStyles.headerTitle
            }
          >
            Appointments
          </h1>

          <p
            className={
              serviceAppointmentsStyles.headerSubtitle
            }
          >
            Manage patient booking - quick
            search & status controls
          </p>
        </div>

        <div
          className={
            serviceAppointmentsStyles.searchContainer
          }
        >
          <div
            className={
              serviceAppointmentsStyles.searchInputWrapper
            }
          >
            <label
              className={
                serviceAppointmentsStyles.searchLabel
              }
            >
              <span className="sr-only">
                Search Appointment
              </span>

              <div className="flex items-center gap-2 relative w-full">
                <div
                  className={
                    serviceAppointmentsStyles.searchIconContainer
                  }
                >
                  <SearchIcon
                    className={
                      serviceAppointmentsStyles.searchIcon
                    }
                  />
                </div>

                <input
                  value={search}
                  onChange={(e) =>
                    setSearch(e.target.value)
                  }
                  placeholder="Search by patient or service..."
                  className={
                    serviceAppointmentsStyles.searchInput
                  }
                />

                {search ? (
                  <button
                    type="button"
                    className={
                      serviceAppointmentsStyles.clearSearchButton
                    }
                    onClick={() =>
                      setSearch("")
                    }
                  >
                    <XIcon
                      className={
                        serviceAppointmentsStyles.clearSearchIcon
                      }
                    />
                  </button>
                ) : null}
              </div>
            </label>

            <select
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(
                  e.target.value
                )
              }
              className={
                serviceAppointmentsStyles.statusFilterSelect
              }
              title="Filter by status"
            >
              <option value="">
                All
              </option>

              <option value="Pending">
                Pending
              </option>

              <option value="Confirmed">
                Confirmed
              </option>

              <option value="Rescheduled">
                Rescheduled
              </option>

              <option value="Completed">
                Completed
              </option>

              <option value="Canceled">
                Canceled
              </option>
            </select>
          </div>

          <div
            className={
              serviceAppointmentsStyles.searchInfo ||
              serviceAppointmentsStyles.searchIcon
            }
          >
            <div>
              {displayList.length} result
              {displayList.length !== 1
                ? "s"
                : ""}
            </div>

            <div>
              <button
                type="button"
                onClick={
                  fetchAppointments
                }
                className={
                  serviceAppointmentsStyles.refreshButton
                }
              >
                Refresh
              </button>
            </div>
          </div>
        </div>
      </header>

      {loading ? (
        <div
          className={
            serviceAppointmentsStyles.loadingContainer
          }
        >
          <Loader2 className="animate-spin" />

          <span>
            Loading appointments...
          </span>
        </div>
      ) : error ? (
        <div
          className={
            serviceAppointmentsStyles.errorContainer
          }
        >
          {error}
        </div>
      ) : (
        <div
          className={
            serviceAppointmentsStyles.gridContainer
          }
        >
          {displayList.length === 0 ? (
            <div
              className={
                serviceAppointmentsStyles.noResultsContainer
              }
            >
              <div
                className={
                  serviceAppointmentsStyles.noResultsIcon
                }
              >
                <SearchIcon />
              </div>

              <div
                className={
                  serviceAppointmentsStyles.noResultsSubtext
                }
              >
                No appointments match
                your search
              </div>

              <div
                className={
                  serviceAppointmentsStyles.noResultsSubtext
                }
              >
                Try a different patient
                name or service
              </div>
            </div>
          ) : (
            displayList.map((a) => {
              const isLocked =
                a.status === "Completed" ||
                a.status === "Canceled";

              return (
                <article
                  key={a.id}
                  className={
                    serviceAppointmentsStyles.article
                  }
                >
                  <div
                    className={
                      serviceAppointmentsStyles.cardInner
                    }
                  >
                    <div>
                      <div
                        className={
                          serviceAppointmentsStyles.cardHeader
                        }
                      >
                        <div
                          className={
                            serviceAppointmentsStyles.patientInfoContainer
                          }
                        >
                          <div
                            className={
                              serviceAppointmentsStyles.patientAvatar
                            }
                          >
                            <UserRound
                              className={
                                serviceAppointmentsStyles.patientAvatarIcon
                              }
                            />
                          </div>

                          <div
                            className={
                              serviceAppointmentsStyles.patientInfo
                            }
                          >
                            <h3
                              className={
                                serviceAppointmentsStyles.patientName
                              }
                            >
                              {a.patientName}
                            </h3>

                            <p
                              className={
                                serviceAppointmentsStyles.patientDetails
                              }
                            >
                              {a.age
                                ? `${a.age} years`
                                : ""}

                              {a.age &&
                              a.gender
                                ? " • "
                                : ""}

                              {a.gender || ""}
                            </p>
                          </div>
                        </div>

                        <div
                          className={
                            serviceAppointmentsStyles.statusContainer
                          }
                        >
                          <StatusBadge
                            status={a.status}
                          />
                        </div>
                      </div>

                      <div
                        className={
                          serviceAppointmentsStyles.detailsContainer
                        }
                      >
                        <div
                          className={
                            serviceAppointmentsStyles.detailItem
                          }
                        >
                          <Phone
                            className={
                              serviceAppointmentsStyles.detailIcon
                            }
                          />

                          <span
                            className={
                              serviceAppointmentsStyles.detailText
                            }
                          >
                            {a.mobile ||
                              "No phone"}
                          </span>
                        </div>

                        <div
                          className={
                            serviceAppointmentsStyles.detailItem
                          }
                        >
                          <CalendarDays
                            className={
                              serviceAppointmentsStyles.detailIcon
                            }
                          />

                          <span
                            className={
                              serviceAppointmentsStyles.detailText
                            }
                          >
                            {formatDateNice(
                              a.date
                            ) ||
                              "Date not available"}
                          </span>
                        </div>

                        <div
                          className={
                            serviceAppointmentsStyles.detailItem
                          }
                        >
                          <Clock3
                            className={
                              serviceAppointmentsStyles.detailIcon
                            }
                          />

                          <span
                            className={
                              serviceAppointmentsStyles.detailText
                            }
                          >
                            {formatTimeDisplay(
                              a
                            )}
                          </span>
                        </div>

                        <div
                          className={
                            serviceAppointmentsStyles.detailItem
                          }
                        >
                          <IndianRupee
                            className={
                              serviceAppointmentsStyles.detailIcon
                            }
                          />

                          <span
                            className={`${serviceAppointmentsStyles.detailText} ${serviceAppointmentsStyles.feesText}`}
                          >
                            ₹{a.fees}
                          </span>
                        </div>
                      </div>

                      <div
                        className={
                          serviceAppointmentsStyles.serviceText
                        }
                      >
                        Service:{" "}
                        <span
                          className={
                            serviceAppointmentsStyles.serviceName
                          }
                        >
                          {a.serviceName ||
                            "General Service"}
                        </span>
                      </div>
                    </div>

                    <div
                      className={
                        serviceAppointmentsStyles.actionsContainer
                      }
                    >
                      <div
                        className={
                          serviceAppointmentsStyles.actionsInnerContainer
                        }
                      >
                        <RescheduleButton
                          appointment={a}
                          onReschedule={(
                            date,
                            time
                          ) =>
                            rescheduleRemote(
                              a.id,
                              date,
                              time
                            )
                          }
                          disabled={
                            isLocked
                          }
                        />

                        <StatusSelect
                          appointment={a}
                          onChange={(
                            newStatus
                          ) =>
                            changeStatusRemote(
                              a.id,
                              newStatus
                            )
                          }
                          disabled={
                            isLocked
                          }
                        />

                        <button
                          type="button"
                          onClick={() =>
                            cancelRemote(
                              a.id
                            )
                          }
                          disabled={
                            isLocked
                          }
                          className={
                            serviceAppointmentsStyles.cancelButton(
                              isLocked
                            )
                          }
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              );
            })
          )}
        </div>
      )}

      <Toast
        toasts={toasts}
        removeToast={removeToast}
      />

      <div
        className={
          serviceAppointmentsStyles.legendContainer
        }
      >
        <div
          className={
            serviceAppointmentsStyles.legendItem
          }
        >
          <div
            className={`${serviceAppointmentsStyles.legendDot} bg-amber-400`}
          />

          <span>Pending</span>
        </div>

        <div
          className={
            serviceAppointmentsStyles.legendItem
          }
        >
          <div
            className={`${serviceAppointmentsStyles.legendDot} bg-emerald-400`}
          />

          <span>Confirmed</span>
        </div>

        <div
          className={
            serviceAppointmentsStyles.legendItem
          }
        >
          <div
            className={`${serviceAppointmentsStyles.legendDot} bg-sky-400`}
          />

          <span>Completed</span>
        </div>

        <div
          className={
            serviceAppointmentsStyles.legendItem
          }
        >
          <div
            className={`${serviceAppointmentsStyles.legendDot} bg-red-400`}
          />

          <span>Canceled</span>
        </div>

        <div
          className={
            serviceAppointmentsStyles.legendItem
          }
        >
          <div
            className={`${serviceAppointmentsStyles.legendDot} bg-indigo-400`}
          />

          <span>Rescheduled</span>
        </div>
      </div>

      <style>
        {
          serviceAppointmentsStyles.animatedBorderStyle
        }
      </style>
    </div>
  );
};

export default ServiceAppointmentsPage;
