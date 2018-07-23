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
