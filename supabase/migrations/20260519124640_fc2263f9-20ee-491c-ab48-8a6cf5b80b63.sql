
-- 1. Extend memes
ALTER TABLE public.memes
  ADD COLUMN IF NOT EXISTS manual_upload BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS allow_remixing BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS tipping_enabled BOOLEAN NOT NULL DEFAULT true;

-- 2. Likes
CREATE TABLE IF NOT EXISTS public.meme_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id UUID NOT NULL,
  wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meme_id, wallet)
);
ALTER TABLE public.meme_likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "likes public read" ON public.meme_likes FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_meme_likes_wallet ON public.meme_likes(wallet);
CREATE INDEX IF NOT EXISTS idx_meme_likes_meme ON public.meme_likes(meme_id);

-- 3. Saves
CREATE TABLE IF NOT EXISTS public.meme_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meme_id UUID NOT NULL,
  wallet TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (meme_id, wallet)
);
ALTER TABLE public.meme_saves ENABLE ROW LEVEL SECURITY;
CREATE POLICY "saves public read" ON public.meme_saves FOR SELECT USING (true);

-- 4. MemeBox openings
CREATE TABLE IF NOT EXISTS public.meme_box_openings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  box_type TEXT NOT NULL,
  price_cusd NUMERIC NOT NULL,
  tx_hash TEXT NOT NULL UNIQUE,
  reward_type TEXT NOT NULL,  -- 'purple_tick_days' | 'ai_uses' | 'collectible' | 'cusd_bonus'
  reward_value TEXT NOT NULL,
  reward_label TEXT NOT NULL,
  reward_emoji TEXT NOT NULL DEFAULT '🎁',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.meme_box_openings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "boxes public read" ON public.meme_box_openings FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_boxes_wallet ON public.meme_box_openings(wallet);

-- 5. Notifications (simple inbox)
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet TEXT NOT NULL,
  kind TEXT NOT NULL,
  body TEXT NOT NULL,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications public read" ON public.notifications FOR SELECT USING (true);
CREATE INDEX IF NOT EXISTS idx_notifications_wallet ON public.notifications(wallet, created_at DESC);
