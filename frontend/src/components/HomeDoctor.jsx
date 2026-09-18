
import React, { useEffect, useState } from "react";
import { homeDoctorsStyles, iconSize } from "../assets/dummyStyles";
import { Link } from "react-router-dom";
import { ChevronRight, Medal, MousePointer2Off } from "lucide-react";

const HomeDoctor = ({ previewCount = 8 }) => {
  const API_BASE = "http://localhost:4000";

  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await fetch(`${API_BASE}/api/doctors`);
        const json = await res.json().catch(() => null);

        if (!res.ok) {
          const msg =
            (json && json.message) || `Failed to load doctors (${res.status})`;

          if (!mounted) return;

          setError(msg);
          setDoctors([]);
          setLoading(false);
          return;
        }

        const items = (json && (json.data || json)) || [];

        const normalized = (Array.isArray(items) ? items : []).map((d) => {
          const id = d._id || d.id;

          const image =
            d.imageUrl || d.image || d.imageSmall || d.imageSrc || "";

          const available =
            typeof d.availability === "string"
              ? d.availability.toLowerCase() === "available"
              : typeof d.available === "boolean"
                ? d.available
                : d.availability === true;

          return {
            id,
            name: d.name || "Unknown",
            specialization: d.specialization || "",
            image,

            experience:
              d.experience || d.experience === 0 ? String(d.experience) : "",

            fee: d.fee ?? d.price ?? 0,

            // IMPORTANT
            available,

            raw: d,
          };
        });

        if (!mounted) return;

        setDoctors(normalized);
      } catch (err) {
        if (!mounted) return;

        console.error("load doctors error:", err);

        setError("Network error while loading doctors.");
        setDoctors([]);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, []);

  const preview = doctors.slice(0, previewCount);

  return (
    <section className={homeDoctorsStyles.section}>
      <div className={homeDoctorsStyles.container}>
        {/* HEADER */}
        <div className={homeDoctorsStyles.header}>
          <h1 className={homeDoctorsStyles.title}>
            Our{" "}
            <span className={homeDoctorsStyles.titleSpan}>Medicare Team</span>
          </h1>

          <p className={homeDoctorsStyles.subtitle}>
            Book appointments quickly with our verified specialists
          </p>
        </div>

        {/* ERROR */}
        {error ? (
          <div className={homeDoctorsStyles.errorContainer}>
            <div className={homeDoctorsStyles.errorText}>{error}</div>

            <button
              onClick={() => {
                window.location.reload();
              }}
              className={homeDoctorsStyles.retryButton}
            >
              Retry
            </button>
          </div>
        ) : null}

        {/* LOADING */}
        {loading ? (
          <div className={homeDoctorsStyles.skeletonGrid}>
            {Array.from({ length: previewCount }).map((_, i) => (
              <div key={i} className={homeDoctorsStyles.skeletonCard}>
                <div className={homeDoctorsStyles.skeletonImage}></div>

                <div className={homeDoctorsStyles.skeletonText1}></div>

                <div className={homeDoctorsStyles.skeletonText2}></div>

                <div className="flex gap-2 mt-auto">
                  <div className={homeDoctorsStyles.skeletonButton}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* DOCTORS */
          <div className={homeDoctorsStyles.doctorsGrid}>
            {preview.map((doctor) => (
              <article
                key={doctor.id || doctor.name}
                className={homeDoctorsStyles.article}
              >
                {/* AVAILABLE DOCTOR */}
                {doctor.available ? (
                  <Link
                    to={`/doctors/${doctor.id}`}
                    state={{
                      doctor: doctor.raw || doctor,
                    }}
                  >
                    <div className={homeDoctorsStyles.imageContainerAvailable}>
                      <img
                        src={doctor.image || "/placeholder-doctor.jpg"}
                        alt={doctor.name}
                        loading="lazy"
                        className={homeDoctorsStyles.image}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/placeholder-doctor.jpg";
                        }}
                      />
                    </div>
                  </Link>
                ) : (
                  /* NOT AVAILABLE DOCTOR */
                  <div className={homeDoctorsStyles.imageContainerUnavailable}>
                    <img
                      src={doctor.image || "/placeholder-doctor.jpg"}
                      alt={doctor.name}
                      loading="lazy"
                      className={homeDoctorsStyles.image}
                      onError={(e) => {
                        e.currentTarget.onerror = null;
                        e.currentTarget.src = "/placeholder-doctor.jpg";
                      }}
                    />

                    <div className={homeDoctorsStyles.unavailableBadge}>
                      Not Available
                    </div>
                  </div>
                )}
                <div className={homeDoctorsStyles.cardBody}>
                  <h5
                    className={homeDoctorsStyles.doctorName}
                    id={`doctor-${doctor.id}-name`}
                  >
                    {doctor.name}
                  </h5>
                  <p className={homeDoctorsStyles.specialization}>
                    {doctor.specialization}
                  </p>
                  <div className={homeDoctorsStyles.experienceContainer}>
                    <div className={homeDoctorsStyles.experienceBadge}>
                      <Medal className={`${iconSize.small} h-4`} />
                      <span>{doctor.experience}Years Experience</span>
                    </div>
                  </div>
                  <div className={homeDoctorsStyles.buttonContainer}>
                    <div className="w-full">
                      {doctor.available ? (
                        <Link
                          to={`/doctors/${doctor.id}`}
                          state={{
                            doctor: doctor.raw || doctor,
                          }}
                          className={homeDoctorsStyles.buttonAvailable}
                        >
                          <ChevronRight className="w-5 h-5" />
                          Book
                        </Link>
                      ) : (
                        <button
                          disabled
                          className={homeDoctorsStyles.buttonUnavailable}
                        >
                          <MousePointer2Off className="w-5 h-5" />
                          Not Available
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
      <style>{homeDoctorsStyles.customCSS}</style>
    </section>
  );
};

export default HomeDoctor;
