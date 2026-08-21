import { chromium } from "playwright";
import { mkdirSync } from "node:fs";

mkdirSync("/workspace/screenshots", { recursive: true });
const browser = await chromium.launch({ args: ["--no-sandbox"] });
const page = await browser.newPage({ viewport: { width: 1400, height: 900 } });
const errors = [];
page.on("pageerror", (e) => {
  errors.push(e.message);
  console.log("PAGEERROR", e.message);
});
page.on("console", (m) => {
  if (m.type() === "error") {
    errors.push(m.text());
    console.log("CONSOLE", m.text());
  }
});

await page.goto("http://127.0.0.1:8080/login", { waitUntil: "networkidle" });
await page.getByRole("button", { name: "daftar" }).click();
const email = `demo${Date.now()}@pajak21.test`;
await page.locator('input[type="email"]').fill(email);
await page.locator('input[type="password"]').fill("Pajak21!pass");
const nameInput = page.locator("label").filter({ hasText: /^Nama$/ }).locator("xpath=following::input[1]");
if (await nameInput.count()) await nameInput.fill("Admin Demo");
await page.getByRole("button", { name: "Buat akun" }).click();

await page.waitForURL((url) => url.pathname === "/", { timeout: 30_000 }).catch(() => {});
await page.getByText("Karyawan aktif", { timeout: 30_000 }).waitFor();
await page.waitForTimeout(2500);
await page.screenshot({ path: "/workspace/screenshots/dashboard.png", fullPage: true });
const dash = await page.locator("body").innerText();
console.log("after signup url", page.url());
console.log("dashboard text", dash.slice(0, 800));
const empMatch = dash.match(/Karyawan aktif\s+(\d+)/);
console.log("employee count", empMatch?.[1] ?? "missing");

for (const path of [
  "/penghasilan",
  "/kalkulator",
  "/karyawan",
  "/pemotong",
  "/elemen",
  "/tahunan",
  "/summary",
  "/bukti-potong",
  "/non-pegawai",
  "/referensi",
  "/spreadsheet",
  "/google-sheets",
]) {
  await page.goto(`http://127.0.0.1:8080${path}`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const name = path.slice(1) || "home";
  await page.screenshot({ path: `/workspace/screenshots/${name}.png`, fullPage: true });
  const t = await page.locator("body").innerText();
  console.log(path, t.replace(/\s+/g, " ").slice(0, 280));
}

console.log("errors", errors);
await browser.close();
console.log("done", email);
