import { writeFile } from "fs/promises";
import inquirer from "inquirer";
import ora from "ora";
import puppeteer from "puppeteer";

const wait = (duration) => new Promise((r) => setTimeout(r, duration));

const hideId = process.argv.includes("--hide-id");
const isDebug = process.argv.includes("--debug");
const noHeadless = process.argv.includes("--no-headless") || isDebug;

const GAC_EMAIL_SELECTOR = "#identifierId";

const SBHS_ID_SELECTOR = "#fld-username-fld";
const SBHS_PWD_SELECTOR = "#fld-password-fld";

const SCROLL_SELECTOR = ".zQTmif";
const ROW_SELECTOR = ".zYQnTe";
const NAME_SELECTOR = ".PDfZbf";
const EMAIL_SELECTOR = ".hUL4le";

const RETRY_LIMIT = 10;

// You can't use a RegExp object here since Puppeteer converts it to a string when its sent to the browser
const EMAIL_REGEX = "\\d{9}@student\\.sbhs\\.nsw\\.edu\\.au";

(async () => {
  // Get user input
  const { id, pwd } = await inquirer.prompt([
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

  const spinner = ora().start();
  spinner.text = "Launching Puppeteer...";

  const browser = await puppeteer.launch({ headless: !noHeadless });
  const page = await browser.newPage();

  if (isDebug) page.on("console", (e) => console.log(`[CONSOLE] ${e.text()}`));

  spinner.text = "Loading Google Contacts login page...";

  await page.goto("https://contacts.google.com/u/1/directory");

  // Google Account sign in
  await page.waitForSelector(GAC_EMAIL_SELECTOR);
  spinner.text = "Entering SBHS Google Account email...";
  await page.type(GAC_EMAIL_SELECTOR, id + "@student.sbhs.nsw.edu.au");
  await page.keyboard.press("Enter");

  spinner.text = "Loading SBHS Portal login page...";

  // Student Portal sign in
  await page.waitForSelector(SBHS_ID_SELECTOR);
  await wait(500); // This is because the focus shifts in the first 500ms for some reason

  spinner.text = "Authenticating with SBHS Student Portal...";

  await page.type(SBHS_ID_SELECTOR, id);
  await page.type(SBHS_PWD_SELECTOR, pwd);
  await page.keyboard.press("Enter");

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
