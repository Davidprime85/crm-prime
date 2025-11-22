-- Add read column to messages table
ALTER TABLE public.messages
ADD COLUMN IF NOT EXISTS read boolean DEFAULT false;
-- Update existing messages to read=true (optional, to start clean)
UPDATE public.messages
SET read = true;