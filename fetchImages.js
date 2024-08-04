import { createWriteStream, existsSync, mkdirSync, readFileSync } from "fs";
import inquirer from "inquirer";
import puppeteer from "puppeteer";
import ora from "ora";
import { Readable } from "stream";
import { finished } from "stream/promises";

export const querySBHSCredentials = () => {
  const hideId = process.argv.includes("--hide-id");
  return inquirer.prompt([
    {
      type: hideId ? "password" : "input",
      name: "id",
      message: "Enter your SBHS student ID: ",
      validate: (id) => id.length === 9 && !isNaN(Number(id)),
    },
    {
      type: "password",
      name: "pwd",
      message: "Enter your SBHS password: ",
    },
  ]);
};

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
    "students.json not found. Please run the `scrapeIds` script in the browser and then paste the output into a students.json file.",
  );
  process.exit(1);
}

const students = JSON.parse(readFileSync("students.json"));

(async () => {
  const { id, pwd } = await querySBHSCredentials();

  const spinner = ora().start();
  spinner.text = "Launching Puppeteer...";

  const browser = await puppeteer.launch({
    headless: !process.argv.includes("--no-headless"),
  });
  const page = await browser.newPage();

  spinner.text = "Authenticating with SBHS Student Portal...";

  await page.goto("https://student.sbhs.net.au/", { waitUntil: "load" });
  await page.keyboard.type(id);
  await page.keyboard.press("Tab");
  await page.keyboard.type(pwd);
  await page.keyboard.press("Enter");

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
        },
      );

      const blob = await res.blob();
      // This skips doodoo images
      if ([0, 846, 1177].includes(blob.size)) {
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
    `${done} photos have been successfully downloaded into the \`photos\` folder!`,
  );
})();
