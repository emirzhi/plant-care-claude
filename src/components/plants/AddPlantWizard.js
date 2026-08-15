"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { FiCamera, FiAlertCircle } from "react-icons/fi";
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

export default function AddPlantWizard() {
  const router = useRouter();

  const [step, setStep] = useState(STEPS.PHOTO);
  const [error, setError] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);

  const [identifyResult, setIdentifyResult] = useState(null); // { photoPath, primary, alternatives, visible_health_issues, note }
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [careProfile, setCareProfile] = useState(null); // species_care_profiles row
  const [tasks, setTasks] = useState([]);
  const [nickname, setNickname] = useState("");

  function handlePhotoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
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
      setError("Please give your plant a nickname.");
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

  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-xl font-semibold">Add a plant</h1>

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          <FiAlertCircle className="mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {(step === STEPS.PHOTO || step === STEPS.IDENTIFYING) && (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-neutral-500">
            Take a photo or choose one from your library — Claude will identify the
            species.
          </p>

          <label
            htmlFor="photo-input"
            className="flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50"
          >
            {photoPreview ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoPreview}
                alt="Selected plant"
                className="h-full w-full object-cover"
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-neutral-400">
                <FiCamera size={32} />
                <span className="text-sm">Tap to choose a photo</span>
              </div>
            )}
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
            disabled={!photoFile || step === STEPS.IDENTIFYING}
            className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {step === STEPS.IDENTIFYING ? "Identifying..." : "Identify plant"}
          </button>
        </div>
      )}

      {step === STEPS.CANDIDATES && identifyResult && (
        <div className="mt-6 space-y-3">
          {identifyResult.primary.confidence === 0 ? (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
              <p className="font-medium">Couldn&rsquo;t identify a plant in that photo.</p>
              {identifyResult.note && <p className="mt-1">{identifyResult.note}</p>}
              <button
                type="button"
                onClick={() => {
                  setStep(STEPS.PHOTO);
                  setIdentifyResult(null);
                }}
                className="mt-3 rounded-md border border-amber-300 px-3 py-1.5 text-sm font-medium"
              >
                Try another photo
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-neutral-500">
                Select the species that matches your plant:
              </p>
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
                <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-medium">Spotted in your photo:</p>
                  <ul className="mt-1 list-inside list-disc">
                    {identifyResult.visible_health_issues.map((issue, i) => (
                      <li key={i}>{issue}</li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {step === STEPS.LOADING_CARE && (
        <div className="mt-10 text-center text-sm text-neutral-500">
          Generating a care profile for {selectedCandidate?.common_name}...
        </div>
      )}

      {step === STEPS.REVIEW && careProfile && (
        <div className="mt-6 space-y-5">
          <div>
            <label htmlFor="nickname" className="mb-1 block text-sm font-medium">
              Nickname
            </label>
            <input
              id="nickname"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="e.g. Steve"
              className="w-full rounded-md border border-neutral-300 px-3 py-2 text-sm outline-none focus:border-neutral-500"
            />
          </div>

          <CareProfileSummary careProfile={careProfile.care_profile} />

          <div>
            <p className="mb-2 text-sm font-medium">Care tasks</p>
            <div className="space-y-2">
              {tasks.map((task, i) => (
                <TaskIntervalRow
                  key={task.task_type}
                  task={task}
                  onChange={(updated) => updateTask(i, updated)}
                />
              ))}
              {tasks.length === 0 && (
                <p className="text-sm text-neutral-500">
                  No suggested tasks for this species — you can add custom ones after
                  saving.
                </p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={handleSave}
            disabled={step === STEPS.SAVING}
            className="w-full rounded-md bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:opacity-50"
          >
            {step === STEPS.SAVING ? "Saving..." : "Save plant"}
          </button>
        </div>
      )}
    </div>
  );
}
