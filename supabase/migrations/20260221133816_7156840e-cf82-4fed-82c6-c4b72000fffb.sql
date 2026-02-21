
INSERT INTO storage.buckets (id, name, public) VALUES ('lecture-uploads', 'lecture-uploads', true);

CREATE POLICY "Anyone can upload lecture files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'lecture-uploads');

CREATE POLICY "Anyone can read lecture files"
ON storage.objects FOR SELECT
USING (bucket_id = 'lecture-uploads');
