-- Columna para foto de asistencia
ALTER TABLE attendances ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Bucket público para fotos de asistencia
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'attendance-photos',
  'attendance-photos',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: miembro puede subir su propia foto
CREATE POLICY "attendance_photos_insert" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'attendance-photos' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: fotos públicas para lectura
CREATE POLICY "attendance_photos_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'attendance-photos');
