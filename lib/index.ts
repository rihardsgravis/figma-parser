import * as Figma from "../types/FigmaApi"
import axios, { AxiosInstance } from "axios"
import * as Markup from "markup-js"
import { rgbaToStr } from "./helpers"

class FigmaParser {
	private settings: Settings
	private client: AxiosInstance
	public output: {
		colors: AttributeSet[]
	}

	constructor(settings: Settings) {
		this.settings = settings

		this.client = axios.create({
			baseURL: `https://api.figma.com/v1/`,
			headers: {
				"X-Figma-Token": settings.token
			}
		})

		this.output = {
			colors: []
		}
	}

	/**
	 * Trigger parse and apply template
	 */
	parse = async (fileId: string, template: string): Promise<String> => {
		const document = await this.request(fileId)

		if (!document) {
			throw new Error("Error loading file")
		}

		const pageList = document.children

		this.parseTree(pageList)

		const result = Markup.up(template, { colors: this.output.colors.map(set => set) })

		return result
	}

	/**
	 * Make an API request call
	 */
	request = async (fileId: string): Promise<Figma.Document> => {
		return this.client
			.get(`files/${fileId}`)
			.then(data => {
				return data.data.document as Figma.Document
			})
			.catch(error => {
				return error.data.status
			})
	}

	/**
	 * Parse provided Page following parse rules
	 */
	private parseTree = (pages: ReadonlyArray<Figma.Canvas | Figma.FrameBase | Figma.Node>): void => {
		pages.forEach(page => {
			if (page["children"]) {
				this.parseTree(page["children"])
			}

			if (page["type"] !== "COMPONENT") {
				return null
			}

			const nameParts = page.name.split("-")

			/**
			 * $color
			 * Component naming pattern - `$color-{set}-{colorName}`
			 * First child of the target Component containing a fill is used as the color output
			 */
			if (nameParts[0] === "$color" && nameParts.length > 1 && page["children"]) {
				const set = nameParts[1]
				let setIndex = this.output.colors.findIndex(color => color.set === set)

				if (setIndex < 0) {
					this.output.colors.push({
						set: set,
						values: []
					})
					setIndex = this.output.colors.length - 1
				}

				const name = nameParts[2] || "color"

				const attribute = {
					name: name,
					value: "rgba(255, 255, 255, 0)"
				}

				for (let i = 0; i < page["children"].length; i++) {
					if (page["children"][i].fills) {
						const fill = page["children"][i].fills[0]
						attribute.value = rgbaToStr(fill.color, fill.opacity || 1)
						break
					}
				}

				this.output.colors[setIndex].values.push(attribute)
			}
		})
	}
}

export = FigmaParser
