import { parse as svgParse, stringify as svgStringify } from "svgson"
import { optimize } from "svgo"

interface Color {
	r: number
	g: number
	b: number
	a: number
}

type GradientStop = {
	color: Color
	position: number
}

/**
 * Convert Color object to rgba string
 */
export const rgbaToStr = (color: Color, opacity: number): string => {
	const r = Math.round(color.r * 255)
	const g = Math.round(color.g * 255)
	const b = Math.round(color.b * 255)
	const alpha = Math.min(Math.round(opacity * color.a * 100) / 100, 1)

	return alpha === 1 ? `rgb(${r}, ${g}, ${b})` : `rgba(${r}, ${g}, ${b}, ${alpha})`
}

export const gradientToStr = (gradient: GradientStop[]): string => {
	const steps = gradient
		.map((stop) => {
			return `${rgbaToStr(stop.color, 1)} ${Math.round(stop.position * 100)}%`
		})
		.join(", ")

	return `linear-gradient(180deg, ${steps})`
}

export const fontWeights = {
	thin: 100,
	extralight: 200,
	ultralight: 200,
	light: 300,
	book: 400,
	normal: 400,
	regular: 400,
	roman: 400,
	medium: 500,
	semibold: 600,
	demibold: 600,
	bold: 700,
	extrabold: 800,
	ultrabold: 800,
	black: 900,
	heavy: 900,
}

export const parseIcons = async (input: string): Promise<Array<{ name: string; image: string }>> => {
	try {
		const svg = await svgParse(input)
		const set = svg.children[0]

		if (set.attributes.id !== "icons") {
			return []
		}

		const icons = set.children.map((item) => {
			let icon = item

			while (icon.name === "g") {
				icon = icon.children[0]
			}

			return {
				name: item.attributes.id,
				image: optimize(svgStringify(icon)),
			}
		})

		return icons
	} catch (_e) {
		return []
	}
}
