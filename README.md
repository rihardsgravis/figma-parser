# figma-parser

**Work in progress!**
Parse Figma design files via Figma API to design tokens

## Usage:

### Prepare Figma file

Each token has to be a component with a specific name containing a single element (besides that, organise and style your design file as you want):

-   **Color** component named `color-xxx` with **fill as the token value**
-   **Spacing** named `spacing-xxx` with **height as the token value**
-   **Font family** named `font-family-xxx` with **font family set as token value**
-   **Font size and weight** named `font-style-xxx` with **font size and weight set as token value**
-   **Icons** named `icon-xxx` with **the icon shape as the first child layer**

Here's an example file - https://www.figma.com/file/s3DjttpILZzr4LC6WrkJun/Dark-theme?node-id=0%3A1

### Download tokens

```
const FigmaParser = require("figma-parser");

const figma = new FigmaParser({
  token: "your-access-token"
});

(async () => {
  // Parse all tokens
  const output = await figma.parse("figma-file-id");

  // Parse optional tokens
  const output = await figma.parse("figma-file-id", ["color", "spacing"]);

  // Raw JSON file
  console.log(output);

  // Markup as JSON
  console.log(figma.markup("json"));

  // Markup as Typescript definitions
  console.log(figma.markup("ts"));

  // Pass custom markup template, see /lib/templates.ts
  console.log(figma.markup("your-custom-template"));
})();

```
