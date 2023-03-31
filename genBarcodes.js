import { createCanvas } from "canvas";
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import JsBarcode from "jsbarcode";

// Exit if students.json not found
if (!existsSync("students.json")) {
  console.error(
    "students.json not found - have you run the scrapeIds.js script?"
  );
  process.exit(1);
}

const students = JSON.parse(readFileSync("students.json"));

if (!existsSync("barcodes/")) mkdirSync("barcodes");

const canvas = createCanvas();

(async () => {
  console.log(
    "Generating barcodes (this shouldn't take more than 1 minute)..."
  );
  for (const [id, name] of Object.entries(students)) {
    JsBarcode(canvas, id, { format: "code128" });
    const out = createWriteStream(`barcodes/${name} ${id}.jpg`);
    const stream = canvas.createJPEGStream();
    stream.pipe(out);

    // This essentially blocks the thread until the current barcode has finished saving.
    await new Promise((r) => out.on("finish", r));
  }
  console.log("Done! The barcodes are saved in the `barcodes` folder.");
})();
