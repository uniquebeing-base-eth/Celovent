-- Profiles: AI quota + sub expiry
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS ai_uses_remaining integer NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS purple_tick_expires_at timestamptz;

-- Memes
CREATE TABLE IF NOT EXISTS public.memes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_wallet text NOT NULL,
  image_url text NOT NULL,
  caption text NOT NULL DEFAULT '',
  tags text[] NOT NULL DEFAULT '{}',
  parent_id uuid REFERENCES public.memes(id) ON DELETE SET NULL,
  ai_generated boolean NOT NULL DEFAULT false,
  likes_count integer NOT NULL DEFAULT 0,
  remix_count integer NOT NULL DEFAULT 0,
  tips_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_memes_created ON public.memes (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memes_creator ON public.memes (creator_wallet);
ALTER TABLE public.memes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "memes public read" ON public.memes FOR SELECT USING (true);

-- Tips
CREATE TABLE IF NOT EXISTS public.meme_tips (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id uuid NOT NULL REFERENCES public.memes(id) ON DELETE CASCADE,
  from_wallet text NOT NULL,
  to_wallet text NOT NULL,
  amount_cusd numeric NOT NULL,
  tx_hash text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_tips_meme ON public.meme_tips (meme_id);
ALTER TABLE public.meme_tips ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tips public read" ON public.meme_tips FOR SELECT USING (true);

-- Subscriptions
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  plan text NOT NULL,
  amount_cusd numeric NOT NULL,
  tx_hash text NOT NULL UNIQUE,
  starts_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_subs_wallet ON public.subscriptions (wallet_address);
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "subs public read" ON public.subscriptions FOR SELECT USING (true);

-- Storage bucket for meme images
INSERT INTO storage.buckets (id, name, public)
  VALUES ('memes', 'memes', true)
  ON CONFLICT (id) DO NOTHING;

CREATE POLICY "memes bucket public read"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'memes');