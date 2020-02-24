# figma-parser

**Work in progress!**
Parse Figma design files via Figma API to design tokens

## Usage:

### Prepare Figma file

Each token has to be a single layer following a specific naming (besides that, organise and style your design file as you want):

-   **Colors** named `color-xxx` with **fill as the token value**
-   **Space** named `space-xxx` with **height as the token value**
-   **Font family** named `font-family-xxx` with **font family set as token value**
-   **Font size and weight** named `font-style-xxx` with **font size and weight set as token value**
-   **Icons** named `icon-xxx` with **the icon shape as the first child layer**

The token can also be a group named by the rules. The style will be read by the last (bottom most) layer of the group.

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
  const output = await figma.parse("figma-file-id", ["colors", "space", "fonts", "fontSizes", "fontWeights"]);

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
