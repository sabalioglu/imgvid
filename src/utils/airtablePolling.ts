const AIRTABLE_BASE_ID = import.meta.env.VITE_AIRTABLE_BASE_ID;
const AIRTABLE_PAT = import.meta.env.VITE_AIRTABLE_PAT;

export interface AirtableScene0 {
  videoId: string;
  sceneImageUrl: string;
  sceneType: string;
  processingTime: string;
  productName: string;
}

export interface StatusCheckResult {
  status: "complete" | "processing" | "error";
  message?: string;
  data?: AirtableScene0;
}

export async function checkScene0Status(
  videoId: string
): Promise<StatusCheckResult> {
  if (!videoId) {
    return {
      status: "error",
      message: "videoId is required",
    };
  }

  try {
    const airtableUrl = `https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/Img%20Gen`;
    const filterFormula = encodeURIComponent(`{videoId}='${videoId}'`);

    const response = await fetch(`${airtableUrl}?filterByFormula=${filterFormula}`, {
      headers: {
        Authorization: `Bearer ${AIRTABLE_PAT}`,
        "Content-Type": "application/json",
      },
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(`Airtable API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.records && data.records.length > 0) {
      const scene0 = data.records.find(
        (record: any) =>
          record.fields.sceneNumber === 0 && record.fields.status === "success"
      );

      if (scene0) {
        return {
          status: "complete",
          data: {
            videoId: scene0.fields.videoId,
            sceneImageUrl: scene0.fields.sceneImageUrl,
            sceneType: scene0.fields.sceneType,
            processingTime: scene0.fields["Processing Time"],
            productName: scene0.fields["Product Name"],
          },
        };
      }
    }

    return {
      status: "processing",
      message: "Scene 0 generation in progress...",
    };
  } catch (error) {
    console.error("Check status error:", error);
    return {
      status: "error",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export interface PollingOptions {
  onProgress?: (progress: number, step: string) => void;
  onComplete?: (data: AirtableScene0) => void;
  onError?: (error: string) => void;
  maxAttempts?: number;
  pollInterval?: number;
}

export function startPolling(videoId: string, options: PollingOptions = {}) {
  const {
    onProgress,
    onComplete,
    onError,
    maxAttempts = 40,
    pollInterval = 3000,
  } = options;

  const progressSteps = [
    { delay: 0, progress: 5, step: "Uploading image..." },
    { delay: 5000, progress: 20, step: "Analyzing product..." },
    { delay: 15000, progress: 40, step: "Generating AI prompts..." },
    { delay: 30000, progress: 60, step: "Creating Scene 0..." },
    { delay: 50000, progress: 80, step: "Processing image..." },
    { delay: 70000, progress: 90, step: "Finalizing..." },
  ];

  const timeouts: NodeJS.Timeout[] = [];
  let pollingInterval: NodeJS.Timeout | null = null;
  let attempts = 0;

  progressSteps.forEach((step) => {
    const timeout = setTimeout(() => {
      onProgress?.(step.progress, step.step);
    }, step.delay);
    timeouts.push(timeout);
  });

  const cleanup = () => {
    timeouts.forEach((timeout) => clearTimeout(timeout));
    if (pollingInterval) {
      clearInterval(pollingInterval);
      pollingInterval = null;
    }
  };

  pollingInterval = setInterval(async () => {
    attempts++;
    console.log(`📡 Polling attempt ${attempts}/${maxAttempts}`);

    if (attempts > maxAttempts) {
      cleanup();
      onError?.(
        "Timeout: Scene 0 generation took too long (>2 minutes). Please try again."
      );
      return;
    }

    try {
      const statusData = await checkScene0Status(videoId);
      console.log("📊 Status:", statusData.status);

      if (statusData.status === "complete" && statusData.data) {
        console.log("✅ Scene 0 complete!");
        cleanup();
        onProgress?.(100, "Complete!");
        onComplete?.(statusData.data);
      } else if (statusData.status === "error") {
        console.error("❌ Status check error:", statusData.message);
      }
    } catch (error) {
      console.error("❌ Polling error:", error);
    }
  }, pollInterval);

  return cleanup;
}
