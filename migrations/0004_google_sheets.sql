create table if not exists google_sheet_links (
  user_id text primary key,
  spreadsheet_id text not null default '',
  title text not null default '',
  url text not null default '',
  api_key text not null default '',
  client_id text not null default '',
  last_synced_at timestamptz,
  updated_at timestamptz not null default now()
);
