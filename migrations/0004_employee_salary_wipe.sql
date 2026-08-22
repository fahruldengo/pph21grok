alter table employees add column if not exists gaji numeric not null default 0;
alter table employees add column if not exists tunjangan numeric not null default 0;

delete from payroll_lines;
delete from employees;
