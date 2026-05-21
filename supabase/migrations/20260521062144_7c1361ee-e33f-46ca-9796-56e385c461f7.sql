
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique_ci ON public.profiles (lower(username));

CREATE TABLE IF NOT EXISTS public.follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_wallet text NOT NULL,
  followee_wallet text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (follower_wallet, followee_wallet),
  CHECK (follower_wallet <> followee_wallet)
);

ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "follows public read" ON public.follows FOR SELECT USING (true);

CREATE INDEX IF NOT EXISTS follows_follower_idx ON public.follows (follower_wallet);
CREATE INDEX IF NOT EXISTS follows_followee_idx ON public.follows (followee_wallet);
