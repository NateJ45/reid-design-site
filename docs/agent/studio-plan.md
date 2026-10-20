# The Studio plan: who edits, what they do, where it lives

Written 2026-10-19. This is the map from the studio owner's real jobs to the Studio surface that serves each one, so
Quick update, Home, the Site Guide and the tours all cover the same list. Change it when a job appears or goes away,
in the same commit as the Studio change. Kit reference: `docs/agent/studio-kit.md`; settings: `src/sanity/kit.config.ts`.

## Who edits

| Who                     | How often          | Device                                                                            | Comfort                                                                                   |
| ----------------------- | ------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Staci (owner, designer) | A few times a week | Phone between client visits for small things; laptop at her desk for room stories | Confident with Instagram and Google; new to a CMS. Wants a few taps, not a form with tabs |
| Nathan (developer)      | When asked         | Desk                                                                              | Full Studio; the staff view is what Staci sees                                            |

There is one editor, so there are no roles to split: Staci gets the staff view (`kitConfig.staff`, by Sanity user id
once it is looked up), Nathan the full Studio.

## Weekly jobs

| Job                                                         | Where it happens                       | Studio surface                                                                            | Guide                                                       |
| ----------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| Answer enquiries (contact form messages, Calendly bookings) | Her email and Calendly, not the Studio | Home, This week: hand tick                                                                | `enquiries`                                                 |
| Ask a happy client for a Google review                      | Text or email with her review link     | Home, This week: hand tick; the link is in Site settings, Reviews                         | `ask-for-review`                                            |
| Add a review that came in                                   | Phone                                  | Quick update, "Add a review"; Home big button                                             | `add-review`                                                |
| Put up or take down a notice ("Booking for March")          | Phone                                  | Quick update, "Post a notice"; Announcements list                                         | `announcement`                                              |
| Work on a room story (photos, the brief, her design call)   | Laptop                                 | Home big button "Start a room story"; Content, Room stories; Coming up for scheduled ones | `first-room-story`, `room-story-photos`, `schedule-a-story` |
| See whether the last change is live; clear the Checkup      | Either                                 | Home, Is it live?, Fix-it list; This week ticks "Checkup is clear" by itself              | `website-status`, `check-page`                              |

## Monthly and when it happens

| Job                                        | Studio surface                                                                  | Guide           |
| ------------------------------------------ | ------------------------------------------------------------------------------- | --------------- |
| Check the Google rating                    | Home big button; This week ticks itself for 30 days after "Rating last checked" | `google-rating` |
| Add a press mention                        | Quick update, "Add a press mention" (new 2026-10-19); Content, Press            | `press`         |
| Answer a question clients keep asking      | Quick update, "Add a question" (new 2026-10-19); Content, Questions             | `add-question`  |
| Feature a review, or hide one              | Content, Reviews                                                                | `add-review`    |
| Change availability ("Booking for spring") | Quick update, "Change your availability"; Home, Your pages                      | `availability`  |
| Change the booking link or its words       | Contact page, Scheduling tab                                                    | `enquiries`     |

## Seasonal and yearly

| Job                                                   | Studio surface                                | Guide                                 |
| ----------------------------------------------------- | --------------------------------------------- | ------------------------------------- |
| Change a price                                        | Home big button; Content, Services and prices | `prices`                              |
| Seasonal sections on Home (holiday styling, new year) | Saved sections; the page's Extra sections     | `seasonal-patterns`, `reuse-sections` |
| Swap the Home hero picture                            | Home page, Hero                               | `home-hero`                           |
| Build a page of her own (a town, a styling offer)     | Content, Pages, from a ready-made layout      | `add-a-page`, `page-templates`        |
| Menus and footer                                      | Site settings, Menus                          | `menus-and-footer`                    |
| About page, "Off the Clock" answers                   | About page                                    | `about-off-the-clock`                 |
| Instagram feed headline, on or off                    | Site settings, Instagram feed                 | `instagram`                           |
| Bring something back from the Trash, or undo          | Trash; the document's history                 | `trash`, `undo`                       |

## What each surface is for

- **Home** opens first. The four big buttons are the jobs that move bookings (room story, price, review, rating).
  This week holds the four weekly checks above. Your pages is the map of everything.
- **Quick update** is the phone. Seven forms, each a few boxes and one button: a review, a notice, a press mention, a
  question, the Google rating and the availability line (each published straight away), and "Start a room story from
  a photo" (a title, the town and a cover photo, saved as a DRAFT to finish on the laptop). A whole room story still
  needs a dozen photos and a laptop.
- **Content** is the desk, in job order: Room stories first, then Pages, then Prices, reviews and lists, then
  Announcements, Start Here and the Trash. Lists Staci fills explain themselves while empty.
- **Site Guide** has a guide for every job in the tables, with pictures of the real Studio where a step is about
  finding a button (`src/sanity/guides/shots.ts`), and "How to" chips beside the fields people get wrong.
- **Tours** (card 137, `src/sanity/studio-tours.ts`): a welcome, a first-run tour, "How this screen works" on Home
  and Quick update, and a room story tour on demand. Video scripts for the jobs that most need watching are in `docs/agent/studio-video-scripts.md`.

## Card 137 (landed 2026-10-19 while this was written)

- **Edit jobs** now cover the two one-field changes: "Update your Google rating" (rating and the day it was checked, on
  Site settings) and "Change your availability" (Business info). Both are on Quick update after the four create jobs.
- **Dropdowns**: "Where it came from" and "Stars" on a review, and "Which group" on a question, are pick lists now.
- **Tours, welcome and What's new** are wired from `src/sanity/studio-tours.ts` (first run, Home, Quick update, and a
  room story tour on demand).
- **Post a photo** (starter card 143): `postPhoto.stories` in `kit.config.ts` offers each room story as a place for one photo, with alt text required. It is added to the story's DRAFT gallery (made from the published copy when there is none) and never publishes; Staci presses Publish at her desk. One photo per pass, "Post another photo" after each.
- **Videos**: five phone scripts are in `tools/tutorial-videos/scripts/` (add a review, post a notice, add a press
  mention, add a question, update the Google rating) and were recorded once, but not registered: the recording showed
  Sanity's "What's new" toast and Astro's dev toolbar, so they need a re-record with those hidden (see PENDING). The desk
  clips in `docs/agent/studio-video-scripts.md` (first room story, change a price, trash) need a signed-in Studio that
  can publish. No guide has a `video` yet, so Home's "Watch how it is done" stays hidden.

## Bigger ideas (not built)

- A "Room story checklist" on Home while the Portfolio is empty: photos ready, brief written, design call written,
  published. The Checkup's "no room story yet" covers the first step today.
- A What's-new modal entry after each Studio round, in her words ("You can now add a press mention from your phone").
- When enquiries move into the site (if the contact form ever stores messages), the Messages inbox can replace the
  hand tick.
