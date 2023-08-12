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

console.log("Generating barcodes (this shouldn't take more than 1 minute)...");

if (!existsSync("barcodes/")) mkdirSync("barcodes");

const canvas = createCanvas();

await Promise.all(
  Object.entries(students).map(([id, name]) => {
    // Generate barcode
    JsBarcode(canvas, id, { format: "code128" });
    const out = createWriteStream(`barcodes/${name} ${id}.jpg`);
    const stream = canvas.createJPEGStream();
    stream.pipe(out);

    // promise resolves when barcode has finished writing
    return new Promise((r) => out.on("finish", r));
  })
);

console.log("Done! The barcodes are saved in the `barcodes` folder.");
