"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { FiCamera, FiAlertCircle, FiArrowLeft, FiRefreshCw } from "react-icons/fi";
import { PiPlantFill } from "react-icons/pi";
import CandidateCard from "@/components/plants/CandidateCard";
import CareProfileSummary from "@/components/plants/CareProfileSummary";
import TaskIntervalRow from "@/components/plants/TaskIntervalRow";
import { deriveTasksFromCareProfile } from "@/lib/plants/careTasks";

const STEPS = {
  PHOTO: "photo",
  IDENTIFYING: "identifying",
  CANDIDATES: "candidates",
  LOADING_CARE: "loading-care",
  REVIEW: "review",
  SAVING: "saving",
};

const STEP_INDEX = {
  [STEPS.PHOTO]: 0,
  [STEPS.IDENTIFYING]: 0,
  [STEPS.CANDIDATES]: 1,
  [STEPS.LOADING_CARE]: 1,
  [STEPS.REVIEW]: 2,
  [STEPS.SAVING]: 2,
};

function StepDots({ current }) {
  return (
    <div className="flex items-center gap-1.5">
      {["Photo", "Species", "Schedule"].map((label, i) => (
        <div key={label} className="flex items-center gap-1.5">
          <span
            className={`h-1.5 rounded-full transition-all ${
              i === current
                ? "w-6 bg-brand"
                : i < current
                  ? "w-1.5 bg-brand"
                  : "w-1.5 bg-line-strong"
            }`}
          />
        </div>
      ))}
    </div>
  );
}

