import { useEffect, useState } from 'react';
import { Video, CheckCircle, XCircle, Clock, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import type { VideoRecord } from '../types';

type TabType = 'images' | 'videos';

export function VideoDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchVideos();
  }, [user]);

  const fetchVideos = async () => {
    try {
      if (!user) {
        setError('Please sign in to view your creations');
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', user.email)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user:', userError);
        setVideos([]);
        setLoading(false);
        return;
      }

      if (!userData) {
        console.log('No user found in database for:', user.email);
        setVideos([]);
        setLoading(false);
        return;
      }

      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select(`
          *,
          scenes (*)
        `)
        .eq('user_id', userData.id)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        setVideos([]);
      } else {
        setVideos(videosData || []);
      }
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending_approval':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'processing':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'completed':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
      case 'completed':
        return <CheckCircle className="w-4 h-4" />;
      case 'rejected':
        return <XCircle className="w-4 h-4" />;
      case 'pending_approval':
      case 'processing':
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-slate-600">Loading your creations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-lg max-w-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">My Creations</h1>
          <p className="text-slate-600">
            View and manage your AI-generated content
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-lg mb-6 p-2">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('videos')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'videos'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Video className="w-5 h-5" />
              Videos
            </button>
            <button
              onClick={() => setActiveTab('images')}
              className={`flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
                activeTab === 'images'
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <ImageIcon className="w-5 h-5" />
              Images
            </button>
          </div>
        </div>

        {activeTab === 'videos' && (
          videos.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
                <Video className="w-10 h-10 text-slate-400" />
              </div>
              <h2 className="text-xl font-semibold text-slate-900 mb-2">
                No videos yet
              </h2>
              <p className="text-slate-600">
                Your generated videos will appear here once they're processed
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
                    {video.scenes && video.scenes.length > 0 ? (
                      <img
                        src={video.scenes[0].image_url}
                        alt={`${video.product_name} scene`}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <Video className="w-16 h-16 text-white opacity-50" />
                      </div>
                    )}
                    <div className="absolute top-3 right-3">
                      <span
                        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(
                          video.status
                        )}`}
                      >
                        {getStatusIcon(video.status)}
                        {video.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">
                      {video.product_name}
                    </h3>

                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Scenes:</span>
                        <span className="font-medium text-slate-900">
                          {video.total_scenes}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Duration:</span>
                        <span className="font-medium text-slate-900">
                          {video.duration}s
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">Created:</span>
                        <span className="font-medium text-slate-900">
                          {new Date(video.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    {video.status === 'pending_approval' && (
                      <div className="flex gap-2">
                        <a
                          href={video.approve_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Approve
                          <ExternalLink className="w-3 h-3" />
                        </a>
                        <a
                          href={video.reject_form_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1 inline-flex items-center justify-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors text-sm"
                        >
                          <XCircle className="w-4 h-4" />
                          Reject
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    )}

                    {video.final_video_url && (
                      <a
                        href={video.final_video_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-center text-sm"
                      >
                        Watch Video
                      </a>
                    )}

                    {video.scenes && video.scenes.length > 1 && (
                      <div className="mt-4 pt-4 border-t border-slate-200">
                        <p className="text-xs text-slate-600 mb-2">Scene Previews:</p>
                        <div className="grid grid-cols-3 gap-2">
                          {video.scenes.slice(0, 3).map((scene: any) => (
                            <img
                              key={scene.id}
                              src={scene.image_url}
                              alt={`Scene ${scene.scene_number}`}
                              className="aspect-video rounded object-cover border border-slate-200"
                            />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {activeTab === 'images' && (
          <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-slate-100 rounded-full mb-4">
              <ImageIcon className="w-10 h-10 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">
              Coming Soon
            </h2>
            <p className="text-slate-600">
              Image generation feature is under development
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
