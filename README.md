# figma-parser

**Work in progress!** Parse Figma design files via Figma API

### Usage:

```
const FigmaParser = require("figma-parser");

const figma = new FigmaParse({
   token: "your-access-token"
});

const template = `export default {
   {{colors}}
      {{set}}: {
         {{values}}
            {{name}}: "{{value}}",
         {{/values}}
      },
   {{/colors}}
}`;

(async () => {
   const output = await figma.parse('figma-file-id', template);
   console.log(output);
)();
```