export default function AddPlantWizard() {
  const router = useRouter();

  const [step, setStep] = useState(STEPS.PHOTO);
  const [error, setError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [identifyResult, setIdentifyResult] = useState(null);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [careProfile, setCareProfile] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [nickname, setNickname] = useState("");

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setError(null);
  }

  function resetToPhoto() {
    setStep(STEPS.PHOTO);
    setIdentifyResult(null);
    setSelectedCandidate(null);
    setError(null);
  }

  async function handleIdentify() {
    if (!photoFile) return;
    setStep(STEPS.IDENTIFYING);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      const res = await fetch("/api/identify", { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Identification failed.");

      setIdentifyResult(data);
      setStep(STEPS.CANDIDATES);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.PHOTO);
    }
  }

  async function handleSelectCandidate(candidate) {
    setSelectedCandidate(candidate);
    setStep(STEPS.LOADING_CARE);
    setError(null);

    try {
      const res = await fetch("/api/care-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          scientificName: candidate.scientific_name,
          commonName: candidate.common_name,
          plantType: candidate.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't generate a care profile.");

      setCareProfile(data.speciesCareProfile);
      setTasks(deriveTasksFromCareProfile(data.speciesCareProfile.care_profile));
      setNickname(candidate.common_name || "");
      setStep(STEPS.REVIEW);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.CANDIDATES);
    }
  }

  function updateTask(index, updated) {
    setTasks((prev) => prev.map((t, i) => (i === index ? updated : t)));
  }

  async function handleSave() {
    if (!nickname.trim()) {
      setError("Please give your plant a name.");
      return;
    }
    setStep(STEPS.SAVING);
    setError(null);

    try {
      const res = await fetch("/api/plants", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nickname: nickname.trim(),
          photoPath: identifyResult.photoPath,
          speciesCareProfileId: careProfile.id,
          candidate: selectedCandidate,
          tasks,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't save the plant.");

      router.push(`/plants/${data.plantId}`);
    } catch (err) {
      setError(err.message);
      setStep(STEPS.REVIEW);
    }
  }

  const busy = step === STEPS.IDENTIFYING || step === STEPS.LOADING_CARE;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <Link
          href="/plants"
          className="inline-flex items-center gap-1.5 text-sm text-ink-muted transition hover:text-ink"
        >
          <FiArrowLeft size={15} />
          Cancel
        </Link>
        <StepDots current={STEP_INDEX[step]} />
      </div>

      <h1 className="text-2xl font-semibold tracking-tight text-ink">
        {step === STEPS.REVIEW || step === STEPS.SAVING
          ? "Review the plan"
          : step === STEPS.CANDIDATES || step === STEPS.LOADING_CARE
            ? "Which one is it?"
            : "Add a plant"}
      </h1>

      {error && (
        <div className="flex items-start gap-2 rounded-xl bg-danger-soft px-3.5 py-2.5 text-sm text-danger-soft-ink">
          <FiAlertCircle className="mt-0.5 shrink-0" size={16} />
          <span>{error}</span>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {(step === STEPS.PHOTO || step === STEPS.IDENTIFYING) && (
        <div className="space-y-4">
          <p className="text-sm text-ink-muted">
            Take a photo or pick one from your library — we&rsquo;ll identify the
            species and build a care schedule.
          </p>

          <label
            htmlFor="photo-input"
            className="block cursor-pointer overflow-hidden rounded-2xl border border-dashed border-line-strong bg-surface transition hover:border-brand"
          >
            <div className="flex aspect-[4/3] items-center justify-center">
              {photoPreview ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Selected plant"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex flex-col items-center gap-3 text-ink-faint">
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-surface-muted">
                    <FiCamera size={24} />
                  </span>
                  <span className="text-sm font-medium">Tap to choose a photo</span>
                </div>
              )}
            </div>
          </label>
          <input
            id="photo-input"
            type="file"
            accept="image/*"
            onChange={handlePhotoChange}
            className="sr-only"
          />

          <button
            type="button"
            onClick={handleIdentify}
            disabled={!photoFile || busy}
            className="btn-primary w-full"
          >
            {busy ? (
              <>
                <FiRefreshCw size={16} className="animate-spin" />
                Identifying...
              </>
            ) : (
              <>
                <PiPlantFill size={16} />
                Identify plant
              </>
            )}
          </button>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {step === STEPS.CANDIDATES && identifyResult && (
        <div className="space-y-3">
          {identifyResult.primary.confidence === 0 ? (
            <div className="card p-5 text-center">
              <p className="font-medium text-ink">
                Couldn&rsquo;t identify a plant in that photo
              </p>
              {identifyResult.note && (
                <p className="mt-1.5 text-sm text-ink-muted">{identifyResult.note}</p>
              )}
              <button
                type="button"
                onClick={resetToPhoto}
                className="btn-secondary mt-4"
              >
                Try another photo
              </button>
            </div>
          ) : (
            <>
              {photoPreview && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={photoPreview}
                  alt="Your plant"
                  className="h-28 w-full rounded-2xl object-cover"
                />
              )}

              <CandidateCard
                candidate={identifyResult.primary}
                label="Best match"
                onSelect={() => handleSelectCandidate(identifyResult.primary)}
                disabled={step !== STEPS.CANDIDATES}
              />
              {identifyResult.alternatives.map((alt, i) => (
                <CandidateCard
                  key={i}
                  candidate={alt}
                  onSelect={() => handleSelectCandidate(alt)}
                  disabled={step !== STEPS.CANDIDATES}
                />
              ))}

              {identifyResult.visible_health_issues?.length > 0 && (
                <div className="rounded-xl bg-warn-soft px-3.5 py-3 text-sm text-warn-soft-ink">
                  <p className="font-medium">Spotted in your photo</p>
                  <ul className="mt-1 list-inside list-disc text-xs">
                    {identifyResult.visible_health_issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                type="button"
                onClick={resetToPhoto}
                className="btn-ghost w-full !text-[13px]"
              >
                None of these — try another photo
              </button>
            </>
          )}
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {step === STEPS.LOADING_CARE && (
        <div className="card flex flex-col items-center px-6 py-14 text-center">
          <FiRefreshCw size={22} className="animate-spin text-brand" />
          <p className="mt-4 font-medium text-ink">Building a care plan</p>
          <p className="mt-1 text-sm text-ink-muted">
            for {selectedCandidate?.common_name}
          </p>
        </div>
      )}

      {/* ---------------------------------------------------------------- */}
      {(step === STEPS.REVIEW || step === STEPS.SAVING) && careProfile && (
        <div className="space-y-5">
          <div className="card p-4">
            <label
              htmlFor="nickname"
              className="mb-1.5 block text-sm font-medium text-ink"
            >
              What do you call it?
            </label>
            <input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Steve"
              className="field"
            />
            <p className="mt-1.5 text-xs text-ink-faint">
              {selectedCandidate?.common_name}
              {selectedCandidate?.scientific_name &&
                ` · ${selectedCandidate.scientific_name}`}
            </p>
          </div>

          <CareProfileSummary careProfile={careProfile.care_profile} />

          <div className="space-y-2.5">
            <div className="flex items-baseline justify-between">
              <h2 className="text-base font-semibold tracking-tight text-ink">
                Care schedule
              </h2>
              <span className="text-xs text-ink-faint">adjust anytime</span>
            </div>

            {tasks.length === 0 ? (
              <p className="card px-4 py-6 text-center text-sm text-ink-muted">
                No suggested tasks — you can add your own after saving.
              </p>
            ) : (
              tasks.map((task, i) => (
                <TaskIntervalRow
                  key={task.task_type}
                  task={task}
                  onChange={(updated) => updateTask(i, updated)}
                />
              ))
            )}
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={step === STEPS.SAVING}
            className="btn-primary w-full"
          >
            {step === STEPS.SAVING ? "Saving..." : "Save plant"}
          </button>
        </div>
      )}
    </div>
  );
}
