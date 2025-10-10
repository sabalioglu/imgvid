# n8n HTTP Request Setup

## 🎯 Edge Function URL
```
https://zybagsuniyidctaxmqbt.supabase.co/functions/v1/video-complete
```

## 📝 n8n'de HTTP Request Node Kurulumu

### 1. HTTP Request Node Ekleyin
n8n workflow'unuza **HTTP Request** node ekleyin (Webhook DEĞİL!)

### 2. Node Ayarları

#### Basic Settings:
- **Method**: `POST`
- **URL**: `https://zybagsuniyidctaxmqbt.supabase.co/functions/v1/video-complete`

#### Authentication:
- **Authentication**: `Generic Credential Type`
- Veya **Predefined Credential Type** > **Header Auth**

**Credential Bilgileri**:
- **Name**: `Authorization`
- **Value**: `Bearer f3f2ede038f58d01af71d8715ed89328058fa76774e04d9baf36da9bc3cc7999`

#### Body/Parameters:
- **Send Body**: `true`
- **Body Content Type**: `JSON`
- **Specify Body**: `Using JSON`

### 3. JSON Body Template

#### Seçenek A: Direkt URL Gönderme (Basit)
```json
{
  "videoId": "{{ $json.videoId }}",
  "userEmail": "{{ $json.userEmail }}",
  "productName": "{{ $json.productName }}",
  "totalScenes": {{ $json.totalScenes }},
  "duration": {{ $json.duration }},
  "status": "pending_approval",
  "scenes": {{ $json.scenes }},
  "approveUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/approve/{{ $json.videoId }}",
  "rejectFormUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/reject-form/{{ $json.videoId }}",
  "createdAt": "{{ $now.toISOString() }}"
}
```

#### Seçenek B: Supabase Storage'a Upload (Önerilen)
```json
{
  "videoId": "{{ $json.videoId }}",
  "userEmail": "{{ $json.userEmail }}",
  "productName": "{{ $json.productName }}",
  "totalScenes": {{ $json.totalScenes }},
  "duration": {{ $json.duration }},
  "status": "pending_approval",
  "uploadToStorage": true,
  "scenes": {{ $json.scenes }},
  "approveUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/approve/{{ $json.videoId }}",
  "rejectFormUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/reject-form/{{ $json.videoId }}",
  "createdAt": "{{ $now.toISOString() }}"
}
```

### 4. Scenes Array Formatı

Her scene objesi şu formatta olmalı:
```json
{
  "sceneNumber": 0,
  "sceneType": "problem_identification",
  "imageUrl": "https://your-image-url.com/scene0.jpg",
  "processingTime": 45,
  "status": "success"
}
```

## 🔥 Tam Örnek Workflow

### Manual Test için:
```json
{
  "videoId": "req_1760001914704",
  "userEmail": "user@example.com",
  "productName": "Premium Headphones",
  "totalScenes": 3,
  "duration": 24,
  "status": "pending_approval",
  "uploadToStorage": true,
  "scenes": [
    {
      "sceneNumber": 0,
      "sceneType": "problem_identification",
      "imageUrl": "https://images.pexels.com/photos/4968391/pexels-photo-4968391.jpeg",
      "processingTime": 45,
      "status": "success"
    },
    {
      "sceneNumber": 1,
      "sceneType": "solution_discovery",
      "imageUrl": "https://images.pexels.com/photos/5632402/pexels-photo-5632402.jpeg",
      "processingTime": 50,
      "status": "success"
    },
    {
      "sceneNumber": 2,
      "sceneType": "solution_success",
      "imageUrl": "https://images.pexels.com/photos/3758104/pexels-photo-3758104.jpeg",
      "processingTime": 48,
      "status": "success"
    }
  ],
  "approveUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/approve/req_1760001914704",
  "rejectFormUrl": "https://n8n.srv1053240.hstgr.cloud/webhook/reject-form/req_1760001914704",
  "createdAt": "2025-01-10T12:30:00Z"
}
```

## ✅ Response

Başarılı olursa:
```json
{
  "success": true,
  "videoId": "req_1760001914704",
  "userId": "uuid-here",
  "message": "Video synced successfully"
}
```

Hata durumunda:
```json
{
  "success": false,
  "error": "Error message here"
}
```

## 🔍 Debugging

### 1. n8n Console'da Log Kontrolü
HTTP Request node'unun output'unu kontrol edin

### 2. Supabase Edge Function Logs
- Supabase Dashboard > Edge Functions
- `video-complete` function'ı seçin
- Logs sekmesine gidin

### 3. Dashboard Kontrolü
- Uygulamaya giriş yapın
- Dashboard'da yeni videoyu görmelisiniz
- Görseller yüklenmiş olmalı

## 🚨 Yaygın Hatalar

### 401 Unauthorized
- Authorization header'ı kontrol edin
- Bearer token doğru mu?

### 400 Bad Request
- JSON formatı doğru mu?
- Required fieldlar var mı? (videoId, userEmail, productName, scenes)

### 500 Internal Server Error
- Supabase Edge Function logs'a bakın
- User email database'de var mı? (otomatik oluşturulmalı)

## 📊 n8n Workflow Örneği

```
[Trigger: Schedule/Webhook]
    ↓
[AI Image Generation Node]
    ↓
[Process Images]
    ↓
[HTTP Request: video-complete] ← BU NODE
    ↓
[Success Notification]
```

## 🎬 Supabase Storage ile Kullanım

Eğer `uploadToStorage: true` gönderirseniz:

1. ✅ Görseller external URL'den indirilir
2. ✅ Supabase Storage'a upload edilir
3. ✅ Yeni URL veritabanına kaydedilir
4. ✅ Dashboard görselleri gösterir

**Avantajlar**:
- Görseller kendi kontrolünüzde
- Hızlı CDN ile sunulur
- External link expire riski yok
- Bandwidth kontrolü
