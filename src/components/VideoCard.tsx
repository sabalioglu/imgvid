// src/components/VideoCard.tsx

import { CheckCircle, XCircle, Clock, ExternalLink, Download, Eye } from 'lucide-react';
import type { VideoRecord } from '../types';

interface VideoCardProps {
  video: VideoRecord;
}

export function VideoCard({ video }: VideoCardProps) {
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
        return 'bg-purple-100 text-purple-800 border-purple-300';
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // ✅ JSONB scenes'den gelen field names
  const scenes = video.scenes || [];

  return (
    <div className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">
      <div className="aspect-video bg-gradient-to-br from-blue-500 to-blue-600 relative overflow-hidden">
        {scenes.length > 0 ? (
          <img
            src={scenes[0].sceneImageUrl}
            alt={`${video.product_name} scene`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <Clock className="w-16 h-16 text-white opacity-50" />
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
        <h3 className="text-lg font-semibold text-slate-900 mb-4">
          {video.product_name}
        </h3>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">🎬 Scenes:</span>
            <span className="font-medium text-slate-900">
              {video.total_scenes}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">⏱️ Duration:</span>
            <span className="font-medium text-slate-900">{video.duration}s</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">📅 Created:</span>
            <span className="font-medium text-slate-900">
              {formatDate(video.created_at)}
            </span>
          </div>
        </div>

        {video.status === 'pending_approval' && (
          <div className="flex gap-2 mb-4">
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
              Regenerate
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        )}

        {video.status === 'processing' && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-center gap-2">
              <div className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm text-blue-800 font-medium">Processing...</span>
            </div>
          </div>
        )}

        {video.final_video_url && (
          <div className="flex gap-2 mb-4">
            <a
              href={video.final_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-purple-700 transition-colors text-sm"
            >
              <Download className="w-4 h-4" />
              Download Video
            </a>
            <a
              href={video.final_video_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 inline-flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
            >
              <Eye className="w-4 h-4" />
              View Details
            </a>
          </div>
        )}

        {scenes.length > 1 && (
          <div className="pt-4 border-t border-slate-200">
            <p className="text-xs text-slate-600 mb-2 font-medium">Scene Previews:</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {scenes.map((scene: any) => (
                <div key={scene.sceneNumber} className="relative">
                  <img
                    src={scene.sceneImageUrl}
                    alt={`Scene ${scene.sceneNumber}`}
                    className="aspect-video rounded object-cover border border-slate-200"
                    loading="lazy"
                  />
                  <div className="absolute top-1 left-1 bg-black bg-opacity-70 text-white text-xs px-2 py-0.5 rounded">
                    {scene.sceneNumber}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
