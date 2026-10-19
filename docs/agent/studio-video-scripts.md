# Studio tutorial video scripts

Written 2026-10-19 for the tutorial-video pipeline (PORTS.md card 137, ported from Theology Matters). Each script is
recorded with Playwright against the local Studio with SAMPLE data only: no real client, review or address. Record at
1280 x 800 for desk jobs and 390 x 844 for phone jobs, light appearance, under two minutes. Captions are burned in, one
line each, and every caption frame is checked by eye. When a clip exists, its guide in `src/sanity/guides/content.ts`
gets `video: '/guides/<slug>.mp4'`. The job list behind these is `docs/agent/studio-plan.md`.

Sample data used across the scripts (made up, safe for a public repo):

- Review: "She found a way to use our grandmother's dresser and the whole room fell into place." from "Sam P.", Avon, IN,
  Google, 5 stars.
- Notice: "Booking consultations for March." until the last day of the month.
- Press: "Sample Home Journal", today, "Five calm living rooms", `https://example.com/five-calm-rooms`.
- Question: "Do you work with furniture I already own?" Answer: "Always. We start with what you love and build around it."
- Room story: "Sample living room, Avon", a sage sofa, a jute rug, new lamps and art; placeholder photos from
  `tests/fixtures/` (never a client's home).

## 1. Add a review from your phone (`add-review`, 390 wide, about 45 s)

| Shot | Action                                                 | Caption                                                      |
| ---- | ------------------------------------------------------ | ------------------------------------------------------------ |
| 1    | Studio Home on a phone; tap `Quick update` in the menu | On your phone, open Quick update.                            |
| 2    | Tap the `Add a review` tile                            | Tap Add a review.                                            |
| 3    | Paste the sample quote into "Their words"              | Paste their words exactly. Do not tidy them up.              |
| 4    | Type "Sam P." and "Avon, IN"                           | Their first name and town, the way they would like it shown. |
| 5    | Leave Google and 5; leave today's date                 | Google reviews keep their stars.                             |
| 6    | Tap the button; the done screen shows                  | It is on the website in a few minutes.                       |

## 2. Post a notice from your phone (`announcement`, 390 wide, about 35 s)

| Shot | Action                                             | Caption                                                   |
| ---- | -------------------------------------------------- | --------------------------------------------------------- |
| 1    | Quick update; tap `Post a notice`                  | Tap Post a notice.                                        |
| 2    | Type the sample notice                             | One or two short sentences.                               |
| 3    | Change "Last day to show it"                       | Pick the last day. It takes itself down after that.       |
| 4    | Tap the button; then show the bar on the home page | Every page shows it at the top, until the day you picked. |

## 3. Publish your first room story (`first-room-story`, 1280 wide, about 1 min 50 s)

| Shot | Action                                                                   | Caption                                           |
| ---- | ------------------------------------------------------------------------ | ------------------------------------------------- |
| 1    | Home; click `Start a room story`                                         | On Home, click Start a room story.                |
| 2    | Pan down the new form showing the [square brackets]                      | Every bracket says what goes there.               |
| 3    | Replace title, location, the brief and the design call with sample words | Replace each bracket with your own words.         |
| 4    | Upload the hero placeholder; type its alt text                           | Your best wide shot, with a short description.    |
| 5    | Add six gallery placeholders; drag one to the front                      | Add the rest and drag them into order.            |
| 6    | Open `Help for this page`; it flags one missed bracket; fix it           | Help for this page catches anything you missed.   |
| 7    | Generate the slug                                                        | Generate makes the web address.                   |
| 8    | Click `Publish`; Home's Is it live? goes to Updating                     | Publish. It is on the Portfolio in a few minutes. |

## 4. Update your Google rating (`google-rating`, 1280 wide, about 40 s)

| Shot | Action                                             | Caption                                             |
| ---- | -------------------------------------------------- | --------------------------------------------------- |
| 1    | Home; click `Update your Google rating`            | On Home, click Update your Google rating.           |
| 2    | Type 4.9 into "Google star rating"                 | Type the rating Google shows.                       |
| 3    | Set "Rating last checked" to today                 | Set the day you looked. Home asks again in a month. |
| 4    | Click `Publish`; This week's rating job shows Done | Publish, and the job ticks itself.                  |

## 5. Change a price (`prices`, 1280 wide, about 45 s)

| Shot | Action                                                           | Caption                                           |
| ---- | ---------------------------------------------------------------- | ------------------------------------------------- |
| 1    | Home; click `Change a price`                                     | On Home, click Change a price.                    |
| 2    | Open one service; change its price line to a sample figure       | Open the service and change its price.            |
| 3    | Open `Live preview` on Services; the paint chip shows the change | Live preview shows it before anyone else sees it. |
| 4    | Click `Publish`                                                  | Publish. Services and Home update together.       |

## 6. Add a question from your phone (`add-question`, 390 wide, about 40 s)

| Shot | Action                                                                | Caption                                             |
| ---- | --------------------------------------------------------------------- | --------------------------------------------------- |
| 1    | Quick update; tap `Add a question`                                    | Tap Add a question.                                 |
| 2    | Type the sample question and answer                                   | Ask it the way a client would. Answer it simply.    |
| 3    | Leave "Getting Started" as the group                                  | Not sure of the group? Leave it, and move it later. |
| 4    | Tap the button; show it at the end of the group on the Questions page | It goes at the end of its group.                    |

## 7. Bring something back from the Trash (`trash`, 1280 wide, about 35 s)

| Shot | Action                                                       | Caption                                              |
| ---- | ------------------------------------------------------------ | ---------------------------------------------------- |
| 1    | Open a sample review; menu, `Move to Trash`                  | Moving something to the Trash takes it off the site. |
| 2    | Content, `Trash (bring things back)`; open the sample review | It waits here.                                       |
| 3    | Click `Bring it back`                                        | Bring it back, and it is exactly as it was.          |
