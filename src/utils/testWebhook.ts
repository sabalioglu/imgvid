export async function testWebhookIntegration(userEmail: string) {
  const testPayload = {
    videoId: "test_" + Date.now(),
    userEmail: userEmail,
    productName: "Test Product - Sample Ad",
    totalScenes: 3,
    duration: 24,
    status: "pending_approval",
    scenes: [
      {
        sceneNumber: 0,
        sceneType: "problem_identification",
        imageUrl: "https://images.pexels.com/photos/4968391/pexels-photo-4968391.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
        processingTime: 45,
        status: "success"
      },
      {
        sceneNumber: 1,
        sceneType: "solution_discovery",
        imageUrl: "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
        processingTime: 50,
        status: "success"
      },
      {
        sceneNumber: 2,
        sceneType: "solution_success",
        imageUrl: "https://images.pexels.com/photos/3758104/pexels-photo-3758104.jpeg?auto=compress&cs=tinysrgb&w=400&h=600&fit=crop",
        processingTime: 48,
        status: "success"
      }
    ],
    approveUrl: "https://n8n.srv1053240.hstgr.cloud/webhook/approve/test_" + Date.now(),
    rejectFormUrl: "https://n8n.srv1053240.hstgr.cloud/webhook/reject-form/test_" + Date.now(),
    createdAt: new Date().toISOString()
  };

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const webhookSecret = import.meta.env.VITE_N8N_WEBHOOK_SECRET || 'f3f2ede038f58d01af71d8715ed89328058fa76774e04d9baf36da9bc3cc7999';

  try {
    const response = await fetch(
      `${supabaseUrl}/functions/v1/video-complete`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${webhookSecret}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(testPayload)
      }
    );

    const result = await response.json();

    if (!response.ok) {
      console.error('Test webhook failed:', result);
      return {
        success: false,
        error: result.error || 'Request failed',
        status: response.status
      };
    }

    console.log('Test webhook succeeded:', result);
    return {
      success: true,
      data: result,
      message: 'Test video created successfully! Check the dashboard.'
    };
  } catch (error) {
    console.error('Test webhook error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
