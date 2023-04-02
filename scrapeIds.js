import { writeFile } from "fs/promises";
import ora from "ora";
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

  console.log(
    "\nSigned in successfully! Scraping (this might take a while)..."
  );

  const students = {};
  let finalWaitCount = 0;

  const spinner = ora().start();
  spinner.text = "0 entries scraped (0% complete)";

  while (true) {
    // This calculates the scroll progress from 0 to 1
    const scrollProgress = await page.evaluate((scrollSelector) => {
      const scrollEl = document.querySelector(scrollSelector);
      return (
        scrollEl.scrollTop / (scrollEl.scrollHeight - scrollEl.clientHeight)
      );
    }, SCROLL_SELECTOR);

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
      }
    }

    // If no new IDs were found
    if (stale) {
      // If we've reached the bottom
      if (scrollProgress === 1) {
        // We still try a few more times in case the final rows haven't loaded yet
        if (finalWaitCount == RETRY_LIMIT) {
          break;
        }
        finalWaitCount += 1;
      }

      await wait(300);
      continue;
    }

    // Update spinner text
    spinner.text = `${
      Object.keys(students).length
    } entries scraped (${Math.round(scrollProgress * 100)}% complete)`;

    // Scroll the page down
    await page.evaluate((scrollSelector) => {
      const scrollEl = document.querySelector(scrollSelector);
      scrollEl.scrollBy(0, scrollEl.clientHeight);
    }, SCROLL_SELECTOR);
  }

  browser.close();
  spinner.succeed();

  console.log(`\nScraped ${Object.keys(students).length} entries!`);
  await writeFile("students.json", JSON.stringify(students));
  console.log("Output written to students.json.");
})();
