# Mass Scan

> Create student IDs for the entirety of SBHS!

[Demo on YouTube](https://youtu.be/-g9ra3fwuI0)

## Disclaimer

Use this for educational purposes only. I'll get in trouble if someone tries to
use this to scan in the entire school in at once or something stupid like that.

## Directions

_NOTE: This only works if you have a valid SBHS student email and password._

0. Make sure you have NodeJS, pnpm and Git installed.
1. Clone this repo.
2. `pnpm i` - This might take a while as Puppeteer (the browser automation tool
   used) installs its own version of Chromium
3. Open a browser (preferably Chromium-based) and navigate to the
   [Google Contacts Directory of your SBHS Google Account](https://contacts.google.com/directory).
4. Open the browser's console and paste the code from the `scrapeIds.js` file
   into it. If the browser disallows pasting into the console, type
   `allow pasting`, hit enter, and then try again.
5. Follow the script's directions.
6. After the script is completed, paste the output into a `students.json` file
   in the directory where you cloned this repo.
7. `pnpm genBarcodes` to generate the barcodes of all the students.
8. `pnpm fetchImages` to get the photographs of all the students.
9. `pnpm clean` to delete all generated files.

## How it works

### `scrapeIds`

When running the `scrapeIds.js` script in the browser, the names and emails of
every student from the Google Contacts Directory for your school account are
scraped. This is important since every student's email is their student ID
followed by @student.sbhs.nsw.edu.au.

From the scraped emails, the IDs are extracted. Then, the IDs and their
associated names are output as JSON. This is what you then put in the
`students.json` file.

### `genBarcodes`

The important thing to note is that the barcode on your student ID card is
_literally just your student ID encoded into a Code-128 barcode_. No hashing, no
salting, no nothing. It's just your student ID.

In fact, if you're a SBHS student, you can generate your own barcode yourself by
going to a Code-128 barcode generator online (like
[this one](https://barcode.tec-it.com/en/Code128)) and entering your student ID
in. If you look closely, the generated barcode is the exactly the same as your
student ID barcode.

So, when you run `genBarcodes`, it looks at the `students.json` file generated
by `scrapeIds` and generates Code-128 barcodes for all of them, using the
student IDs scraped as the barcode's data and stores them in a `barcodes`
folder.

### `fetchImages`

There's an endpoint in the Student Portal,
`https://student.sbhs.net.au/shssupport/assets/images/imageproxy.php?studentid={id}`
(where `{id}` is a student's ID) that allows you to download a photo of any
student given their student ID and proper authentication.

The script obtains authentication through your Student Portal credentials, then
downloads the photos for all students through this endpoint.

## Limitations

- Only works if you have a valid SBHS student email and password.
- Only associates full names with each student ID, and not other info such as
  roll class or year of graduation. In the case that there are two students that
  have the same name, the only way to differentiate between their barcodes will
  be their student ID.

## FAQ

### Why?

cuzynot.

Also I didn't want to study for my Modern History HSC Task 2 and needed to
procrastinate (at the time of writing, it is in 2 days - wish me luck).

Update from a year later: Guess what. I'm back. And my English Advanced Paper 1
Trial is in 4 days. I smell a pattern here.
