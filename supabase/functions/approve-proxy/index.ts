import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const url = new URL(req.url);
    const pathParts = url.pathname.split('/');
    const action = pathParts[pathParts.length - 2];
    const videoId = pathParts[pathParts.length - 1];

    if (!videoId) {
      return new Response(
        JSON.stringify({ error: 'Video ID is required' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    let targetUrl = '';
    let method = 'GET';
    let body = null;

    if (action === 'approve') {
      targetUrl = `https://n8n.srv1053240.hstgr.cloud/webhook/approve/${videoId}`;
      method = 'GET';
    } else if (action === 'reject') {
      targetUrl = `https://n8n.srv1053240.hstgr.cloud/webhook/reject/${videoId}`;
      method = 'POST';

      if (req.method === 'POST') {
        body = await req.text();
      }
    } else {
      return new Response(
        JSON.stringify({ error: 'Invalid action. Use /approve/:videoId or /reject/:videoId' }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json',
          },
        }
      );
    }

    const fetchOptions: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (body) {
      fetchOptions.body = body;
    }

    const response = await fetch(targetUrl, fetchOptions);
    const data = await response.text();

    let parsedData;
    try {
      parsedData = JSON.parse(data);
    } catch {
      parsedData = { message: data };
    }

    return new Response(
      JSON.stringify(parsedData),
      {
        status: response.status,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Proxy error:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to proxy request',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});
