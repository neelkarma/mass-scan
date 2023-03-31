# Mass Scan

> Create student IDs for the entirety of SBHS!

## Disclaimer

Use this for educational purposes only. I'll get in trouble if someone tries to
use this to scan in the entire school in at once or something stupid like that.

## Directions

_NOTE: This only works if you have a valid SBHS student email and password._

1. Clone this repo.
2. `pnpm i` - This might take a while as Puppeteer (the browser automation tool
   used) installs its own version of Chromium
3. `pnpm scrapeIds`
4. A browser window should pop up - follow the directions in the terminal.
5. After that's done, `pnpm genBarcodes`
6. Voila! All the barcodes should be in a new `barcodes` folder.
7. To delete all generated files, `pnpm clean`

## How it works

### `scrapeIds`

When running `scrapeIds`, the script scrapes the names and emails of every
student from the Google Contacts Directory listing for your school account. This
is important since every student's email is their student ID followed by
@student.sbhs.nsw.edu.au.

From the scraped emails, the IDs are extracted. Then, the IDs and their
associated names are stored in a JSON file (`students.json`).

### `genBarcodes`

The important thing to note is that the barcode on your student ID card is
_literally just your student ID encoded into a Code-128 barcode_. No hashing, no
salting, no nothing. It's just your student ID.

In fact, if you're a SBHS student, you can generating your own yourself by going
to a Code-128 barcode generator online (like
[this one](https://barcode.tec-it.com/en/Code128)) and entering your student ID
in. If you look closely, the generated barcode is the exactly the same as your
student ID barcode.

So, when you run `genBarcodes`, it looks at the `students.json` file generated
by `scrapeIds` and generates Code-128 barcodes for all of them, using the
student IDs scraped as the barcode's data and stores them in a `barcodes`
folder.

## Limitations

- Only works if you have a valid SBHS student email and password.
- Only associates full names with each student ID, and not other info such as
  roll class or year of graduation. In the case that there are two students that
  have the same name, the only way to differentiate between their barcodes will
  be their student ID.
