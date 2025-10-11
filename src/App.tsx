import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Video,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Eye,
  Wand2,
  Trash2,
  Save,
  LogOut,
} from "lucide-react";
import { VideoFormData, ValidationErrors, Environment, Scene0Data } from "./types";
import { FileUpload } from "./components/FileUpload";
import { FormField, Input, Textarea, Select } from "./components/FormField";
import { Scene0Approval } from "./components/Scene0Approval";
import { Auth } from "./components/Auth";
import { useAuth } from "./contexts/AuthContext";
import {
  validateForm,
  calculateTotalFileSize,
  formatFileSize,
  calculateProgress,
} from "./utils/validation";
import {
  saveFormData,
  loadFormData,
  clearFormData,
  hasSavedData,
} from "./utils/storage";
import { getSampleFormData, generateCurlCommand } from "./utils/sampleData";
import { startPolling } from "./utils/airtablePolling";

const WEBHOOK_URLS = {
  demo: "https://n8n.srv1053240.hstgr.cloud/webhook-test/vidgen",
  production: "https://n8n.srv1053240.hstgr.cloud/webhook/vidgen",
};

const AD_TYPES = [
  "UGC - Talking Person with Product",
  "Product Showcase - 30s Use Cases",
  "VFX Style - Dynamic Product Only",
];

const TARGET_AUDIENCES = [
  "Gen Z (18-24)",
  "Millennials (25-40)",
  "Gen X (41-55)",
  "All Ages",
  "Business/Professional",
];

const PLATFORMS = [
  "TikTok/Reels (9:16)",
  "YouTube/Facebook (16:9)",
  "Instagram Square (1:1)",
  "Stories (9:16)",
];

const VIDEO_LENGTHS = [
  "16s Problem + Solution",
  "24s Problem + Discovery + Success",
  "32s (Problem + Discovery + Trial + Success",
  "40s (5 scenes total)",
  "48s (6 scenes total)",
  "56s (7 scenes total)",
  "64s (8 scenes total)",
];

const PRODUCTION_MODES = [
  "Single Video (Best for 8s)",
  "Story Mode - Connected Scenes (Best for 16-32s UGC Vids) ",
];

const UGC_STYLES = [
  "Holding Product - Natural pose",
  "Using Product - In action",
  "Unboxing - First impression",
  "Mirror Selfie - Authentic angle",
  "Before & After - Transformation",
  "Cozy at Home - Relaxed setting",
  "Friend Sharing - Social moment",
  "ASMR",
  "Podcast",
];

const VFX_STYLES = [
  "Energy Burst - Power explosion",
  "Liquid Splash - Water/paint effect",
  "Particle Glow - Sparkles and magic",
  "Color Powder - Holi explosion",
  "3D rotation with effects",
  "Fire & Flames - Dramatic heat",
  "Smoke & Fog - Mysterious atmosphere",
  "Neon Lights - Cyberpunk style",
  "Shattered Glass - Breaking effect",
];

const SHOWCASE_STYLES = [
  "Clean & Minimal - White background",
  "Premium Dark - Luxury aesthetic",
  "Lifestyle Shot - Natural setting",
  "Hero Angle - Dramatic view",
  "Detail Focus - Macro close-up",
  "Scale Reference - Size comparison",
];

