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
	colors?: Attribute[]
	space?: Attribute[]
	icon?: Attribute[]
	font?: {
		size: Attribute[]
		family: Attribute[]
		weight: Attribute[]
	}
}

type Token = "colors" | "space" | "icons" | "font"
const TOKENS: Token[] = ["colors", "space", "icons", "font"]

class FigmaParser {
	private client: AxiosInstance
	private fileId: String
	private tokens: Token[]
	public output: Tokens

	constructor(settings: Settings) {
		this.client = axios.create({
			baseURL: `https://api.figma.com/v1/`,
			headers: {
				"X-Figma-Token": settings.token
			}
		})
	}

	/**
	 * Trigger parse and apply template
	 */
	parse = async (fileId: string, tokens: Token[]): Promise<Tokens> => {
		this.fileId = fileId
		this.tokens = tokens || TOKENS

		this.output = {
			colors: [],
			space: [],
			icon: [],
			font: {
				size: [],
				weight: [],
				family: []
			}
		}

		const document = await this.request()

		if (!document) {
			throw new Error("Error loading file")
		}

		const pageList = document.children

		await this.parseTree(pageList)

		return this.output
	}

	/**
	 * Format token output to a markup template
	 */
	markup = (template?: string, input?: any): string => {
		let result = Markup.up(template ? templates[template] || template : templates.json, input || this.output)
		// Remove empty lines
		result = result.replace(/(^[ \t]*\n)/gm, "")
		// Remove trailing commas
		result = result.replace(/\,(?!\s*?[\{\[\"\'\w])/g, "")

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

			if (page["children"]) {
				await this.parseTree(page["children"])
			}

			const layer = page["children"] ? page["children"][0] : page

			const nameParts = page.name.split("-")

			if (nameParts.length < 2) {
				continue
			}

			const role = nameParts[0]

			/**
			 * Colors
			 */
			if (this.tokens.indexOf("colors") > -1 && role === "color" && layer["fills"]) {
				const fill = layer["fills"][0]
				const value = rgbaToStr(fill.color, fill.opacity || 1)
				if (value) {
					this.output.colors.push({
						name: nameParts.slice(1).join(""),
						value
					})
				}
			}

			/**
			 * Space
			 */
			if (this.tokens.indexOf("space") > -1 && role === "space" && layer["absoluteBoundingBox"]) {
				this.output.space.push({
					name: nameParts.slice(1).join(""),
					value: `${layer["absoluteBoundingBox"]["height"]}px`
				})
			}

			/**
			 * Font
			 */
			if (this.tokens.indexOf("font") > -1 && role === "font") {
				if (nameParts[1] === "family" && layer["style"]) {
					this.output.font.family.push({
						name: nameParts.length > 2 ? nameParts.slice(2).join("") : "default",
						value: layer["style"]["fontFamily"]
					})
				}

				if (nameParts[1] === "style" && layer["style"]) {
					this.output.font.size.push({
						name: nameParts.slice(2).join(""),
						value: `${layer["style"]["fontSize"]}px`
					})
					this.output.font.weight.push({
						name: nameParts.slice(2).join(""),
						value: layer["style"]["fontWeight"]
					})
				}
			}

			/**
			 * Icon
			 */
			if (this.tokens.indexOf("icons") > -1 && role === "icon") {
				try {
					const image = await this.getImage(page.id)
					const paths = image.match(/d="(.[^"]+)"/g)
					if (paths.length === 1) {
						this.output.icon.push({
							name: nameParts.slice(1).join(""),
							value: paths[0].substr(3, paths[0].length - 4)
						})
						console.log(`Loaded icon ${page.name}, ${page.id}, ${page.type}`)
					} else {
						console.log(`No svg data for icon ${page.name}`)
					}
				} catch (err) {
					console.log(`Failed to load icon ${page.name}`)
				}
			}
		}
	}
}

export = FigmaParser
