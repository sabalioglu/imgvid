// src/components/VideoDashboard.tsx

import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface Scene {
  sceneNumber: number;
  sceneType: string;
  sceneImageUrl: string;
  processingTime: number;
}

interface Video {
  id: string;
  video_id: string;
  user_id: string;
  product_name: string;
  total_scenes: number;
  duration: number;
  status: string;
  approve_url: string;
  reject_form_url: string;
  scenes: Scene[]; // JSONB'den parse edilecek
  created_at: string;
}

export function VideoDashboard() {
  const { user } = useAuth();
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      fetchVideos();
      
      // Real-time subscription
      const subscription = supabase
        .channel('videos-changes')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'videos'
        }, (payload) => {
          console.log('Video updated:', payload);
          fetchVideos();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(subscription);
      };
    }
  }, [user]);

  async function fetchVideos() {
    if (!user?.email) {
      setError('Please sign in');
      setLoading(false);
      return;
    }

    try {
      console.log('Fetching videos for:', user.email);

      // Direkt email ile sorgula (user_id yerine)
      const { data, error: fetchError } = await supabase
        .from('videos')
        .select('*')
        .eq('user_email', user.email)
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Fetch error:', fetchError);
        throw fetchError;
      }

      console.log('Raw videos data:', data);

      // JSONB scenes'i parse et
      const parsedVideos = data?.map(video => {
        let scenesArray: Scene[] = [];
        
        if (video.scenes) {
          if (typeof video.scenes === 'string') {
            // String ise parse et
            try {
              scenesArray = JSON.parse(video.scenes);
            } catch (e) {
              console.error('Failed to parse scenes:', e);
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

      console.log('Parsed videos:', parsedVideos);

      setVideos(parsedVideos);
      setError('');
    } catch (err) {
      console.error('Error fetching videos:', err);
      setError('Failed to load videos');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(videoId: string) {
    const video = videos.find(v => v.video_id === videoId);
    if (!video) return;

    try {
      console.log('Approving video:', videoId);
      console.log('Approve URL:', video.approve_url);

      const response = await fetch(video.approve_url, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });

      console.log('Approve response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Approve failed:', errorText);
        throw new Error('Approval failed');
      }

      const result = await response.json();
      console.log('Approve result:', result);

      alert('✅ Video onaylandı! Final işlem başlatıldı.');
      fetchVideos();
    } catch (error) {
      console.error('Approve error:', error);
      alert('❌ Onay hatası: ' + error.message);
    }
  }

  function handleReject(videoId: string) {
    const video = videos.find(v => v.video_id === videoId);
    if (!video) return;

    // Yeni sekmede aç
    window.open(video.reject_form_url, '_blank');
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Videolar yükleniyor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
          <p className="text-red-700">{error}</p>
          <button 
            onClick={fetchVideos}
            className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700"
          >
            Tekrar Dene
          </button>
        </div>
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600 text-lg">Henüz video yok.</p>
        <p className="text-gray-500 mt-2">İlk videonuzu oluşturun!</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Videolarım ({videos.length})</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {videos.map((video) => (
          <div key={video.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Scene 0 thumbnail */}
            {video.scenes && video.scenes[0] && (
              <div className="relative">
                <img 
                  src={video.scenes[0].sceneImageUrl} 
                  alt="Scene 0"
                  className="w-full h-48 object-cover"
                />
                <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-sm">
                  Scene 0: Problem
                </div>
              </div>
            )}
            
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                {video.product_name}
              </h3>
              
              <div className="flex items-center gap-2 mb-4">
                <StatusBadge status={video.status} />
                <span className="text-sm text-gray-600">
                  {video.total_scenes} sahne • {video.duration}s
                </span>
              </div>

              {/* Tüm sahneleri grid'de göster */}
              {video.scenes && video.scenes.length > 1 && (
                <div className="grid grid-cols-3 gap-2 mb-4">
                  {video.scenes.map((scene) => (
                    <div key={scene.sceneNumber} className="relative">
                      <img 
                        src={scene.sceneImageUrl}
                        alt={`Scene ${scene.sceneNumber}`}
                        className="w-full h-20 object-cover rounded"
                      />
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-75 text-white px-1 text-xs rounded">
                        {scene.sceneNumber}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Action buttons */}
              {video.status === 'pending_approval' && (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(video.video_id)}
                    className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    ✅ Onayla
                  </button>
                  <button
                    onClick={() => handleReject(video.video_id)}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors font-medium"
                  >
                    🔄 Yeniden Üret
                  </button>
                </div>
              )}

              {video.status === 'approved' && (
                <div className="bg-blue-50 text-blue-800 px-4 py-2 rounded-lg text-center text-sm">
                  ⏳ Video üretiliyor...
                </div>
              )}

              {video.status === 'completed' && (
                <button className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 font-medium">
                  📥 Videoyu İndir
                </button>
              )}

              {/* Debug info (sadece geliştirme için) */}
              <details className="mt-4 text-xs text-gray-500">
                <summary className="cursor-pointer">Debug Info</summary>
                <pre className="mt-2 bg-gray-100 p-2 rounded overflow-auto">
                  {JSON.stringify({
                    video_id: video.video_id,
                    user_id: video.user_id,
                    scenes_count: video.scenes?.length,
                    status: video.status
                  }, null, 2)}
                </pre>
              </details>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending_approval: {
      color: 'bg-yellow-100 text-yellow-800',
      label: 'Onay Bekliyor'
    },
    approved: {
      color: 'bg-blue-100 text-blue-800',
      label: 'Onaylandı'
    },
    processing: {
      color: 'bg-purple-100 text-purple-800',
      label: 'İşleniyor'
    },
    completed: {
      color: 'bg-green-100 text-green-800',
      label: 'Tamamlandı'
    },
    regenerating: {
      color: 'bg-orange-100 text-orange-800',
      label: 'Yeniden Üretiliyor'
    }
  };

  const { color, label } = config[status] || {
    color: 'bg-gray-100 text-gray-800',
    label: status
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
      {label}
    </span>
  );
}