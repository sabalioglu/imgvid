# Supabase Storage Setup Guide

## 1. Supabase Dashboard'da Storage Bucket Oluşturma

1. Supabase Dashboard'a gidin: https://supabase.com/dashboard
2. Projenizi seçin
3. Sol menüden **Storage** seçeneğine tıklayın
4. **New Bucket** butonuna tıklayın
5. Bucket ayarları:
   - **Name**: `video-scenes`
   - **Public bucket**: ✅ İşaretleyin (görseller herkese açık olmalı)
   - **File size limit**: `10 MB`
   - **Allowed MIME types**:
     - `image/jpeg`
     - `image/png`
     - `image/webp`
     - `image/gif`
6. **Create bucket** butonuna tıklayın

## 2. Storage Policies Ekleme

Bucket oluşturduktan sonra, **Policies** sekmesine gidin ve aşağıdaki politikaları ekleyin:

### Policy 1: Public Read Access
```sql
CREATE POLICY "Public read access for video scenes"
  ON storage.objects FOR SELECT
  TO public
  USING (bucket_id = 'video-scenes');
```

### Policy 2: Service Role Full Access
```sql
CREATE POLICY "Service role can manage all scenes"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'video-scenes')
  WITH CHECK (bucket_id = 'video-scenes');
```

### Policy 3: Authenticated User Upload (Opsiyonel)
```sql
CREATE POLICY "Authenticated users can upload scenes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'video-scenes'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
```

## 3. n8n Webhook'unuzdan Kullanım

### Seçenek A: Direkt URL Gönderme (Mevcut Yöntem)
n8n'den görsellerin URL'lerini doğrudan gönderin:

```json
{
  "videoId": "req_123456",
  "userEmail": "user@example.com",
  "productName": "Örnek Ürün",
  "totalScenes": 3,
  "duration": 24,
  "status": "pending_approval",
  "scenes": [
    {
      "sceneNumber": 0,
      "sceneType": "problem_identification",
      "imageUrl": "https://external-url.com/image1.jpg",
      "processingTime": 45,
      "status": "success"
    }
  ],
  "approveUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/approve/123",
  "rejectFormUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/reject-form/123",
  "createdAt": "2025-01-10T10:00:00Z"
}
```

### Seçenek B: Storage'a Upload Etme (Yeni Yöntem)
Görselleri otomatik olarak Supabase Storage'a upload etmek için `uploadToStorage: true` ekleyin:

```json
{
  "videoId": "req_123456",
  "userEmail": "user@example.com",
  "productName": "Örnek Ürün",
  "totalScenes": 3,
  "duration": 24,
  "status": "pending_approval",
  "uploadToStorage": true,
  "scenes": [
    {
      "sceneNumber": 0,
      "sceneType": "problem_identification",
      "imageUrl": "https://external-url.com/image1.jpg",
      "processingTime": 45,
      "status": "success"
    }
  ],
  "approveUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/approve/123",
  "rejectFormUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/reject-form/123",
  "createdAt": "2025-01-10T10:00:00Z"
}
```

Bu durumda:
1. Webhook, external URL'den görseli indirir
2. Supabase Storage'a upload eder
3. Yeni Supabase URL'ini veritabanına kaydeder
4. Dashboard bu URL'den görselleri gösterir

## 4. Storage'dan Görsellere Erişim

Görseller şu formatta erişilebilir olacak:
```
https://[PROJECT_ID].supabase.co/storage/v1/object/public/video-scenes/[videoId]/scene-[sceneNumber].jpg
```

Örnek:
```
https://abc123xyz.supabase.co/storage/v1/object/public/video-scenes/req_123456/scene-0.jpg
https://abc123xyz.supabase.co/storage/v1/object/public/video-scenes/req_123456/scene-1.jpg
https://abc123xyz.supabase.co/storage/v1/object/public/video-scenes/req_123456/scene-2.jpg
```

## 5. Frontend'den Upload (Opsiyonel)

Eğer frontend'den direkt upload yapmak isterseniz:

```typescript
import { uploadSceneImage } from './utils/imageUpload';

const file = ... // File object
const result = await uploadSceneImage(file, 'video_123', 0);

if (result.success) {
  console.log('Image uploaded:', result.publicUrl);
} else {
  console.error('Upload failed:', result.error);
}
```

## Avantajlar

### Supabase Storage Kullanmanın Avantajları:
- ✅ Görseller kendi kontrolünüzde
- ✅ Hızlı CDN ile sunulur
- ✅ Otomatik yedekleme
- ✅ Dosya boyutu kontrolü
- ✅ MIME type doğrulaması
- ✅ Ücretsiz 1GB storage (Supabase Free Plan)
- ✅ External bağımlılık yok

### External URL Kullanmanın Avantajları:
- ✅ Daha basit entegrasyon
- ✅ Bandwidth tasarrufu (Supabase'de)
- ✅ Hızlı webhook yanıtı (upload beklemez)

## Test Etme

Webhook'u test etmek için:

```bash
curl -X POST "https://[PROJECT_ID].supabase.co/functions/v1/video-complete" \
  -H "Authorization: Bearer YOUR_WEBHOOK_SECRET" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "test_123",
    "userEmail": "test@example.com",
    "productName": "Test Product",
    "totalScenes": 1,
    "duration": 8,
    "status": "pending_approval",
    "uploadToStorage": true,
    "scenes": [
      {
        "sceneNumber": 0,
        "sceneType": "test",
        "imageUrl": "https://images.pexels.com/photos/4968391/pexels-photo-4968391.jpeg",
        "processingTime": 45,
        "status": "success"
      }
    ],
    "approveUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/approve/test_123",
    "rejectFormUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/reject-form/test_123",
    "createdAt": "2025-01-10T10:00:00Z"
  }'
```
