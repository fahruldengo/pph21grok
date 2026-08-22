import type { Employee } from "./types";

export function inWorkMonth(emp: Employee, bulan: number) {
  return bulan >= emp.bulanMulai && bulan <= emp.bulanAkhir;
}

export function canAddSalary(emp: Employee, bulan: number) {
  return emp.aktif && inWorkMonth(emp, bulan);
}

export function showInPayrollRecap(emp: Employee, bulan: number) {
  return inWorkMonth(emp, bulan);
}
