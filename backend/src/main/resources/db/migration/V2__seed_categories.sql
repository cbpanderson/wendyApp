-- V2__seed_categories.sql
-- Seeds the v1 preset category list defined by the product team.
-- Idempotent: re-running won't duplicate (slugs are unique).

INSERT INTO categories (name, slug, active) VALUES
  ('Home & Garden',     'home-garden',     TRUE),
  ('Lawn Care',         'lawn-care',       TRUE),
  ('Handyman',          'handyman',        TRUE),
  ('Yard Tools',        'yard-tools',      TRUE),
  ('Fresh Eggs',        'fresh-eggs',      TRUE),
  ('Produce',           'produce',         TRUE),
  ('Baked Goods',       'baked-goods',     TRUE),
  ('Preserves',         'preserves',       TRUE),
  ('Honey',             'honey',           TRUE),
  ('Firewood',          'firewood',        TRUE),
  ('Childcare',         'childcare',       TRUE),
  ('Tutoring',          'tutoring',        TRUE),
  ('Pet Sitting',       'pet-sitting',     TRUE),
  ('Dog Walking',       'dog-walking',     TRUE),
  ('Haircuts',          'haircuts',        TRUE),
  ('Sewing & Mending',  'sewing-mending',  TRUE),
  ('Carpentry',         'carpentry',       TRUE),
  ('Auto Help',         'auto-help',       TRUE),
  ('Tech Help',         'tech-help',       TRUE),
  ('Lessons (Music)',   'lessons-music',   TRUE),
  ('Lessons (Art)',     'lessons-art',     TRUE),
  ('Lessons (Other)',   'lessons-other',   TRUE),
  ('Cooking',           'cooking',         TRUE),
  ('Cleaning',          'cleaning',        TRUE),
  ('Moving Help',       'moving-help',     TRUE),
  ('Crafts',            'crafts',          TRUE),
  ('Other Goods',       'other-goods',     TRUE),
  ('Other Services',    'other-services',  TRUE)
ON CONFLICT (slug) DO NOTHING;
