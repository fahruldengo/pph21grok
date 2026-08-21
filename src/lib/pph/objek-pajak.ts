export type TarifKind = "TER" | "PS17" | "HARIAN" | "PESANGON" | "PENSIUN" | "FINAL";

export type ObjekPajak = {
  kode: string;
  nama: string;
  deemed: number;
  tarif: TarifKind | number;
  sifat: "Tidak Final" | "Final";
};

export const OBJEK_PAJAK: ObjekPajak[] = [
  {
    kode: "21-100-01",
    nama: "Penghasilan Pegawai Tetap",
    deemed: 100,
    tarif: "TER",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-35",
    nama: "Upah Pegawai Tidak Tetap yang Dibayarkan secara Bulanan",
    deemed: 100,
    tarif: "TER",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-10",
    nama: "Honorarium atau Imbalan kepada Anggota Dewan Komisaris atau Dewan Pengawas yang tidak merangkap sebagai Pegawai Tetap",
    deemed: 100,
    tarif: "TER",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-07",
    nama: "Imbalan kepada Tenaga Ahli (Pengacara, Akuntan, Arsitek, Dokter, Konsultan, Notaris, Penilai, dan Aktuaris)",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-18",
    nama: "Imbalan kepada Penasihat, Pengajar, Pelatih, Penceramah, Penyuluh, dan Moderator",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-19",
    nama: "Imbalan kepada Pengarang, Peneliti, Penerjemah",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-20",
    nama: "Imbalan kepada Pemberi Jasa dalam Segala Bidang",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-21",
    nama: "Imbalan kepada Agen Iklan",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-22",
    nama: "Imbalan kepada Pengawas atau Pengelola Proyek",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-23",
    nama: "Imbalan kepada Pembawa Pesanan atau yang Menemukan Langganan",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-06",
    nama: "Imbalan kepada Petugas Penjaja Barang Dagangan",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-05",
    nama: "Imbalan kepada Agen Asuransi",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-04",
    nama: "Imbalan kepada Distributor Perusahaan Pemasaran Berjenjang (MLM)",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-24",
    nama: "Upah Pegawai Tidak Tetap Harian / Mingguan / Satuan (TER Harian)",
    deemed: 100,
    tarif: "HARIAN",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-12",
    nama: "Uang Manfaat Pensiun atau Penghasilan Sejenis yang diambil sebagian",
    deemed: 100,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-14",
    nama: "Imbalan kepada Peserta Rapat, Konferensi, Sidang, Pertemuan",
    deemed: 100,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-15",
    nama: "Imbalan kepada Peserta atau Anggota dalam Suatu Kepanitiaan",
    deemed: 100,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-16",
    nama: "Imbalan kepada Peserta Pendidikan, Pelatihan, dan Magang",
    deemed: 100,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-17",
    nama: "Imbalan kepada Peserta Kegiatan Lainnya",
    deemed: 100,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-33",
    nama: "Imbalan kepada Pemain Musik, Pembawa Acara, Penyanyi, Pelawak, Bintang Film, Bintang Sinetron, Bintang Iklan, Sutradara, Kru Film, Foto Model, Peragawan/peragawati, Pemain Sirkus, dan sejenisnya",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-100-34",
    nama: "Imbalan yang Diterima oleh Olahragawan",
    deemed: 50,
    tarif: "PS17",
    sifat: "Tidak Final",
  },
  {
    kode: "21-401-01",
    nama: "Uang Pesangon yang Dibayarkan Sekaligus",
    deemed: 100,
    tarif: "PESANGON",
    sifat: "Final",
  },
  {
    kode: "21-401-02",
    nama: "Uang Manfaat Pensiun, THT, atau JHT yang Dibayarkan Sekaligus",
    deemed: 100,
    tarif: "PENSIUN",
    sifat: "Final",
  },
];

export function findObjek(kode: string): ObjekPajak | undefined {
  return OBJEK_PAJAK.find((o) => o.kode === kode);
}

export const FASILITAS_PAJAK = [
  { kode: "N/A", nama: "Tanpa Fasilitas" },
  { kode: "DTP", nama: "PPh Ditanggung Pemerintah (DTP)" },
  { kode: "TaxExAr21", nama: "Surat Keterangan Bebas (SKB)" },
  { kode: "ETC", nama: "Fasilitas Lainnya" },
] as const;
