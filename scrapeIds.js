import { writeFile } from "fs/promises";
import ora from "ora";
import {
  authenticateSBHS,
  launchPuppeteer,
  querySBHSCredentials,
  wait,
} from "./common.js";

const GAC_EMAIL_SELECTOR = "#identifierId";

const SCROLL_SELECTOR = ".zQTmif";
const ROW_SELECTOR = ".zYQnTe";
const NAME_SELECTOR = ".PDfZbf";
const EMAIL_SELECTOR = ".hUL4le";

const RETRY_LIMIT = 10;

// You can't use a RegExp object here since Puppeteer converts it to a string when its sent to the browser
const EMAIL_REGEX = "\\d{9}@student\\.sbhs\\.nsw\\.edu\\.au";

(async () => {
  // Get user input
  const { id, pwd } = await querySBHSCredentials();

  const spinner = ora().start();
  spinner.text = "Launching Puppeteer...";

  const [browser, page] = await launchPuppeteer();

  spinner.text = "Loading Google Contacts login page...";

  await page.goto("https://contacts.google.com/u/1/directory");

  // Google Account sign in
  await page.waitForSelector(GAC_EMAIL_SELECTOR);
  spinner.text = "Entering SBHS Google Account email...";
  await page.type(GAC_EMAIL_SELECTOR, id + "@student.sbhs.nsw.edu.au");
  await page.keyboard.press("Enter");

  spinner.text = "Authenticating with SBHS Student Portal...";

  // Student Portal sign in
  await authenticateSBHS(page, { id, pwd });

  spinner.text = "Loading Google Contacts directory...";

  await page.waitForSelector(ROW_SELECTOR);

  const students = {};
  let finalWaitCount = 0;

  spinner.text = "Scraping... (0 entries scraped, 0% complete)";

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
    spinner.text = `Scraping... (${
      Object.keys(students).length
    } entries scraped, ${Math.round(scrollProgress * 100)}% complete)`;

    // Scroll the page down
    await page.evaluate((scrollSelector) => {
      const scrollEl = document.querySelector(scrollSelector);
      scrollEl.scrollBy(0, scrollEl.clientHeight);
    }, SCROLL_SELECTOR);
  }

  browser.close();

  spinner.succeed(`Scraped ${Object.keys(students).length} entries!`);
  await writeFile("students.json", JSON.stringify(students));
  console.log("Output written to students.json.");
})();
