import { VideoFormData } from "../types";

const STORAGE_KEY = "ai-video-creator-form-data";

interface StorageData {
  productName: string;
  productDescription: string;
  adType: string;
  targetAudience: string;
  platform: string;
  videoLength: string;
  productionMode: string;
  ugcStyleDetails: string;
  vfxStyleDetails: string;
  productShowcaseStyle: string;
  additionalNotes: string;
}

export const saveFormData = (formData: Partial<VideoFormData>): void => {
  try {
    const dataToSave: StorageData = {
      productName: formData.productName || "",
      productDescription: formData.productDescription || "",
      adType: formData.adType || "",
      targetAudience: formData.targetAudience || "",
      platform: formData.platform || "",
      videoLength: formData.videoLength || "",
      productionMode: formData.productionMode || "",
      ugcStyleDetails: formData.ugcStyleDetails || "",
      vfxStyleDetails: formData.vfxStyleDetails || "",
      productShowcaseStyle: formData.productShowcaseStyle || "",
      additionalNotes: formData.additionalNotes || "",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
  } catch (error) {
    console.error("Error saving form data:", error);
  }
};

export const loadFormData = (): Partial<VideoFormData> | null => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const data = JSON.parse(saved) as StorageData;
      return {
        productImages: [],
        productName: data.productName,
        productDescription: data.productDescription,
        adType: data.adType as any,
        targetAudience: data.targetAudience as any,
        platform: data.platform as any,
        videoLength: data.videoLength as any,
        productionMode: data.productionMode as any,
        ugcStyleDetails: data.ugcStyleDetails as any,
        vfxStyleDetails: data.vfxStyleDetails as any,
        productShowcaseStyle: data.productShowcaseStyle as any,
        additionalNotes: data.additionalNotes,
      };
    }
    return null;
  } catch (error) {
    console.error("Error loading form data:", error);
    return null;
  }
};

export const clearFormData = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Error clearing form data:", error);
  }
};

export const hasSavedData = (): boolean => {
  try {
    return localStorage.getItem(STORAGE_KEY) !== null;
  } catch (error) {
    return false;
  }
};
