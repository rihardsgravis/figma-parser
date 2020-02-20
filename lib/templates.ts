/**
 * Default JSON markup template
 */
const json = `{
{{if colors}}
  "color": { {{colors}}
    "{{name}}": "{{value}}",{{/colors}}
  },
{{/if}}
{{if spacing}}
  "spacing": { {{spacing}}
    "{{name}}": "{{value}}",{{/spacing}}
  },
{{/if}}
{{if icon}}
  "icon": { {{icon}}
    "{{name}}": "{{value}}",{{/icon}}
  },
{{/if}}
{{if font.family}}
  "font": { 
    "family": { {{font.family}}
      "{{name}}": "{{value}}",{{/font.family}}
    },
    "size": { {{font.size}}
      "{{name}}": "{{value}}",{{/font.size}}
    },
    "weight": { {{font.weight}}
      "{{name}}": {{value}},{{/font.weight}}
    }
  },
{{/if}}
 }`

/**
 * Typescript definition template
 */
const ts = `export default interface Tokens {
{{if colors}}
  colors: { {{colors}}
    {{name}}: string;{{/colors}}
  };
{{/if}}
{{if spacing}}
  spacing: { {{spacing}}
    {{name}}: string;{{/spacing}}
  };
{{/if}}
{{if icon}}
  icon: { {{icon}}
    {{name}}: string;{{/icon}}
  };
{{/if}}
{{if font.family}}
  font: { 
    family: { {{font.family}}
      {{name}}: string;{{/font.family}}
    };
    size: { {{font.size}}
      {{name}}: string;{{/font.size}}
    };
    weight: { {{font.weight}}
      {{name}}: number;{{/font.weight}}
    };
  };
{{/if}}
}`

export default {
	json,
	ts
}
