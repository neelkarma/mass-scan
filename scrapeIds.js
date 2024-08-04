// paste the following code into the console when on the directory page in your SBHS account Google Contacts and hit enter.
// if you are blocked from pasting, type "allow pasting" and hit enter, and then try again.

(async () => {
  const SCROLL_SELECTOR = ".My2mLb";
  const ROW_SELECTOR = ".aH18yc";
  const NAME_SELECTOR = ".AYDrSb";
  const EMAIL_SELECTOR = ".W7Nbnf";
  const EMAIL_REGEX = /\d{9}@student\.sbhs\.nsw\.edu\.au/;

  if (window.scrapeController) {
    console.log(
      "%cAnother instance of this script is already runing. Please refresh the page to stop the existing one first.",
      "color: #ff0000;",
    );
    return;
  }

  console.log("%cmass-scan", "font-weight: bold; font-size: 2em;");
  console.log("%cCrafted with ❤️ by iamkneel", "font-style: italic;");
  console.log(
    "This will take a bit. Please do not close this tab or hide it in any way while scrape is in progress.",
  );
  console.log(
    "IMPORTANT: If the page starts scrolling beyond rows that haven't loaded yet, try your best to keep it from scrolling further until the rows have loaded!",
  );

  window.scrapeController = new AbortController();

  const scrollEls = document.querySelectorAll(SCROLL_SELECTOR);
  const scrollEl = scrollEls[scrollEls.length - 1];
  scrollEl.scrollTo({ top: 0 });

  const scraped = {};

  const scrollEnd = () =>
    scrollEl.scrollHeight - scrollEl.scrollTop - scrollEl.clientHeight < 1;

  while (!window.scrapeController.signal.aborted && !scrollEnd()) {
    const rows = document.querySelectorAll(ROW_SELECTOR);
    for (const row of rows) {
      const name = row.querySelector(NAME_SELECTOR).textContent;
      const email = row.querySelector(EMAIL_SELECTOR).textContent;
      if (!EMAIL_REGEX.test(email)) continue;
      const id = email.slice(0, 9);
      if (!(id in scraped)) {
        scraped[id] = name;
      }
    }

    scrollEl.scrollBy({ top: scrollEl.clientHeight / 2 });

    await new Promise((r) => setTimeout(r, 200));
  }

  const scrapedJson = JSON.stringify(scraped);
  console.log(scrapedJson);
  try {
    await navigator.clipboard.writeText(scrapedJson);
    console.log(
      "%cDone! The scraping output has been printed above and copied to your clipboard.",
      "color: #00ff00;",
    );
  } catch {
    console.log(
      "%cDone! The scraping output has been printed above.",
      "color: #00ff00;",
    );
  }

  delete window.scrapeController;
})();
