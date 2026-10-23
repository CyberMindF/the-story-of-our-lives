ALTER TABLE love_counter_episodes ADD COLUMN psychologist_comment TEXT NOT NULL DEFAULT ''
  CHECK (length(psychologist_comment) <= 2000);
