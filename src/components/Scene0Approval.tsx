import { useState } from "react";
import {
  CheckCircle,
  RefreshCw,
  Download,
  Clock,
  ChevronDown,
  ChevronUp,
  Loader2,
  User,
} from "lucide-react";
import { Scene0Data, ApprovalResponse, RegenerateResponse } from "../types";

interface Scene0ApprovalProps {
  scene0Data: Scene0Data;
  onApprovalSuccess: () => void;
  onRegenerateSuccess: (newData: Scene0Data) => void;
}

export const Scene0Approval = ({
  scene0Data,
  onApprovalSuccess,
  onRegenerateSuccess,
}: Scene0ApprovalProps) => {
  const [approvalLoading, setApprovalLoading] = useState(false);
  const [regenerateLoading, setRegenerateLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [approvalStatus, setApprovalStatus] = useState<
    "pending" | "approved" | "regenerated"
  >("pending");

  const handleApprove = async () => {
    setApprovalLoading(true);

    try {
      const response = await fetch(scene0Data.scene0.resumeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved: true,
        }),
      });

      const result: ApprovalResponse = await response.json();

      if (result.success) {
        setApprovalStatus("approved");
        alert(
          result.message || "✅ Scene 0 approved! Generating story scenes..."
        );
        onApprovalSuccess();
      } else {
        alert("❌ Approval failed. Please try again.");
      }
    } catch (error) {
      console.error("Approval failed:", error);
      alert("❌ Approval failed. Please try again.");
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleRegenerate = async () => {
    setRegenerateLoading(true);

    try {
      const response = await fetch(scene0Data.scene0.resumeUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          approved: false,
        }),
      });

      const result: RegenerateResponse = await response.json();

      if (result.success && result.regenerated) {
        setImageLoaded(false);

        const updatedData: Scene0Data = {
          ...scene0Data,
          scene0: {
            imageUrl: result.data.scene0.imageUrl,
            resumeUrl: result.data.scene0.resumeUrl,
            sceneNumber: scene0Data.scene0.sceneNumber,
            processingTime: result.data.scene0.processingTime,
            seed: result.data.scene0.seed,
          },
        };

        onRegenerateSuccess(updatedData);
        setApprovalStatus("regenerated");
        alert(
          `✅ Scene 0 regenerated! (Attempt ${result.data.regenerationCount || 1})`
        );
      } else {
        alert("❌ Regeneration failed. Please try again.");
      }
    } catch (error) {
      console.error("Regeneration failed:", error);
      alert("❌ Regeneration failed. Please try again.");
    } finally {
      setRegenerateLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(scene0Data.scene0ImageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `scene0-${scene0Data.requestId}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Download failed:", error);
      alert("❌ Download failed. Please try again.");
    }
  };

  // Progress percentage is now in scene0Data.progress.percentage

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {scene0Data.productName}
          </h1>
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-4 py-2 rounded-full text-sm font-medium ${
                approvalStatus === "approved"
                  ? "bg-green-100 text-green-800"
                  : approvalStatus === "regenerated"
                  ? "bg-yellow-100 text-yellow-800"
                  : "bg-blue-100 text-blue-800"
              }`}
            >
              {approvalStatus === "approved"
                ? "Scene 0 Approved"
                : approvalStatus === "regenerated"
                ? "Scene 0 Regenerated - Awaiting Approval"
                : "Scene 0 Generated - Awaiting Approval"}
            </span>
          </div>
        </div>

        {/* Image Display Section */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 mb-6">
          <div className="relative max-w-full mx-auto" style={{ maxWidth: "600px" }}>
            <img
              key={scene0Data.scene0.imageUrl}
              src={scene0Data.scene0.imageUrl}
              alt="Scene 0 Preview"
              onLoad={() => setImageLoaded(true)}
              className={`w-full rounded-lg shadow-md transition-opacity duration-500 ${
                imageLoaded ? "opacity-100" : "opacity-0"
              }`}
            />
            {!imageLoaded && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            )}
            <div className="absolute top-3 right-3 bg-gray-900 bg-opacity-80 text-white px-3 py-1 rounded-lg flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              {scene0Data.scene0.processingTime}
            </div>
            {scene0Data.scene0.seed && (
              <div className="absolute bottom-3 left-3 bg-gray-900 bg-opacity-80 text-white px-3 py-1 rounded-lg text-xs">
                Seed: {scene0Data.scene0.seed}
              </div>
            )}
          </div>

          {/* Download Button */}
          <div className="mt-4 flex justify-center">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
            >
              <Download className="h-4 w-4" />
              Download Image
            </button>
          </div>
        </div>

        {/* Character Information Card */}
        <div className="bg-blue-50 rounded-xl border border-blue-200 p-6 mb-6">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <User className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Character Profile
              </h3>
              <div className="space-y-1 mb-3">
                <p className="text-gray-700">
                  <span className="font-medium">Gender:</span>{" "}
                  {scene0Data.character.gender}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Age:</span>{" "}
                  {scene0Data.character.age}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Ethnicity:</span>{" "}
                  {scene0Data.character.ethnicity}
                </p>
                <p className="text-gray-700">
                  <span className="font-medium">Description:</span>{" "}
                  {scene0Data.character.description}
                </p>
              </div>
              <p className="text-sm text-blue-700 font-medium">
                This character will appear in all {scene0Data.progress.total}{" "}
                scenes
              </p>
            </div>
          </div>
        </div>

        {/* View Details Section */}
        {scene0Data.scene0Details && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-6 overflow-hidden">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
            >
              <span className="font-semibold text-gray-900">View Details</span>
              {showDetails ? (
                <ChevronUp className="h-5 w-5 text-gray-500" />
              ) : (
                <ChevronDown className="h-5 w-5 text-gray-500" />
              )}
            </button>

            {showDetails && (
              <div className="px-4 pb-4 border-t border-gray-200 pt-4 space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Scene Duration:</span>
                  <span className="font-medium text-gray-900">
                    {scene0Data.scene0Details.duration} seconds
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Camera Movement:</span>
                  <span className="font-medium text-gray-900">
                    {scene0Data.scene0Details.cameraMovement}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Lighting:</span>
                  <span className="font-medium text-gray-900">
                    {scene0Data.scene0Details.lighting}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Mood:</span>
                  <span className="font-medium text-gray-900">
                    {scene0Data.scene0Details.mood}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Approval Question Section */}
        <div className="bg-yellow-50 border-l-4 border-yellow-400 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-2">
            {scene0Data.approval.question}
          </h2>
          <p className="text-gray-700">
            Review the character and scene carefully before proceeding. You can
            regenerate if needed.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <button
            onClick={handleApprove}
            disabled={
              approvalLoading || regenerateLoading || approvalStatus === "approved"
            }
            className="flex items-center justify-center gap-2 px-6 py-4 bg-green-600 text-white rounded-xl hover:bg-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
          >
            {approvalLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Approving...
              </>
            ) : (
              <>
                <CheckCircle className="h-5 w-5" />
                {scene0Data.approval.options[0] || "Approve & Continue"}
              </>
            )}
          </button>

          <button
            onClick={handleRegenerate}
            disabled={
              approvalLoading || regenerateLoading || approvalStatus === "approved"
            }
            className="flex items-center justify-center gap-2 px-6 py-4 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-lg shadow-lg"
          >
            {regenerateLoading ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="h-5 w-5" />
                {scene0Data.approval.options[1] || "Regenerate Scene 0"}
              </>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="mb-2">
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-green-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${scene0Data.progress.percentage}%` }}
              />
            </div>
          </div>
          <p className="text-center text-sm font-medium text-gray-700">
            {scene0Data.progress.completed}/{scene0Data.progress.total} scenes
            complete
          </p>
        </div>
      </div>
    </div>
  );
};
