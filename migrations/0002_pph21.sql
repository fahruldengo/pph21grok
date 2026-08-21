create table if not exists companies (
  id serial primary key,
  user_id text not null unique,
  nama text not null default '',
  npwp text not null default '',
  alamat text not null default '',
  kota text not null default '',
  nitku text not null default '',
  nama_pemotong text not null default '',
  npwp_pemotong text not null default '',
  tahun_pajak integer not null default 2026,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists tax_elements (
  user_id text primary key,
  jht_employer numeric not null default 0.037,
  jkk_employer numeric not null default 0.0024,
  jkm_employer numeric not null default 0.003,
  jp_employer numeric not null default 0.02,
  kes_employer numeric not null default 0.04,
  jht_employee numeric not null default 0.02,
  jp_employee numeric not null default 0.01,
  kes_employee numeric not null default 0.01,
  jp_max numeric not null default 10042300,
  kes_max numeric not null default 12000000,
  jht_employer_add_bruto boolean not null default false,
  jp_employer_add_bruto boolean not null default false,
  updated_at timestamptz not null default now()
);

create table if not exists employees (
  id serial primary key,
  user_id text not null,
  nama text not null,
  jenis_kelamin text not null default 'LAKI-LAKI',
  jabatan text not null default '',
  nik text not null default '',
  npwp text not null default '',
  punya_npwp boolean not null default true,
  kode_objek_pajak text not null default '21-100-01',
  ptkp text not null default 'TK/0',
  alamat text not null default '',
  karyawan_asing boolean not null default false,
  negara text not null default 'Indonesia',
  kode_negara text not null default 'IDN',
  bulan_mulai integer not null default 1,
  bulan_akhir integer not null default 12,
  gross_up boolean not null default true,
  aktif boolean not null default true,
  created_at timestamptz not null default now()
);
create index if not exists employees_user_id_idx on employees (user_id);

create table if not exists payroll_lines (
  id serial primary key,
  user_id text not null,
  employee_id integer not null references employees(id) on delete cascade,
  tahun integer not null,
  bulan integer not null,
  gaji numeric not null default 0,
  tunjangan numeric not null default 0,
  honorarium numeric not null default 0,
  uang_makan numeric not null default 0,
  uang_lembur numeric not null default 0,
  penghasilan_lain numeric not null default 0,
  natura numeric not null default 0,
  bonus numeric not null default 0,
  thr numeric not null default 0,
  tantiem numeric not null default 0,
  zakat numeric not null default 0,
  tanggal_pemotongan date,
  fasilitas_pajak text not null default 'Tanpa Fasilitas',
  unique (user_id, employee_id, tahun, bulan)
);
create index if not exists payroll_lines_user_month_idx on payroll_lines (user_id, tahun, bulan);

create table if not exists non_permanent (
  id serial primary key,
  user_id text not null,
  masa integer not null default 12,
  tahun integer not null default 2026,
  nama text not null,
  nik text not null default '',
  ptkp text not null default 'TK/0',
  kode_objek_pajak text not null default '21-100-20',
  penghasilan numeric not null default 0,
  jenis_dokumen text not null default 'Contract',
  nomor_dokumen text not null default '',
  tanggal_dokumen date,
  tanggal_pemotongan date,
  fasilitas_pajak text not null default 'Tanpa Fasilitas',
  created_at timestamptz not null default now()
);
create index if not exists non_permanent_user_id_idx on non_permanent (user_id);
