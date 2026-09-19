-- SnapFind AI — Initial Development Seed (Phase 2)
-- Sample seed data for photographers, events, and photos.

INSERT INTO photographers (id, studio_name, email, hashed_password, created_at, updated_at)
VALUES 
  ('p_001', 'Marlowe & Finch Photography', 'photographer@example.com', '$2b$12$e0lDqC7a/6v8y2J9XgqCwe7k5pX1k9kXwQe1r9uXwQe1r9uXwQe1r', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO events (id, photographer_id, name, date, status, total_searches, created_at, updated_at)
VALUES
  ('evt_1', 'p_001', 'Hartwell Autumn Wedding', '2026-09-12', 'active', 210, NOW(), NOW()),
  ('evt_2', 'p_001', 'Northline Product Launch', '2026-09-05', 'processing', 64, NOW(), NOW()),
  ('evt_3', 'p_001', 'Coastal Family Session', '2026-08-28', 'completed', 41, NOW(), NOW()),
  ('evt_4', 'p_001', 'Annual Gala 2026', '2026-08-14', 'completed', 588, NOW(), NOW()),
  ('evt_5', 'p_001', 'Riverside Vineyard Wedding', '2026-08-02', 'completed', 402, NOW(), NOW()),
  ('evt_6', 'p_001', 'Founder Headshots — Q3 batch', '2026-07-22', 'active', 12, NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

INSERT INTO photos (id, event_id, filename, url, thumbnail_url, created_at)
VALUES
  ('pho_1', 'evt_1', 'hartwell_001.jpg', 'https://images.unsplash.com/photo-1519741497674-611481863552', 'https://images.unsplash.com/photo-1519741497674-611481863552?w=300', NOW()),
  ('pho_2', 'evt_1', 'hartwell_002.jpg', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc', 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=300', NOW()),
  ('pho_3', 'evt_2', 'northline_001.jpg', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678', 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=300', NOW())
ON CONFLICT (id) DO NOTHING;