function App() {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const [environment, setEnvironment] = useState<Environment>("demo");
  const [formData, setFormData] = useState<VideoFormData>({
    productImages: [],
    productName: "",
    productDescription: "",
    email: "",
    adType: "",
    targetAudience: "",
    platform: "",
    videoLength: "",
    productionMode: "",
    ugcStyleDetails: "",
    vfxStyleDetails: "",
    productShowcaseStyle: "",
    additionalNotes: "",
  });
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [response, setResponse] = useState<any>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [showCurl, setShowCurl] = useState(false);
  const [savedDataAvailable, setSavedDataAvailable] = useState(false);
  const [scene0Data, setScene0Data] = useState<Scene0Data | null>(null);
  const [currentView, setCurrentView] = useState<"form" | "approval" | "dashboard" | "success">("form");
  const [pollingProgress, setPollingProgress] = useState(0);
  const [pollingStep, setPollingStep] = useState("");

  useEffect(() => {
    setSavedDataAvailable(hasSavedData());
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      saveFormData(formData);
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData]);

  const updateFormData = (field: keyof VideoFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof ValidationErrors]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field as keyof ValidationErrors];
        return newErrors;
      });
    }
  };

  const loadSavedData = () => {
    const saved = loadFormData();
    if (saved) {
      setFormData((prev) => ({ ...prev, ...saved }));
    }
  };

  const fillSampleData = () => {
    const sample = getSampleFormData();
    setFormData((prev) => ({ ...prev, ...sample }));
  };

  const clearAll = () => {
    setFormData({
      productImages: [],
      productName: "",
      productDescription: "",
      adType: "",
      targetAudience: "",
      platform: "",
      videoLength: "",
      productionMode: "",
      ugcStyleDetails: "",
      vfxStyleDetails: "",
      productShowcaseStyle: "",
      additionalNotes: "",
    });
    clearFormData();
    setSavedDataAvailable(false);
    setErrors({});
    setResponse(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setResponse(null);

    try {
      const formDataToSend = new FormData();

      formData.productImages.forEach((file) => {
        formDataToSend.append("Product Images", file);
      });

      formDataToSend.append("Product Name", formData.productName);
      formDataToSend.append("Product Description", formData.productDescription);
      formDataToSend.append("Ad Type", formData.adType);
      formDataToSend.append("Target Audience", formData.targetAudience);
      formDataToSend.append("Platform", formData.platform);
      formDataToSend.append(
        "Video Length (includes problem scene + solution scenes)",
        formData.videoLength
      );
      formDataToSend.append("Production Mode", formData.productionMode);

      if (formData.ugcStyleDetails) {
        formDataToSend.append("UGC Style Details", formData.ugcStyleDetails);
      }

      if (formData.vfxStyleDetails) {
        formDataToSend.append(
          "VFX Style Details- *Choose if your ad type is VFX*",
          formData.vfxStyleDetails
        );
      }

      if (formData.productShowcaseStyle) {
        formDataToSend.append(
          "Product Showcase Style *Choose if your ad type is Product Showcase*",
          formData.productShowcaseStyle
        );
      }

      if (formData.additionalNotes) {
        formDataToSend.append("Additional Notes", formData.additionalNotes);
      }

      formDataToSend.append("Email", formData.email);

      const webhookURL = WEBHOOK_URLS[environment];
      const res = await fetch(webhookURL, {
        method: "POST",
        body: formDataToSend,
      });

      const data = await res.json();
      setResponse({ success: true, data, status: res.status });

      setCurrentView("success");
      setIsSubmitting(false);
    } catch (error: any) {
      setResponse({
        success: false,
        error: error.message,
        details: error.toString(),
      });
      setIsSubmitting(false);
    }
  };

  const totalFileSize = calculateTotalFileSize(formData.productImages);
  const progress = calculateProgress(formData);
  const fileSizeWarning = totalFileSize > 25 * 1024 * 1024;

  const handleApprovalSuccess = () => {
    alert("🎉 Scene 0 approved! Story scenes are now being generated.");
  };

  const handleRegenerateSuccess = (newData: Scene0Data) => {
    setScene0Data(newData);
  };

  if (currentView === "dashboard") {
    navigate('/dashboard');
    return null;
  }

  if (currentView === "approval" && scene0Data) {
    return (
      <Scene0Approval
        scene0Data={scene0Data}
        onApprovalSuccess={handleApprovalSuccess}
        onRegenerateSuccess={handleRegenerateSuccess}
      />
    );
  }

  if (currentView === "success") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="max-w-2xl w-full">
          <div className="bg-white rounded-2xl shadow-xl border border-green-200 p-8 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
              <CheckCircle2 className="w-12 h-12 text-green-600" />
            </div>

            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              Thank You for Using Our Service!
            </h1>

            <p className="text-lg text-gray-700 mb-6">
              Your video generation request has been submitted successfully.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-8">
              <p className="text-gray-800">
                We're now processing your video. Once your images are generated, we'll send you an email notification so you can review and download them.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={() => {
                  setCurrentView("dashboard");
                  setResponse(null);
                }}
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-lg font-medium"
              >
                <Video className="w-5 h-5" />
                View My Creations
              </button>

              <button
                onClick={() => {
                  setCurrentView("form");
                  setResponse(null);
                  clearAll();
                }}
                className="w-full px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-lg font-medium"
              >
                Create Another Video
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Video className="h-10 w-10 text-blue-600" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              AI Video Creator
            </h1>
          </div>
          <p className="text-gray-600 text-lg">Smart Ad Generator</p>
          <div className="mt-4 flex items-center justify-center gap-4">
            <span className="text-sm text-slate-600">{user.email}</span>
            <button
              onClick={() => setCurrentView(currentView === "dashboard" ? "form" : "dashboard")}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Video className="w-4 h-4" />
              {currentView === "dashboard" ? "New Video" : "My Creations"}
            </button>
            <button
              onClick={() => signOut()}
              className="inline-flex items-center gap-2 text-sm text-slate-600 hover:text-slate-900 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>

        {/* Environment Toggle */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Environment
              </label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="environment"
                    value="demo"
                    checked={environment === "demo"}
                    onChange={(e) =>
                      setEnvironment(e.target.value as Environment)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Demo
                  </span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="environment"
                    value="production"
                    checked={environment === "production"}
                    onChange={(e) =>
                      setEnvironment(e.target.value as Environment)
                    }
                    className="w-4 h-4 text-blue-600"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    Production
                  </span>
                </label>
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-500 mb-1">
                Webhook URL
              </p>
              <p className="text-sm text-gray-700 font-mono bg-gray-50 px-3 py-2 rounded border border-gray-200 truncate">
                {WEBHOOK_URLS[environment]}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        {progress > 0 && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                Form Progress
              </span>
              <span className="text-sm font-bold text-blue-600">
                {progress}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          {savedDataAvailable && (
            <button
              type="button"
              onClick={loadSavedData}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <Save className="h-4 w-4" />
              Load Saved Data
            </button>
          )}
          <button
            type="button"
            onClick={fillSampleData}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium"
          >
            <Wand2 className="h-4 w-4" />
            Fill Sample Data
          </button>
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Eye className="h-4 w-4" />
            {showPreview ? "Hide" : "Preview"} Payload
          </button>
          <button
            type="button"
            onClick={() => setShowCurl(!showCurl)}
            className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
          >
            <Copy className="h-4 w-4" />
            cURL Command
          </button>
          <button
            type="button"
            onClick={clearAll}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <Trash2 className="h-4 w-4" />
            Clear All
          </button>
        </div>

        {/* Preview Payload */}
        {showPreview && (
          <div className="bg-gray-900 text-gray-100 rounded-xl p-6 mb-6 font-mono text-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">Payload Preview</h3>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(JSON.stringify(formData, null, 2))
                }
                className="text-gray-400 hover:text-white"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(
                {
                  ...formData,
                  productImages: formData.productImages.map((f) => ({
                    name: f.name,
                    size: f.size,
                    type: f.type,
                  })),
                },
                null,
                2
              )}
            </pre>
          </div>
        )}

        {/* cURL Command */}
        {showCurl && (
          <div className="bg-gray-900 text-gray-100 rounded-xl p-6 mb-6 font-mono text-sm overflow-x-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white">cURL Command</h3>
              <button
                onClick={() =>
                  navigator.clipboard.writeText(
                    generateCurlCommand(WEBHOOK_URLS[environment], formData)
                  )
                }
                className="text-gray-400 hover:text-white"
              >
                <Copy className="h-4 w-4" />
              </button>
            </div>
            <pre className="whitespace-pre-wrap">
              {generateCurlCommand(WEBHOOK_URLS[environment], formData)}
            </pre>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Product Images */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <FormField
              label="Product Images"
              required
              error={errors.productImages}
              hint="Upload multiple product images (JPG, PNG, WEBP)"
            >
              <FileUpload
                files={formData.productImages}
                onChange={(files) => updateFormData("productImages", files)}
                error={errors.productImages}
              />
              {formData.productImages.length > 0 && (
                <div className="mt-2 flex items-center justify-between text-sm">
                  <span className="text-gray-600">
                    {formData.productImages.length} file(s) selected
                  </span>
                  <span
                    className={`font-medium ${
                      fileSizeWarning ? "text-red-600" : "text-gray-600"
                    }`}
                  >
                    Total: {formatFileSize(totalFileSize)}
                    {fileSizeWarning && " (Warning: > 25MB)"}
                  </span>
                </div>
              )}
            </FormField>
          </div>

          {/* Basic Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
              Basic Information
            </h2>

            <FormField
              label="Product Name"
              required
              error={errors.productName}
            >
              <Input
                value={formData.productName}
                onChange={(value) => updateFormData("productName", value)}
                placeholder="Enter your product name"
              />
            </FormField>

            <FormField
              label="Product Description"
              required
              error={errors.productDescription}
            >
              <Textarea
                value={formData.productDescription}
                onChange={(value) =>
                  updateFormData("productDescription", value)
                }
                placeholder="Describe your product in detail..."
                rows={5}
              />
            </FormField>

            <FormField
              label="Email Address"
              required
              error={errors.email}
              hint="We will send you an email when your images created"
            >
              <Input
                type="email"
                value={formData.email}
                onChange={(value) => updateFormData("email", value)}
                placeholder="your@email.com"
              />
            </FormField>
          </div>

          {/* Video Configuration */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-6">
            <h2 className="text-xl font-semibold text-gray-800 border-b pb-3">
              Video Configuration
            </h2>

            <FormField label="Ad Type" required error={errors.adType}>
              <Select
                value={formData.adType}
                onChange={(value) => {
                  updateFormData("adType", value);
                  updateFormData("ugcStyleDetails", "");
                  updateFormData("vfxStyleDetails", "");
                  updateFormData("productShowcaseStyle", "");
                }}
                options={AD_TYPES}
                placeholder="Choose your ad type"
              />
            </FormField>

            {/* Conditional Style Fields */}
            {formData.adType === "UGC - Talking Person with Product" && (
              <FormField
                label="UGC Style Details"
                required
                error={errors.ugcStyleDetails}
              >
                <Select
                  value={formData.ugcStyleDetails}
                  onChange={(value) => updateFormData("ugcStyleDetails", value)}
                  options={UGC_STYLES}
                  placeholder="Choose UGC style"
                />
              </FormField>
            )}

            {formData.adType === "VFX Style - Dynamic Product Only" && (
              <FormField
                label="VFX Style Details - Choose if your ad type is VFX"
                required
                error={errors.vfxStyleDetails}
              >
                <Select
                  value={formData.vfxStyleDetails}
                  onChange={(value) => updateFormData("vfxStyleDetails", value)}
                  options={VFX_STYLES}
                  placeholder="Choose VFX style"
                />
              </FormField>
            )}

            {formData.adType === "Product Showcase - 30s Use Cases" && (
              <FormField
                label="Product Showcase Style - Choose if your ad type is Product Showcase"
                required
                error={errors.productShowcaseStyle}
              >
                <Select
                  value={formData.productShowcaseStyle}
                  onChange={(value) =>
                    updateFormData("productShowcaseStyle", value)
                  }
                  options={SHOWCASE_STYLES}
                  placeholder="Choose showcase style"
                />
              </FormField>
            )}

            <FormField
              label="Target Audience"
              required
              error={errors.targetAudience}
            >
              <Select
                value={formData.targetAudience}
                onChange={(value) => updateFormData("targetAudience", value)}
                options={TARGET_AUDIENCES}
                placeholder="Select target audience"
              />
            </FormField>

            <FormField label="Platform" required error={errors.platform}>
              <Select
                value={formData.platform}
                onChange={(value) => updateFormData("platform", value)}
                options={PLATFORMS}
                placeholder="Choose platform format"
              />
            </FormField>

            <FormField
              label="Video Length (includes problem scene + solution scenes)"
              required
              error={errors.videoLength}
              hint="Longer videos = more scenes"
            >
              <Select
                value={formData.videoLength}
                onChange={(value) => updateFormData("videoLength", value)}
                options={VIDEO_LENGTHS}
                placeholder="Select video length"
              />
            </FormField>

            <FormField
              label="Production Mode"
              required
              error={errors.productionMode}
            >
              <Select
                value={formData.productionMode}
                onChange={(value) => updateFormData("productionMode", value)}
                options={PRODUCTION_MODES}
                placeholder="Choose production mode"
              />
            </FormField>
          </div>

          {/* Additional Notes */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <FormField
              label="Additional Notes"
              hint="Optional: Any special requirements or preferences"
            >
              <Textarea
                value={formData.additionalNotes}
                onChange={(value) => updateFormData("additionalNotes", value)}
                placeholder="Add any additional notes or instructions..."
                rows={4}
              />
            </FormField>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold py-4 px-6 rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                {pollingStep || "Processing..."}
              </>
            ) : (
              <>
                <Video className="h-5 w-5" />
                Generate AI Video
              </>
            )}
          </button>

          {/* Polling Progress Bar */}
          {isSubmitting && pollingProgress > 0 && (
            <div className="mt-4 bg-white rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  {pollingStep}
                </span>
                <span className="text-sm font-semibold text-blue-600">
                  {pollingProgress}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-gradient-to-r from-blue-600 to-purple-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${pollingProgress}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 text-center">
                This may take 60-90 seconds. Please don't close this page.
              </p>
            </div>
          )}
        </form>

        {/* Response Display */}
        {response && (
          <div
            className={`mt-6 rounded-xl p-6 ${
              response.success
                ? "bg-green-50 border border-green-200"
                : "bg-red-50 border border-red-200"
            }`}
          >
            <div className="flex items-start gap-3">
              {response.success ? (
                <CheckCircle2 className="h-6 w-6 text-green-600 flex-shrink-0 mt-1" />
              ) : (
                <AlertCircle className="h-6 w-6 text-red-600 flex-shrink-0 mt-1" />
              )}
              <div className="flex-1 min-w-0">
                <h3
                  className={`font-semibold text-lg mb-2 ${
                    response.success ? "text-green-900" : "text-red-900"
                  }`}
                >
                  {response.success ? "Success!" : "Error"}
                </h3>
                {response.success && (
                  <div className="space-y-2">
                    <p className="text-green-800">
                      Status: {response.status}
                    </p>
                    {response.data?.requestId && (
                      <p className="text-green-800">
                        <span className="font-semibold">Request ID:</span>{" "}
                        <span className="font-mono bg-green-100 px-2 py-1 rounded">
                          {response.data.requestId}
                        </span>
                      </p>
                    )}
                    <details className="mt-4">
                      <summary className="cursor-pointer text-green-700 font-medium">
                        View full response
                      </summary>
                      <pre className="mt-2 bg-white p-4 rounded border border-green-200 text-sm overflow-x-auto">
                        {JSON.stringify(response.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                {!response.success && (
                  <div className="space-y-2">
                    <p className="text-red-800">{response.error}</p>
                    {response.details && (
                      <details className="mt-4">
                        <summary className="cursor-pointer text-red-700 font-medium">
                          View details
                        </summary>
                        <pre className="mt-2 bg-white p-4 rounded border border-red-200 text-sm overflow-x-auto">
                          {response.details}
                        </pre>
                      </details>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
