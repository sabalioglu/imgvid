import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface WebhookPayload {
  videoId: string;
  userEmail: string;
  productName: string;
  totalScenes: number;
  duration: number;
  status: string;
  scenes: Array<{
    sceneNumber: number;
    sceneType: string;
    imageUrl: string;
    processingTime: number;
    status: string;
  }>;
  approveUrl: string;
  rejectFormUrl: string;
  createdAt: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  try {
    const authHeader = req.headers.get("Authorization");
    const webhookSecret = Deno.env.get("N8N_WEBHOOK_SECRET");

    if (!authHeader || authHeader !== `Bearer ${webhookSecret}`) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const payload: WebhookPayload = await req.json();
    const {
      videoId,
      userEmail,
      productName,
      totalScenes,
      duration,
      status,
      scenes,
      approveUrl,
      rejectFormUrl,
      createdAt,
    } = payload;

    if (!videoId || !userEmail || !productName || !scenes) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          required: ["videoId", "userEmail", "productName", "scenes"],
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let user = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail)
      .maybeSingle();

    if (!user.data) {
      const newUser = await supabase
        .from("users")
        .insert({
          email: userEmail,
          created_at: new Date().toISOString(),
        })
        .select("id")
        .single();

      if (newUser.error) {
        throw new Error(`Failed to create user: ${newUser.error.message}`);
      }
      user = newUser;
    }

    const userId = user.data!.id;

    const videoResult = await supabase
      .from("videos")
      .insert({
        video_id: videoId,
        user_id: userId,
        product_name: productName,
        total_scenes: totalScenes,
        duration: duration,
        status: status,
        approve_url: approveUrl,
        reject_form_url: rejectFormUrl,
        created_at: createdAt,
        updated_at: new Date().toISOString(),
      })
      .select("video_id")
      .single();

    if (videoResult.error) {
      throw new Error(`Failed to create video: ${videoResult.error.message}`);
    }

    const sceneRecords = scenes.map((scene) => ({
      video_id: videoId,
      scene_number: scene.sceneNumber,
      scene_type: scene.sceneType,
      image_url: scene.imageUrl,
      processing_time: scene.processingTime,
      status: scene.status,
    }));

    const scenesResult = await supabase
      .from("scenes")
      .insert(sceneRecords);

    if (scenesResult.error) {
      throw new Error(`Failed to create scenes: ${scenesResult.error.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        videoId: videoId,
        userId: userId,
        message: "Video synced successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
