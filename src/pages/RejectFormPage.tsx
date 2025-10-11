// handleSubmit fonksiyonunu güncelle

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  if (!videoId || selectedScenes.length === 0) {
    alert('Please select at least one scene!');
    return;
  }

  try {
    setState('submitting');

    console.log('🚀 Rejecting video:', videoId);
    console.log('📦 Selected scenes:', selectedScenes);
    console.log('💬 Feedback:', feedback);

    // ✅ DOĞRU URL - Supabase Edge Function üzerinden
    const response = await fetch(
      `https://zybagsuniyidctaxmqbt.supabase.co/functions/v1/approve-proxy/reject/${videoId}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          videoId,
          scenesToRegenerate: selectedScenes,
          feedback: feedback.trim(),
        }),
      }
    );

    console.log('📨 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('❌ Response error:', errorData);
      throw new Error(errorData.error || 'Failed to submit regeneration request');
    }

    const result = await response.json();
    console.log('✅ Rejection result:', result);

    if (result.success) {
      // ✅ N8N zaten Supabase'i güncelliyor
      setState('success');
      setTimeout(() => {
        navigate('/dashboard');
      }, 3000);
    } else {
      throw new Error(result.message || 'Submission failed');
    }
  } catch (err) {
    console.error('❌ Error submitting form:', err);
    setError(err instanceof Error ? err.message : 'Failed to submit request');
    setState('error');
  }
};
