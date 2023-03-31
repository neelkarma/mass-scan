import { writeFile } from "fs/promises";
import puppeteer from "puppeteer";

const wait = (duration) => new Promise((r) => setTimeout(r, duration));

const RETRY_LIMIT = 10;
const SCROLL_SELECTOR = ".zQTmif";
const ROW_SELECTOR = ".zYQnTe";
const NAME_SELECTOR = ".PDfZbf";
const EMAIL_SELECTOR = ".hUL4le";

// You can't use a RegExp object here since Puppeteer converts it to a string when its sent to the browser
const EMAIL_REGEX = "\\d{9}@student\\.sbhs\\.nsw\\.edu\\.au";

(async () => {
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();

  await page.goto("https://contacts.google.com/u/1/directory");

  console.log(
    "Sign in with your id@student.sbhs.nsw.edu.au email. You have 2 minutes."
  );

  // Waits until a selector from the directory page is found.
  await page.waitForSelector(ROW_SELECTOR, { timeout: 120000 });

  console.log("Signed in successfully! Scraping (this might take a while)...");

  const students = {};
  let staleCount = 0;

  while (true) {
    let stale = true;

    const entries = await page.$$eval(
      ROW_SELECTOR,
      (rows, nameSelector, emailSelector, emailRegex) => {
        const regex = new RegExp(emailRegex);

        return rows
          .filter((row) =>
            // Filter based on student email pattern
            regex.test(row.querySelector(emailSelector).textContent)
          )
          .map((row) => {
            // Extract id and name from row
            const id = row.querySelector(emailSelector).textContent.slice(0, 9);
            const name = row.querySelector(nameSelector).textContent;
            return [id, name];
          });
      },
      NAME_SELECTOR,
      EMAIL_SELECTOR,
      EMAIL_REGEX
    );

    // Add new entries into students object
    for (const [id, name] of entries) {
      if (!(id in students)) {
        stale = false;
        students[id] = name;
        console.log(name, id);
      }
    }

    // If no new IDs were found
    if (stale) {
      // If this limit is reached, the program ends
      if (staleCount > RETRY_LIMIT) {
        break;
      }

      // Wait 300ms for new rows to load before trying again
      staleCount += 1;
      await wait(300);
      continue;
    }

    // Reset stale counter
    staleCount = 0;

    // Scroll the page down
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
