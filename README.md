# Hukuk Paneli

Hukuk bürosu yönetim sistemi - Next.js, Supabase ve shadcn/ui ile geliştirilmiştir.

## Özellikler

- **Dosya Yönetimi**: Müvekkil bilgileri, dava dosyaları ve belge yönetimi
- **Hesaplama Araçları**: Kıdem, ihbar, fazla mesai ve diğer hukuki hesaplamalar
- **Güvenli Auth**: Supabase Auth ile güvenli giriş sistemi
- **Modern UI**: shadcn/ui bileşenleri ile modern arayüz

## Kurulum

1. **Bağımlılıkları yükleyin:**
   ```bash
   npm install
   ```

2. **Supabase projesi oluşturun:**
   - [Supabase](https://supabase.com) hesabı oluşturun
   - Yeni proje oluşturun
   - Auth → Email ayarlarını aktif edin
   - Storage → `documents` bucket'ı oluşturun (private)

3. **Veritabanı şemasını oluşturun:**
   - Supabase SQL Editor'da `database-schema.sql` dosyasını çalıştırın
   - `rls-policies.sql` dosyasını çalıştırın
   - Storage → `documents` → Policies'de `storage-policies.sql` dosyasını çalıştırın

4. **Environment değişkenlerini ayarlayın:**
   ```bash
   # .env.local dosyası oluşturun
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   ```

5. **Projeyi çalıştırın:**
   ```bash
   npm run dev
   ```

## Kullanım

1. `/auth/login` sayfasından e-posta ile giriş yapın
2. Ana sayfadan `/dosyalar` veya `/hesaplama` sayfalarına gidin
3. Dosya yönetimi ve hesaplama araçlarını kullanın

## Proje Yapısı

```
src/
├── app/
│   ├── auth/           # Auth sayfaları
│   ├── dosyalar/       # Dosya yönetimi
│   ├── hesaplama/      # Hesaplama araçları
│   └── api/            # API routes
├── components/ui/      # shadcn/ui bileşenleri
├── lib/
│   ├── supabase/       # Supabase client/server
│   └── calculators/    # Hesaplama fonksiyonları
└── middleware.ts       # Auth middleware
```

## Veritabanı Şeması

- **clients**: Müvekkil bilgileri
- **cases**: Dava dosyaları
- **documents**: Yüklenen belgeler
- **calculations**: Hesaplama sonuçları

## Deployment

Vercel'e deploy etmek için:

1. Kodu GitHub'a push edin
2. Vercel'de projeyi import edin
3. Environment değişkenlerini Vercel'de ayarlayın
4. Supabase Auth ayarlarında Vercel domainini ekleyin