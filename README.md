# Form Fitness

Form Fitness is a five-page fitness website about exercise, nutrition, and healthy daily habits. 

## Features

- **Home:** an interactive anatomy explorer with hover/focus highlights and links to Arms, Legs and Abs instructions. The registration demonstration validates name, email, password length and matching passwords, then displays a success message and unlocks a gift with a fading promo-code reveal.
- **Info:** six exercise cards, animated All muscles / Arms / Legs / Abs filters and an updated exercise count. Instructions slide open and closed with Show More / Show Less labels; reserved space prevents expanding a card from pushing neighboring sections down. Section headings include Back to anatomy links.
- **Nutrition:** a BMI calculator with field-specific validation, a result/category display, an animated scale marker and an expandable formula explanation. Optional goal notes have a character counter. Up to six recent calculations are generated from an array, with Clear history and form Reset controls. Users under 20 receive a BMI-for-age message instead of an adult category.
- **Plan:** a weekly workout table with a diagonal column shimmer, today's workouts highlighted, completion checkboxes and an animated weekly progress bar. Progress is saved in this browser using localStorage and resets for each Monday-to-Sunday week. Weekends display a rest-day message.
- **Handbook:** calorie guidance and two example meal plans in styled slide-open sections. Create your own meal plan opens a form for meal type, food name, calories, protein, fat and carbs. Whole-number validation rejects decimals, negative signs and letters. JavaScript creates table rows and recalculates totals when entries are added or removed. Tablet and phone layouts stack content and keep wide tables horizontally scrollable.

Registration is a front-end demonstration, not account creation. BMI history and custom meal plans last only until the page is refreshed or closed; only workout completion is saved between visits. The meal builder sums values entered for each entire portion and does not look up nutrition data or generate a diet automatically. Example meal plans are general information, and individual nutritional needs vary.

## Built with

HTML, CSS, Bootstrap 5.3.3, JavaScript and jQuery 3.7.1. JavaScript is organized in external files.

## Running the website

Open `index.html` in a modern browser, or serve the repository using a local static server such as an editor's Live Server. Internet access is needed for Bootstrap and jQuery, which load from CDNs. Use the same browser and site address when checking saved workout progress. A local server is preferable for testing storage because local-file storage behavior can vary between browsers.

## Testing the interactive features

Test all five pages using the navigation menu. Keep the browser developer console open and check for errors while using each feature.

### Home

Hover over or keyboard-focus the anatomy regions, then follow each link to its matching Info section. Submit the registration form empty, then try a one-character name, invalid email, password shorter than six characters and mismatched passwords: errors should appear near the relevant fields. From a fresh page, use test values such as `Test User`, `student@example.com` and matching `demo123` passwords. Confirm that success appears, OPEN becomes available and clicking it reveals the promo code.

### Info

Select Arms, Legs, Abs and All muscles; expect 3, 2, 1 and 6 exercises respectively, with the active button highlighted and a fade/slide transition. Switch filters rapidly and confirm the last selection wins. Open and close each card using Show More / Show Less, including repeated clicks during the animation. Check that instructions remain readable and neighboring sections stay in place. Use Back to anatomy to return to the home-page explorer. Repeat at phone width and use Tab, Enter and Space to test keyboard controls.

### Nutrition

Submit an empty form and try an age outside 2–120, weight outside 1–500 kg and height outside 50–250 cm. Errors should prevent calculation. Enter age 22, any gender option, weight 65 kg and height 170 cm: expect BMI **22.5**, a category, a success message and one history entry. Open and close How is BMI calculated?, type goal notes to check the counter, and calculate again to add history entries. The list retains at most six results. Try age 19 to check the BMI-for-age message. Reset should clear the form/result but preserve history; Clear history should remove the history cards. Refreshing clears this page's history.

### Plan

Check that today's rows match the browser's local weekday, or that a rest-day message appears on Saturday/Sunday. Check and uncheck workouts: the counter and progress bar should update, reaching **7 / 7** with all rows checked. Reload the same page to confirm saved checkboxes are restored. Uncheck them to clear test progress. For an optional weekly-reset check, use developer tools to change only the stored `form-fitness-weekly-workouts` object's `week` to an old value, then reload; old completions should not carry into this week. Watch for at least ten seconds to see the staggered shimmer and resize to check column alignment.

### Handbook

Toggle About calories and Daily Meal Plan, then open Create your own meal plan. Submit blank fields and confirm no row is added. In each numeric field, try typing/pasting letters, decimals, negative numbers and scientific notation: non-integer input should be blocked or reverted with feedback. Numeric values must be whole numbers from 0 to 999999, and the food name must not be blank. Zero is valid for a nutrient.

Add two test entries with calories/protein/fat/carbs of **300 / 20 / 10 / 35** and **150 / 10 / 5 / 20**. Expect totals of **450 kcal, 30 g protein, 15 g fat and 55 g carbs**. Remove the second row and confirm the first entry's totals remain; remove the last row and confirm the empty-plan message returns. Refresh to verify that custom meals are not saved. Table entries display user-supplied values, not calculated food nutrition.

## Endterm implementation examples

| Requirement | Examples to demonstrate |
| --- | --- |
| Arrays and loops | `bmiRanges` and `history` in `page 3/nutrition.js`; `mealPlan` and `nutrientFields` in `page 5/handbook.js`; `for...of` and `forEach` loops |
| Reusable functions with return values | `calculateBMI()`, `classifyBMI()`, `isValidInteger()` and `calculateTotals()` |
| Dynamic DOM creation/removal | BMI history cards, custom meal rows and Remove buttons |
| Events and visual feedback | `click`, `input`, `change`, `submit` and `reset` handlers; validation messages, active filters and progress updates |
| Form validation | Home registration, Nutrition measurements and Handbook integer fields |
| jQuery selectors/traversal | ID/class/descendant selectors, `children()` in Info, and `closest()`, `find()` and `parent()` in Nutrition |
| Useful jQuery effects | Instruction/section slide effects and BMI/promo-code fade effects |

