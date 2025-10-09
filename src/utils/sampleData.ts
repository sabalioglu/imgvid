import { VideoFormData } from "../types";

export const getSampleFormData = (): Partial<VideoFormData> => {
  return {
    productName: "Premium Wireless Earbuds Pro",
    productDescription:
      "Experience crystal-clear audio with our latest wireless earbuds featuring active noise cancellation, 30-hour battery life, and premium sound quality. Perfect for music lovers and professionals on the go.",
    email: "demo@example.com",
    adType: "UGC - Talking Person with Product",
    targetAudience: "Millennials (25-40)",
    platform: "TikTok/Reels (9:16)",
    videoLength: "24s Problem + Discovery + Success",
    productionMode: "Story Mode - Connected Scenes (Best for 16-32s UGC Vids) ",
    ugcStyleDetails: "Using Product - In action",
    additionalNotes: "Focus on the noise cancellation feature and battery life. Show the product in use during a commute.",
  };
};

export const generateCurlCommand = (
  webhookURL: string,
  formData: VideoFormData
): string => {
  let curl = `curl -X POST "${webhookURL}" \\\n`;
  curl += `  -H "Content-Type: multipart/form-data" \\\n`;

  if (formData.productImages.length > 0) {
    formData.productImages.forEach((_, index) => {
      curl += `  -F "Product Images=@/path/to/image${index + 1}.jpg" \\\n`;
    });
  }

  curl += `  -F "Product Name=${formData.productName}" \\\n`;
  curl += `  -F "Product Description=${formData.productDescription}" \\\n`;
  curl += `  -F "Email=${formData.email}" \\\n`;
  curl += `  -F "Ad Type=${formData.adType}" \\\n`;
  curl += `  -F "Target Audience=${formData.targetAudience}" \\\n`;
  curl += `  -F "Platform=${formData.platform}" \\\n`;
  curl += `  -F "Video Length (includes problem scene + solution scenes)=${formData.videoLength}" \\\n`;
  curl += `  -F "Production Mode=${formData.productionMode}" \\\n`;

  if (formData.ugcStyleDetails) {
    curl += `  -F "UGC Style Details=${formData.ugcStyleDetails}" \\\n`;
  }

  if (formData.vfxStyleDetails) {
    curl += `  -F "VFX Style Details- *Choose if your ad type is VFX*=${formData.vfxStyleDetails}" \\\n`;
  }

  if (formData.productShowcaseStyle) {
    curl += `  -F "Product Showcase Style *Choose if your ad type is Product Showcase*=${formData.productShowcaseStyle}" \\\n`;
  }

  if (formData.additionalNotes) {
    curl += `  -F "Additional Notes=${formData.additionalNotes}" \\\n`;
  }

  return curl.slice(0, -3); // Remove last " \\\n"
};
