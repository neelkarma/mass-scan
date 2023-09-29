import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import ora from "ora";
import { Readable } from "stream";
import { finished } from "stream/promises";
import {
  authenticateSBHS,
  launchPuppeteer,
  querySBHSCredentials,
} from "./common.js";

export const interceptSBHSAuthCookie = async (page) => {
  const cdpSession = await page.target().createCDPSession();
  await cdpSession.send("Network.enable");

  return new Promise((res) => {
    cdpSession.on("Network.requestWillBeSentExtraInfo", (req) => {
      if (req.headers?.cookie) res(req.headers.cookie);
    });
  });
};

// Exit if students.json not found
if (!existsSync("students.json")) {
  console.error(
    "students.json not found - have you run the scrapeIds.js script?"
  );
  process.exit(1);
}

const students = JSON.parse(readFileSync("students.json"));
// const students = { 440805299: "Neel Sharma" };

(async () => {
  const { id, pwd } = await querySBHSCredentials();

  const spinner = ora().start();
  spinner.text = "Launching Puppeteer...";

  const [browser, page] = await launchPuppeteer();

  spinner.text = "Authenticating with SBHS Student Portal...";

  await page.goto("https://student.sbhs.net.au/");
  await authenticateSBHS(page, { id, pwd });

  const cookie = await interceptSBHSAuthCookie(page);

  await browser.close();

  spinner.text = `Downloading all photos... (0/${
    Object.keys(students).length
  }, 0 skipped)`;

  if (!existsSync("photos/")) mkdirSync("photos");

  let done = 0;
  let skipped = 0;

  const reqs = Object.entries(students).map(([id, name]) => async () => {
    try {
      const res = await fetch(
        `https://student.sbhs.net.au/shssupport/assets/images/imageproxy.php?studentid=${id}`,
        {
          headers: {
            cookie,
          },
        }
      );

      const blob = await res.blob();
      // This skips empty images
      if (blob.size === 695) {
        skipped += 1;
      } else {
        const stream = createWriteStream(`photos/${name} ${id}.jpg`);
        await finished(Readable.fromWeb(blob.stream()).pipe(stream));
        done += 1;
      }
    } catch (e) {
      skipped += 1;
    }
    spinner.text = `Downloading all photos... (${done}/${
      Object.keys(students).length - skipped
    }, ${skipped} skipped)`;
  });

  // batching 50 requests at a time makes it less error-prone
  while (reqs.length) {
    await Promise.all(reqs.splice(0, 50).map((f) => f()));
  }

  spinner.succeed(
    `${done} photos have been successfully downloaded into the \`photos\` folder!`
  );
})();
