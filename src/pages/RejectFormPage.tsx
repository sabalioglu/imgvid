import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, XCircle, Send } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { VideoRecord } from '../types';

type PageState = 'loading' | 'loaded' | 'submitting' | 'success' | 'error';

export function RejectFormPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('loading');
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedScenes, setSelectedScenes] = useState<number[]>([]);
  const [feedback, setFeedback] = useState<string>('');

  useEffect(() => {
    if (!videoId) {
      setError('Video ID is missing');
      setState('error');
      return;
    }
    fetchVideoData();
  }, [videoId]);

  const fetchVideoData = async () => {
    if (!videoId) return;

    try {
      setState('loading');
      const { data, error } = await supabase
        .from('videos')
        .select(`
          *,
          scenes (*)
        `)
        .eq('video_id', videoId)
        .single();

      if (error) throw error;

      if (!data) {
        setError('Video not found');
        setState('error');
        return;
      }

      if (data.scenes) {
        data.scenes.sort((a, b) => a.scene_number - b.scene_number);
      }

      setVideo(data as VideoRecord);
      setState('loaded');
    } catch (err) {
      console.error('Error fetching video:', err);
      setError(err instanceof Error ? err.message : 'Failed to load video');
      setState('error');
    }
  };

  const toggleScene = (sceneNumber: number) => {
    setSelectedScenes((prev) =>
      prev.includes(sceneNumber)
        ? prev.filter((s) => s !== sceneNumber)
        : [...prev, sceneNumber]
    );
  };

  // =============== DEĞİŞİKLİK BAŞLANGICI ===============
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!videoId || selectedScenes.length === 0) return;

    try {
      setState('submitting');
      // ÖNEMLİ: Bu URL'i kendi n8n'deki "reject" workflow'unuzun webhook URL'i ile değiştirin.
      // Genellikle "approve" workflow'una benzer bir yapıda olacaktır.
      const response = await fetch(
        `https://n8n.srv1053240.hstgr.cloud/webhook/reject-video-generation/reject/${videoId}`,
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

      if (!response.ok) {
        throw new Error('Failed to submit regeneration request');
      }

      setState('success');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Error submitting form:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit request');
      setState('error');
    }
  };
  // =============== DEĞİŞİKLİK SONU ===============

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 text-lg">Loading video details...</p>
        </div>
      </div>
    );
  }

  if (state === 'error' || !video) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error</h2>
          <p className="text-slate-600 mb-6">{error || 'Video not found'}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (state === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Request Submitted!</h2>
          <p className="text-slate-600 mb-6">
            Your selected scenes will be regenerated. You'll receive an update soon.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What happens next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Selected scenes will be regenerated</li>
              <li>• You'll receive a new approval request</li>
              <li>• Check your email for updates</li>
              <li>• Estimated time: 5-15 minutes</li>
            </ul>
          </div>
          <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-red-600 to-orange-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Select Scenes to Regenerate
            </h1>
            <p className="text-red-100">
              Choose which scenes you'd like to regenerate for {video.product_name}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-8">
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">
                Select Scenes ({selectedScenes.length} selected)
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {video.scenes?.map((scene) => {
                  const isSelected = selectedScenes.includes(scene.scene_number);
                  return (
                    <button
                      key={scene.id}
                      type="button"
                      onClick={() => toggleScene(scene.scene_number)}
                      className={`relative aspect-video rounded-lg overflow-hidden border-4 transition-all ${
                        isSelected
                          ? 'border-red-500 ring-4 ring-red-200 scale-95'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <img
                        src={scene.image_url}
                        alt={`Scene ${scene.scene_number}`}
                        className="w-full h-full object-cover"
                      />
                      <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                        isSelected ? 'bg-red-500 bg-opacity-60' : 'bg-black bg-opacity-0 hover:bg-opacity-20'
                      }`}>
                        {isSelected && (
                          <div className="bg-white rounded-full p-2">
                            <XCircle className="w-8 h-8 text-red-600" />
                          </div>
                        )}
                      </div>
                      <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm font-semibold">
                        Scene {scene.scene_number}
                      </div>
                    </button>
                  );
                })}
              </div>
              {selectedScenes.length === 0 && (
                <p className="text-sm text-slate-500 mt-4 text-center">
                  Click on scenes to select them for regeneration
                </p>
              )}
            </div>

            <div className="mb-8">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Additional Feedback (Optional)
              </label>
              <textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Tell us what you'd like to change about the selected scenes..."
                rows={4}
                className="w-full px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
            </div>

            <div className="border-t border-slate-200 pt-6 flex flex-col sm:flex-row gap-4">
              <button
                type="button"
                onClick={() => navigate(`/approve/${videoId}`)}
                disabled={state === 'submitting'}
                className="flex-1 bg-slate-200 text-slate-700 px-6 py-3 rounded-lg font-medium hover:bg-slate-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Go Back
              </button>
              <button
                type="submit"
                disabled={state === 'submitting' || selectedScenes.length === 0}
                className="flex-1 bg-red-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {state === 'submitting' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5" />
                    Submit Regeneration Request
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}