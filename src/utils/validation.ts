import { VideoFormData, ValidationErrors } from "../types";

export const validateForm = (formData: VideoFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  if (formData.productImages.length === 0) {
    errors.productImages = "At least one product image is required";
  }

  if (!formData.productName.trim()) {
    errors.productName = "Product name is required";
  }

  if (!formData.productDescription.trim()) {
    errors.productDescription = "Product description is required";
  }

  if (!formData.email.trim()) {
    errors.email = "Email address is required";
  } else if (!/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(formData.email)) {
    errors.email = "Please enter a valid email address";
  }

  if (!formData.adType) {
    errors.adType = "Ad type is required";
  }

  if (!formData.targetAudience) {
    errors.targetAudience = "Target audience is required";
  }

  if (!formData.platform) {
    errors.platform = "Platform is required";
  }

  if (!formData.videoLength) {
    errors.videoLength = "Video length is required";
  }

  if (!formData.productionMode) {
    errors.productionMode = "Production mode is required";
  }

  // Conditional validations
  if (formData.adType === "UGC - Talking Person with Product" && !formData.ugcStyleDetails) {
    errors.ugcStyleDetails = "UGC style is required for this ad type";
  }

  if (formData.adType === "VFX Style - Dynamic Product Only" && !formData.vfxStyleDetails) {
    errors.vfxStyleDetails = "VFX style is required for this ad type";
  }

  if (formData.adType === "Product Showcase - 30s Use Cases" && !formData.productShowcaseStyle) {
    errors.productShowcaseStyle = "Showcase style is required for this ad type";
  }

  return errors;
};

export const calculateTotalFileSize = (files: File[]): number => {
  return files.reduce((total, file) => total + file.size, 0);
};

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
};

export const calculateProgress = (formData: VideoFormData): number => {
  const fields = [
    formData.productImages.length > 0,
    formData.productName,
    formData.productDescription,
    formData.email,
    formData.adType,
    formData.targetAudience,
    formData.platform,
    formData.videoLength,
    formData.productionMode,
  ];

  // Add conditional fields to count
  if (formData.adType === "UGC - Talking Person with Product") {
    fields.push(!!formData.ugcStyleDetails);
  }
  if (formData.adType === "VFX Style - Dynamic Product Only") {
    fields.push(!!formData.vfxStyleDetails);
  }
  if (formData.adType === "Product Showcase - 30s Use Cases") {
    fields.push(!!formData.productShowcaseStyle);
  }

  const filled = fields.filter(Boolean).length;
  return Math.round((filled / fields.length) * 100);
};
