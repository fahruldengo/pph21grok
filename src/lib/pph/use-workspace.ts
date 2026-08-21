import { useQuery } from "@tanstack/react-query";
import { getWorkspace, listAllPayroll, listPayroll } from "@/lib/server/pph";

export function useWorkspace() {
  return useQuery({
    queryKey: ["workspace"],
    queryFn: () => getWorkspace(),
  });
}

export function usePayroll(tahun: number, bulan: number) {
  return useQuery({
    queryKey: ["payroll", tahun, bulan],
    queryFn: () => listPayroll({ data: { tahun, bulan } }),
  });
}

export function useYearPayroll(tahun: number) {
  return useQuery({
    queryKey: ["payroll-year", tahun],
    queryFn: () => listAllPayroll({ data: { tahun } }),
  });
}
