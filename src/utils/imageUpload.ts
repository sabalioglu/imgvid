import { supabase } from '../lib/supabase';

export interface UploadResult {
  success: boolean;
  publicUrl?: string;
  error?: string;
}

export async function uploadSceneImage(
  file: File | Blob,
  videoId: string,
  sceneNumber: number
): Promise<UploadResult> {
  try {
    const fileExt = file instanceof File ? file.name.split('.').pop() : 'jpg';
    const fileName = `${videoId}/scene-${sceneNumber}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('video-scenes')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (uploadError) {
      console.error('Upload error:', uploadError);
      return {
        success: false,
        error: uploadError.message,
      };
    }

    const { data: urlData } = supabase.storage
      .from('video-scenes')
      .getPublicUrl(fileName);

    return {
      success: true,
      publicUrl: urlData.publicUrl,
    };
  } catch (error) {
    console.error('Upload exception:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function uploadSceneImageFromUrl(
  imageUrl: string,
  videoId: string,
  sceneNumber: number
): Promise<UploadResult> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return {
        success: false,
        error: `Failed to fetch image: ${response.statusText}`,
      };
    }

    const blob = await response.blob();
    return await uploadSceneImage(blob, videoId, sceneNumber);
  } catch (error) {
    console.error('Download and upload error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function deleteVideoScenes(videoId: string): Promise<boolean> {
  try {
    const { data: files, error: listError } = await supabase.storage
      .from('video-scenes')
      .list(videoId);

    if (listError) {
      console.error('List error:', listError);
      return false;
    }

    if (!files || files.length === 0) {
      return true;
    }

    const filePaths = files.map((file) => `${videoId}/${file.name}`);
    const { error: deleteError } = await supabase.storage
      .from('video-scenes')
      .remove(filePaths);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Delete exception:', error);
    return false;
  }
}
