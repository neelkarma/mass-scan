import { existsSync, rmSync } from "fs";

if (existsSync("barcodes/")) rmSync("barcodes/", { recursive: true });
if (existsSync("students.json")) rmSync("students.json");
