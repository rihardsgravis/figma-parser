interface Settings {
	token: string
}

interface AttributeSet {
	set: string
	values: Attribute[]
}

interface Attribute {
	name: string
	value: Color | String
}

interface Color {
	r: number
	g: number
	b: number
	a: number
}
