import * as Figma from "../types/FigmaApi"
import axios, { AxiosInstance } from "axios"
import * as Markup from "markup-js"

import { rgbaToStr } from "./helpers"
import templates from "./templates"

interface Settings {
	token: string
}

interface Attribute {
	name: string
	value: string
}

interface Tokens {
	colors: Attribute[]
	spacing: Attribute[]
	icons: Attribute[]
	font: {
		size: Attribute[]
		family: Attribute[]
		weight: Attribute[]
	}
}

class FigmaParser {
	private client: AxiosInstance
	private fileId: String
	public output: Tokens

	constructor(settings: Settings) {
		this.client = axios.create({
			baseURL: `https://api.figma.com/v1/`,
			headers: {
				"X-Figma-Token": settings.token
			}
		})

		this.output = {
			colors: [],
			spacing: [],
			icons: [],
			font: {
				size: [],
				weight: [],
				family: []
			}
		}
	}

	/**
	 * Trigger parse and apply template
	 */
	parse = async (fileId: string): Promise<Tokens> => {
		this.fileId = fileId

		const document = await this.request()

		if (!document) {
			throw new Error("Error loading file")
		}

		const pageList = document.children

		this.output = {
			colors: [],
			spacing: [],
			icons: [],
			font: {
				size: [],
				weight: [],
				family: []
			}
		}

		await this.parseTree(pageList)

		return this.output
	}

	/**
	 * Format token output to a markup template
	 */
	markup = (template?: string): String => {
		const result = Markup.up(template ? templates[template] || template : templates.json, this.output)
		return result
	}

	/**
	 * Make an API request call
	 */
	request = async (): Promise<Figma.Document> => {
		return this.client
			.get(`files/${this.fileId}`)
			.then(data => {
				return data.data.document as Figma.Document
			})
			.catch(error => {
				return error.data.status
			})
	}

	/**
	 * Make an API request call
	 */
	getImage = async (imageId: string): Promise<String> => {
		const response = await this.client.get(`images/${this.fileId}?ids=${imageId}&format=svg`)

		if (response.data.images[imageId]) {
			const { data } = await axios.get(response.data.images[imageId], { responseType: "text" })
			return data
		}
	}

	/**
	 * Parse provided Page following parse rules
	 */
	private parseTree = async (pages: ReadonlyArray<Figma.Canvas | Figma.FrameBase | Figma.Node>): Promise<void> => {
		for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
			const page = pages[pageIndex]

			if (!page["children"]) {
				continue
			}

			await this.parseTree(page["children"])

			if (page["type"] !== "COMPONENT" || page["children"].length < 1) {
				continue
			}

			const child = page["children"][0]

			const nameParts = page.name.split("-")

			if (nameParts.length < 2) {
				continue
			}

			const role = nameParts[0]

			/**
			 * $color
			 */
			if (role === "$color" && child["fills"]) {
				const fill = child["fills"][0]
				const value = rgbaToStr(fill.color, fill.opacity || 1)
				if (value) {
					this.output.colors.push({
						name: nameParts.slice(1).join(""),
						value
					})
				}
			}

			/**
			 * $spacing
			 */
			if (role === "$spacing" && child["absoluteBoundingBox"]) {
				this.output.spacing.push({
					name: nameParts.slice(1).join(""),
					value: `${child["absoluteBoundingBox"]["height"]}px`
				})
			}

			/**
			 * $font
			 */
			if (role === "$font") {
				if (nameParts[1] === "family" && child["style"]) {
					this.output.font.family.push({
						name: nameParts.length > 2 ? nameParts.slice(2).join("") : "default",
						value: child["style"]["fontFamily"]
					})
				}

				if (nameParts[1] === "style" && child["style"]) {
					this.output.font.size.push({
						name: nameParts.slice(2).join(""),
						value: `${child["style"]["fontSize"]}px`
					})
					this.output.font.weight.push({
						name: nameParts.slice(2).join(""),
						value: child["style"]["fontWeight"]
					})
				}
			}

			/**s
			 * $icon
			 */
			if (role === "$icon") {
				try {
					const image = await this.getImage(page.id)
					const paths = image.match(/d="(.[^"]+)"/g)
					if (paths.length === 1) {
						this.output.icons.push({
							name: nameParts.slice(1).join(""),
							value: paths[0].substr(3, paths[0].length - 4)
						})
					}
				} catch (err) {
					console.log(err)
				}
			}
		}
	}
}

export = FigmaParser
