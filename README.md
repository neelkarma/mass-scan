# Mass Scan

> Create student IDs for the entirety of SBHS!

## Disclaimer

Use this for educational purposes only. I'll get in trouble if someone tries to
use this to scan in the entire school in at once or something stupid like that.

## Directions

_NOTE: This only works if you have a valid SBHS student email and password._

0. Make sure you have NodeJS, pnpm and Git installed.
1. Clone this repo.
2. `pnpm i` - This might take a while as Puppeteer (the browser automation tool
   used) installs its own version of Chromium
3. `pnpm scrapeIds`
4. A browser window should pop up - follow the directions in the terminal and
   wait for the scrape to complete.
5. After that's done, `pnpm genBarcodes`
6. Done! All the barcodes should be in a new `barcodes` folder.
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

In fact, if you're a SBHS student, you can generate your own barcode yourself by
going to a Code-128 barcode generator online (like
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

## Preventation

What would the 3-man IT team at SBHS have to do to mitigate this vulnerability?

Answer: They could just hide the Google Contacts Directory from students, or
make student emails only contain names instead of student IDs. Easy.

But that's only a band-aid solution, so here's a better (although more
sophisticated) solution:

> WARNING: The following requires a basic understanding of what cryptographic
> hashing and salting is. Basically, if you're not a mega-nerd (like me), you
> can skip all of this.

No matter what, you can replicate a barcode using widely-available barcode
scanning apps on Android and iOS, so there's no way to stop that.

However, there is a possible way that:

- Completely mitigates the approach used in this repo
- Completely mitigates any other approach that uses a list of student IDs and
  associated names
- Makes it harder for students to replicate existing barcodes

A possible solution is _salting and hashing_.

It's simple - every year, when a new ID card is issued, the barcode on the
student ID will not be just a student ID, but it'll be a scrambled version
that's virtually impossible for a student to generate from a student's ID.

This is how it would work:

1. For each student, a randomly-generated salt is appended to the end of their
   ID. _This salt must be kept secret - if the salts are leaked to the students,
   they will be able to replicate the hashing process (next step), completely
   nullifying this approach._
2. The result is then hashed.
3. The first n characters of the hash are used to generate the barcode.
4. The barcode goes on the student's ID.
5. The scanning machines only accept the barcodes with the hashed ID.

Or, in pseudocode:

```
generate_barcode(first n chars of hash(id + random_salt))
```

Since the student doesn't have access to the salts, they will be unable to
generate the barcodes, since to generate them you would need both the student's
ID and the random salt for that specific student.

In addition to preventing bad actors from generating the barcode for every
single student in the school, this approach would have another benefit - it
would automatically invalidate ID cards from previous years, meaning that
students will be unable to give previous ID cards to friends so they can scan on
for them.

Honestly, they don't even have to salt and hash. _As long as the data in the
barcode can't be easily replicated by student-accessible data, any approach will
work._

But will the IT team implement this? Probably not. By doing this, not only would
the scanning machines and their backend infrastructure need to undergo a massive
code overhaul, but other places where student ID barcodes are used (e.g. school
photos, sports event attendance, etc.) would also need to be changed
significantly, and frankly, I don't believe the school would really undergo such
a big change for a vulnerability that no one is going to exploit anyways.

## FAQ

### Why?

cuzynot.

Also I didn't want to study for my Modern History HSC Task 2 and needed to
procrastinate (at the time of writing, it is in 2 days - wish me luck).
