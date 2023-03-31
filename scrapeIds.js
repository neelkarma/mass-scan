import { writeFile } from "fs/promises";
import puppeteer from "puppeteer";

const wait = (duration) => new Promise((r) => setTimeout(r, duration));

const SCROLL_SELECTOR = ".zQTmif";
const ROW_SELECTOR = ".zYQnTe";
const NAME_SELECTOR = ".PDfZbf";
const EMAIL_SELECTOR = ".hUL4le";
const EMAIL_REGEX = "\\d{9}@student\\.sbhs\\.nsw\\.edu\\.au";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://contacts.google.com/u/1/directory");

  console.log(
    "Sign in with your id@student.sbhs.nsw.edu.au email. You have 2 minutes."
  );
  await page.waitForSelector(NAME_SELECTOR, { timeout: 120000 });

  console.log("Signed in successfully! Scraping (this might take a while)...");

  const students = {};
  let staleCount = 0;

  while (true) {
    let stale = true;

    const entries = await page.$$eval(
      ROW_SELECTOR,
      (rows, nameSelector, emailSelector, emailRegex) =>
        rows
          .filter((row) =>
            new RegExp(emailRegex).test(
              row.querySelector(emailSelector).textContent
            )
          )
          .map((row) => {
            const id = row.querySelector(emailSelector).textContent.slice(0, 9);
            const name = row.querySelector(nameSelector).textContent;
            return [id, name];
          }),
      NAME_SELECTOR,
      EMAIL_SELECTOR,
      EMAIL_REGEX
    );

    for (const [id, name] of entries) {
      if (!(id in students)) {
        stale = false;
        console.log(name, id);
      }

      students[id] = name;
    }

    if (stale) {
      if (staleCount > 10) {
        break;
      }
      staleCount += 1;
      await wait(300);
      continue;
    }

    staleCount = 0;

    await page.evaluate((scrollSelector) => {
      const scrollArea = document.querySelector(scrollSelector);
      scrollArea.scrollBy(0, window.innerHeight);
    }, SCROLL_SELECTOR);
  }

  browser.close();

  console.log("Scrape complete!");
  await writeFile("students.json", JSON.stringify(students));
  console.log("Output written to students.json.");
})();
