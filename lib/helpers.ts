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
		.map(stop => {
			return `${rgbaToStr(stop.color, 1)} ${Math.round(stop.position * 100)}%`
		})
		.join(", ")

	return `linear-gradient(180deg, ${steps})`
}
