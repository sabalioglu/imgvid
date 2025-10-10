import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle, Loader2, AlertCircle, Video, XCircle, Eye, Clock, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import type { VideoRecord } from '../types';

type PageState = 'loading' | 'loaded' | 'approving' | 'success' | 'error';

export function ApprovalPage() {
  const { videoId } = useParams<{ videoId: string }>();
  const navigate = useNavigate();
  const [state, setState] = useState<PageState>('loading');
  const [video, setVideo] = useState<VideoRecord | null>(null);
  const [error, setError] = useState<string>('');
  const [selectedScene, setSelectedScene] = useState<number | null>(null);

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

  const handleApprove = async () => {
    if (!videoId) return;

    try {
      setState('approving');
      const response = await fetch(
        `https://n8n.srv1053240.hstgr.cloud/webhook-test/approve/${videoId}`
      );

      if (!response.ok) {
        throw new Error('Failed to approve video');
      }

      setState('success');
      setTimeout(() => {
        navigate('/');
      }, 3000);
    } catch (err) {
      console.error('Error approving video:', err);
      setError(err instanceof Error ? err.message : 'Failed to approve video');
      setState('error');
    }
  };

  const handleReject = () => {
    navigate(`/reject-form/${videoId}`);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getSceneTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      problem_identification: 'bg-red-100 text-red-800',
      solution_discovery: 'bg-blue-100 text-blue-800',
      product_showcase: 'bg-green-100 text-green-800',
      call_to_action: 'bg-purple-100 text-purple-800',
      solution_success: 'bg-emerald-100 text-emerald-800',
    };
    return colors[type] || 'bg-gray-100 text-gray-800';
  };

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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Approved!</h2>
          <p className="text-slate-600 mb-6">
            Your video has been approved and is now being processed.
          </p>
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-left mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Final video will be generated</li>
              <li>• You'll receive an email when ready</li>
              <li>• Check your dashboard for updates</li>
              <li>• Estimated time: 5-10 minutes</li>
            </ul>
          </div>
          <p className="text-sm text-slate-500">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h1 className="text-3xl font-bold text-white mb-2">
              Review Your Video
            </h1>
            <p className="text-blue-100">
              Review the generated scenes and approve or select scenes to regenerate
            </p>
          </div>

          <div className="p-8">
            <div className="bg-slate-50 rounded-xl p-6 mb-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="flex items-center gap-3">
                  <Video className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="text-sm text-slate-600">Product</p>
                    <p className="font-semibold text-slate-900">{video.product_name}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ImageIcon className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="text-sm text-slate-600">Total Scenes</p>
                    <p className="font-semibold text-slate-900">{video.total_scenes}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="text-sm text-slate-600">Duration</p>
                    <p className="font-semibold text-slate-900">{video.duration}s</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-orange-600" />
                  <div>
                    <p className="text-sm text-slate-600">Created</p>
                    <p className="font-semibold text-slate-900 text-sm">
                      {formatDate(video.created_at)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <h2 className="text-xl font-bold text-slate-900 mb-4">Generated Scenes</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {video.scenes?.map((scene) => (
                <div
                  key={scene.id}
                  className="group relative bg-white border-2 border-slate-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer"
                  onClick={() => setSelectedScene(scene.scene_number)}
                >
                  <div className="aspect-video relative overflow-hidden">
                    <img
                      src={scene.image_url}
                      alt={`Scene ${scene.scene_number}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Scene {scene.scene_number}
                    </div>
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                      <button
                        className="bg-white text-slate-900 px-4 py-2 rounded-lg font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-2"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(scene.image_url, '_blank');
                        }}
                      >
                        <Eye className="w-4 h-4" />
                        View Full
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${getSceneTypeBadge(scene.scene_type)}`}>
                        {scene.scene_type.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                        scene.status === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {scene.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-slate-600">
                      <Clock className="w-4 h-4" />
                      <span>{scene.processing_time}s processing time</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 pt-8">
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleApprove}
                  disabled={state === 'approving'}
                  className="flex-1 bg-green-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg"
                >
                  {state === 'approving' ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Approving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      Approve & Continue
                    </>
                  )}
                </button>
                <button
                  onClick={handleReject}
                  disabled={state === 'approving'}
                  className="flex-1 bg-red-600 text-white px-8 py-4 rounded-xl font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 text-lg shadow-lg"
                >
                  <XCircle className="w-5 h-5" />
                  Select Scenes to Regenerate
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
