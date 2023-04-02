import { existsSync, rmSync } from "fs";

let cleaned = false;

if (existsSync("barcodes/")) {
  console.log("Deleting barcodes folder...");
  rmSync("barcodes/", { recursive: true });
  cleaned = true;
}

if (existsSync("students.json")) {
  console.log("Deleting students.json...");
  rmSync("students.json");
  cleaned = true;
}

if (cleaned) {
  console.log("Done!");
} else {
  console.log("Nothing to clean.");
}
