// src/components/VideoDashboard.tsx

import { useEffect, useState } from 'react';
import { Video, Image as ImageIcon, RefreshCw, TestTube } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { VideoCard } from './VideoCard';
import { testWebhookIntegration } from '../utils/testWebhook';
import type { VideoRecord } from '../types';

type TabType = 'images' | 'videos';

export function VideoDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('videos');
  const [videos, setVideos] = useState<VideoRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notification, setNotification] = useState('');

  useEffect(() => {
    if (user) {
      fetchVideos();

      const channel = supabase
        .channel('videos-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'videos',
          },
          (payload) => {
            console.log('Video updated:', payload);
            setNotification('New video ready!');
            setTimeout(() => setNotification(''), 3000);
            fetchVideos();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchVideos = async () => {
    try {
      if (!user) {
        setError('Please sign in to view your creations');
        setLoading(false);
        return;
      }

      console.log('🔍 Fetching videos for:', user.email);

      // ✅ Direkt email ile sorgula (basit ve çalışıyor)
      const { data: videosData, error: videosError } = await supabase
        .from('videos')
        .select('*') // scenes zaten JSONB column olarak içinde
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (videosError) {
        console.error('Error fetching videos:', videosError);
        setError('Failed to load videos. Please try again.');
        setVideos([]);
      } else {
        console.log('📊 Raw videos data:', videosData);

        // ✅ JSONB scenes'i parse et
        const parsedVideos = videosData?.map(video => {
          let scenesArray = [];
          
          if (video.scenes) {
            if (typeof video.scenes === 'string') {
              // String ise parse et
              try {
                scenesArray = JSON.parse(video.scenes);
              } catch (e) {
                console.error('Failed to parse scenes for video:', video.video_id, e);
              }
            } else if (Array.isArray(video.scenes)) {
              // Zaten array ise direkt kullan
              scenesArray = video.scenes;
            }
          }

          return {
            ...video,
            scenes: scenesArray
          };
        }) || [];

        console.log('✅ Videos loaded:', parsedVideos.length);
        console.log('📹 First video scenes:', parsedVideos[0]?.scenes);
        
        setVideos(parsedVideos);
        setError('');
      }
    } catch (err: any) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos. Please try again.');
      setVideos([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    setLoading(true);
    setError('');
    fetchVideos();
  };

  const handleTestWebhook = async () => {
    if (!user?.email) return;

    setNotification('Sending test webhook...');
    const result = await testWebhookIntegration(user.email);

    if (result.success) {
      setNotification(result.message || 'Test video created!');
      setTimeout(() => setNotification(''), 3000);
    } else {
      setNotification('Test failed: ' + result.error);
      setTimeout(() => setNotification(''), 5000);
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

  if (error && videos.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700 mb-4">{error}</p>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {notification && (
          <div className="fixed top-4 right-4 bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg animate-slide-in z-50">
            {notification}
          </div>
        )}

        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 mb-2">My Creations</h1>
            <p className="text-slate-600">
              View and manage your AI-generated content
            </p>
          </div>
          <button
            onClick={handleTestWebhook}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-sm font-medium"
          >
            <TestTube className="w-4 h-4" />
            Test Webhook
          </button>
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
              {videos.length > 0 && (
                <span className="ml-1 px-2 py-0.5 bg-blue-500 text-white text-xs rounded-full">
                  {videos.length}
                </span>
              )}
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
              <p className="text-slate-600 mb-6">
                Your generated videos will appear here once they're processed
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {videos.map((video) => (
                <VideoCard key={video.id} video={video} />
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
