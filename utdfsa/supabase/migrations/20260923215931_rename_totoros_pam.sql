-- pam renamed totoros → totaros (lib/constants.ts PAMILYA_OPTIONS); members.pamilya is free text,
-- so existing assignments must be rewritten or they fall out of the officer pam filter
update public.members set pamilya = 'Totaros' where pamilya = 'Totoros';
