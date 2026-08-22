# Pajak21

Sistem perhitungan **PPh Pasal 21** (TER, PP 58/2023) yang meniru struktur dan rumus workbook Excel *Perhitungan PPh Pasal 21 Tahun 2026*.

**Aplikasi:** [fahruldengo.github.io/pph21grok](https://fahruldengo.github.io/pph21grok/) — daftar akun lalu pakai spreadsheet, kalkulator, dan bukti potong. Di GitHub Pages data tersimpan di browser (localStorage).

Buku kerja spreadsheet — TER A/B/C, gross-up, BPJS, rekonsiliasi Desember (Pasal 17), bukti potong, dan ringkasan setahun — tersimpan per akun.

## Menu

| Folder | Sheet Excel | Fungsi |
| --- | --- | --- |
| `/` | UTAMA | Ringkasan pemotongan tahun berjalan |
| `/pemotong` | PEMOTONG | Identitas pemberi kerja & penanda tangan |
| `/elemen` | ELEMEN PPh 21 | Tarif premi BPJS (JKK, JKM, JHT, JP, Kes) |
| `/karyawan` | DATA PEGAWAI | Master karyawan, PTKP, gaji pokok, tunjangan |
| `/penghasilan` | JAN–DES | Gaji per tahun & bulan, tampil 5–100 baris |
| `/spreadsheet` | seluruh tab | Buku kerja dengan tab bulan |
| `/kalkulator` | KALKULATOR PPH 21 | Hitung seorang karyawan (ROUNDDOWN) |
| `/tahunan` | TAHUNAN / DES | Pasal 17, biaya jabatan, kurang/lebih bayar |
| `/summary` | SUMMARY | Pemotongan bruto & PPh setahun |
| `/bukti-potong` | FORMAT BPMP / A1 / 1721-VII | Pratinjau bukti potong |
| `/non-pegawai` | BP21 NON PEGAWAI TETAP | Honor, jasa, harian, pesangon |
| `/referensi` | TER, T-PTKP, REF | Tabel tarif resmi |

## Login

Masuk dengan Google, X, atau email & kata sandi. Data perusahaan, karyawan, dan payroll bersifat per pengguna.

Akun baru mendapat identitas perusahaan **CV. Vidya Amaliah** dan tarif BPJS, tanpa data karyawan. Gaji tersimpan per tahun pajak (2020–2040+) sehingga buku kerja bisa dipakai jangka panjang. Tabel punya filter tampilan 5 / 10 / 25 / 50 / 100 baris.

## Rumus (sumber kebenaran: Excel)

- **TER bulanan** sesuai status PTKP (A / B / C) — PP 58/2023
- Premi pemberi kerja JKK, JKM, BPJS Kesehatan **menambah bruto**
- JHT & JP karyawan **mengurangi** penghasilan neto pada hitungan tahunan
- Gross-up: tunjangan PPh diiterasi sampai konvergen
- Sheet bulanan memakai `ROUND`; kalkulator memakai `ROUNDDOWN` (sama seperti workbook)
- Desember / A1: biaya jabatan 5% (maks. Rp500.000/bulan), PTKP, PKP dibulatkan ribuan ke bawah, tarif Pasal 17
