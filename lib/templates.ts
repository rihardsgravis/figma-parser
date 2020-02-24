/**
 * Default JSON markup template
 */
const json = `{
{{tokens}}
  "{{token}}": { {{attributes}}
    "{{name}}": "{{value}}"{{if #|last}}{{else}},{{/if}}{{/attributes}}
  }{{if #|last}}{{else}},{{/if}}
{{/tokens}}
 }`

/**
 * Typescript definition template
 */
const ts = `{{tokens}}
export type token{{singular|capcase}} = {{attributes}}'{{name}}'{{if #|last}};{{else}} | {{/if}}{{/attributes}}
{{/tokens}}

export default interface Tokens{
  {{tokens}}
  {{token}}: {
    [key in token{{singular|capcase}}]: string;
  };{{/tokens}}
}
`

export default {
	json,
	ts
}
