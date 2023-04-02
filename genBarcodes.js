import { createCanvas } from "canvas";
import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import JsBarcode from "jsbarcode";
import ora from "ora";

// Exit if students.json not found
if (!existsSync("students.json")) {
  console.error(
    "students.json not found - have you run the scrapeIds.js script?"
  );
  process.exit(1);
}

const students = JSON.parse(readFileSync("students.json"));

console.log("Generating barcodes...");

if (!existsSync("barcodes/")) mkdirSync("barcodes");

const canvas = createCanvas();

const length = Object.keys(students).length;
let done = 0;

const spinner = ora().start();
spinner.text = `0/${length} generated (0%)`;

(async () => {
  for (const [id, name] of Object.entries(students)) {
    // Generate barcode
    JsBarcode(canvas, id, { format: "code128" });
    const out = createWriteStream(`barcodes/${name} ${id}.jpg`);
    const stream = canvas.createJPEGStream();
    stream.pipe(out);

    // This essentially blocks the thread until the current barcode has finished saving.
    await new Promise((r) => out.on("finish", r));

    // Update spinner text
    done += 1;
    spinner.text = `${done}/${length} generated (${Math.round(
      (done / length) * 100
    )}%)`;
  }

  spinner.succeed();

  console.log("Done! The barcodes are saved in the `barcodes` folder.");
})();
