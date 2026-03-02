PGPASSWORD=XWwU4VCusMQuuRbS pg_dump \
  -h db.khsapythnppdplqnlmkj.supabase.co \
  -U postgres \
  -p 5432 \
  -d postgres \
  --format=custom \
  --no-owner \
  --no-acl \
  -f supabase_dump.backup


pg_restore \
  -h localhost \
  -U postgres \
  -d supabase_clone \
  --clean \
  --if-exists \
  --no-owner \
  --no-acl \
  supabase_dump.backup
