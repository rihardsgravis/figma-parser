/**
 * Default JSON markup template
 */
const json = `{
   "color": { {{colors}}
     "{{name}}": "{{value}}"{{if #|last}}{{else}},{{/if}}{{/colors}}
   },
   "spacing": { {{spacing}}
     "{{name}}": "{{value}}"{{if #|last}}{{else}},{{/if}}{{/spacing}}
   },
   "icon": { {{icons}}
     "{{name}}": "{{value}}"{{if #|last}}{{else}},{{/if}}{{/icons}}
   },
   "font": { 
     "family": { {{font.family}}
       "{{name}}": "{{value}}"{{if #|last}}{{else}},{{/if}}{{/font.family}}
     },
     "size": { {{font.size}}
       "{{name}}": "{{value}}"{{if #|last}}{{else}},{{/if}}{{/font.size}}
     },
     "weight": { {{font.weight}}
       "{{name}}": {{value}}{{if #|last}}{{else}},{{/if}}{{/font.weight}}
     }
   }	
 }`

/**
 * Typescript definition template
 */
const ts = `export default interface Tokens {
   color: { {{colors}}
     {{name}}: string;{{/colors}}
   },
   spacing: { {{spacing}}
     {{name}}: string;{{/spacing}}
   },
   icon: { {{icons}}
     {{name}}: string{{/icons}}
   },
   font: { 
     family: { {{font.family}}
       {{name}}: string{{/font.family}}
     },
     size: { {{font.size}}
       {{name}}: string{{/font.size}}
     },
     weight: { {{font.weight}}
       {{name}}: number{{/font.weight}}
     }
   }	
 }`

export default {
	json,
	ts
}
