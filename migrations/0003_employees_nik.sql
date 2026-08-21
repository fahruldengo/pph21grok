create unique index if not exists employees_user_nik_uidx
  on employees (user_id, nik)
  where nik <> '';
