export type AdType =
  | "UGC - Talking Person with Product"
  | "Product Showcase - 30s Use Cases"
  | "VFX Style - Dynamic Product Only";

export type TargetAudience =
  | "Gen Z (18-24)"
  | "Millennials (25-40)"
  | "Gen X (41-55)"
  | "All Ages"
  | "Business/Professional";

export type Platform =
  | "TikTok/Reels (9:16)"
  | "YouTube/Facebook (16:9)"
  | "Instagram Square (1:1)"
  | "Stories (9:16)";

export type VideoLength =
  | "16s Problem + Solution"
  | "24s Problem + Discovery + Success"
  | "32s (Problem + Discovery + Trial + Success"
  | "40s (5 scenes total)"
  | "48s (6 scenes total)"
  | "56s (7 scenes total)"
  | "64s (8 scenes total)";

export type ProductionMode =
  | "Single Video (Best for 8s)"
  | "Story Mode - Connected Scenes (Best for 16-32s UGC Vids) ";

export type UGCStyle =
  | "Holding Product - Natural pose"
  | "Using Product - In action"
  | "Unboxing - First impression"
  | "Mirror Selfie - Authentic angle"
  | "Before & After - Transformation"
  | "Cozy at Home - Relaxed setting"
  | "Friend Sharing - Social moment"
  | "ASMR"
  | "Podcast";

export type VFXStyle =
  | "Energy Burst - Power explosion"
  | "Liquid Splash - Water/paint effect"
  | "Particle Glow - Sparkles and magic"
  | "Color Powder - Holi explosion"
  | "3D rotation with effects"
  | "Fire & Flames - Dramatic heat"
  | "Smoke & Fog - Mysterious atmosphere"
  | "Neon Lights - Cyberpunk style"
  | "Shattered Glass - Breaking effect";

export type ShowcaseStyle =
  | "Clean & Minimal - White background"
  | "Premium Dark - Luxury aesthetic"
  | "Lifestyle Shot - Natural setting"
  | "Hero Angle - Dramatic view"
  | "Detail Focus - Macro close-up"
  | "Scale Reference - Size comparison";

export interface VideoFormData {
  productImages: File[];
  productName: string;
  productDescription: string;
  email: string;
  adType: AdType | "";
  targetAudience: TargetAudience | "";
  platform: Platform | "";
  videoLength: VideoLength | "";
  productionMode: ProductionMode | "";
  ugcStyleDetails: UGCStyle | "";
  vfxStyleDetails: VFXStyle | "";
  productShowcaseStyle: ShowcaseStyle | "";
  additionalNotes: string;
}

export interface ValidationErrors {
  productImages?: string;
  productName?: string;
  productDescription?: string;
  email?: string;
  adType?: string;
  targetAudience?: string;
  platform?: string;
  videoLength?: string;
  productionMode?: string;
  ugcStyleDetails?: string;
  vfxStyleDetails?: string;
  productShowcaseStyle?: string;
}

export type Environment = "demo" | "production";

export interface Scene0Data {
  requestId: string;
  productName: string;
  scene0: {
    imageUrl: string;
    resumeUrl: string;
    sceneNumber: number;
    processingTime: string;
    seed?: number;
  };
  character: {
    gender: string;
    age: number;
    ethnicity: string;
    description: string;
  };
  approval: {
    required: boolean;
    question: string;
    options: string[];
  };
  progress: {
    completed: number;
    total: number;
    percentage: number;
  };
  scene0Details?: {
    duration: number;
    cameraMovement: string;
    lighting: string;
    mood: string;
  };
}

export interface ApprovalResponse {
  success: boolean;
  message?: string;
  data?: {
    requestId?: string;
    nextStage?: string;
    estimatedTime?: string;
  };
}

export interface RegenerateResponse {
  success: boolean;
  regenerated: boolean;
  data: {
    scene0: {
      imageUrl: string;
      resumeUrl: string;
      seed: number;
      processingTime: string;
    };
    regenerationCount: number;
  };
}

export interface Scene {
  id: string;
  video_id: string;
  scene_number: number;
  scene_type: string;
  image_url: string;
  processing_time: number;
  status: string;
  created_at: string;
}

export interface VideoRecord {
  id: string;
  video_id: string;
  user_id: string;
  product_name: string;
  total_scenes: number;
  duration: number;
  status: 'pending_approval' | 'approved' | 'rejected' | 'processing' | 'completed';
  approve_url: string;
  reject_form_url: string;
  final_video_url?: string;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  scenes?: Scene[];
}
