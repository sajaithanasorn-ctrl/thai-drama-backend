-- Run this while connected to the "drama_db" database
CREATE TABLE IF NOT EXISTS
  dramas (
    id serial PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    channel VARCHAR(50),
    episodes INTEGER CHECK (episodes > 0),
    watched BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

-- (Optional) sample data
INSERT INTO
  dramas (title, channel)
VALUES
  ('บุพเพสันนิวาส', 'Channel 3'),
  ('พรหมลิขิต', 'Channel 3');
