import inquirer from "inquirer";
import puppeteer from "puppeteer";

export const wait = (duration) => new Promise((r) => setTimeout(r, duration));

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

export const authenticateSBHS = async (page, { id, pwd }) => {
  const SBHS_ID_SELECTOR = "#fld-username-fld";
  const SBHS_PWD_SELECTOR = "#fld-password-fld";

  await page.waitForSelector(SBHS_ID_SELECTOR);
  await wait(500); // This is because the focus shifts in the first 500ms for some reason

  await page.type(SBHS_ID_SELECTOR, id);
  await page.type(SBHS_PWD_SELECTOR, pwd);
  await page.keyboard.press("Enter");
};

export const launchPuppeteer = async () => {
  const isDebug = process.argv.includes("--debug");
  const noHeadless = process.argv.includes("--no-headless") || isDebug;

  const browser = await puppeteer.launch({
    headless: noHeadless ? false : "new",
  });

  const page = await browser.newPage();

  if (isDebug) page.on("console", (e) => console.log(`[CONSOLE] ${e.text()}`));

  return [browser, page];
};
