import { existsSync, rmSync } from "fs";

let cleaned = false;

if (existsSync("barcodes/")) {
  console.log("Deleting barcodes folder...");
  rmSync("barcodes/", { recursive: true });
  cleaned = true;
}

if (existsSync("photos/")) {
  console.log("Deleting photos folder...");
  rmSync("photos/", { recursive: true });
  cleaned = true;
}

if (cleaned) {
  console.log("Done!");
} else {
  console.log("Nothing to clean.");
}
