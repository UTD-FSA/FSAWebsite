alter table public.members
  add column shirt_size text
  check (shirt_size in ('S', 'M', 'L', 'XL'));
