import * as Figma from "../types/FigmaApi"
import axios, { AxiosInstance } from "axios"
import * as Markup from "markup-js"
import { optimize } from "svgo"

import { rgbaToStr, gradientToStr, fontWeights } from "./helpers"
import templates from "./templates"

interface Settings {
	token: string
}

interface Attribute {
	name: string
	value?: string
	values?: string[]
}

type Token = "colors" | "space" | "icons" | "illustrations" | "fontSizes" | "fonts" | "fontWeights" | "lineHeights" | "letterSpacings" | "textTransforms"

type Tokens = {
	[key in Token]: Object
}

const defaultTokens: Token[] = ["colors", "space", "fontSizes", "fonts", "fontWeights", "lineHeights", "letterSpacings", "textTransforms"]

type TokenSingulars = {
	[key in Token]: string
}

const tokenSingulars: TokenSingulars = {
	colors: "color",
	space: "space",
	fontSizes: "size",
	fonts: "family",
	fontWeights: "weight",
	lineHeights: "line",
	letterSpacings: "spacing",
	textTransforms: "textTransform",
	icons: "icon",
	illustrations: "illustration",
}

class FigmaParser {
	private client: AxiosInstance
	private fileId: String
	private tokens: Token[]
	public output: Tokens

	constructor(settings: Settings) {
		this.client = axios.create({
			baseURL: `https://api.figma.com/v1/`,
			headers: {
				"X-Figma-Token": settings.token,
			},
		})
	}

	/**
	 * Trigger parse and apply template
	 */
	parse = async (fileId: string, tokens: Token[]): Promise<Tokens> => {
		this.fileId = fileId
		this.tokens = tokens || defaultTokens

		if (!this.output) {
			this.output = {
				colors: {},
				space: {},
				icons: {},
				fonts: {},
				fontWeights: {},
				fontSizes: {},
				lineHeights: {},
				letterSpacings: {},
				textTransforms: {},
				illustrations: {},
			}
		}

		const document = await this.request()

		if (!document) {
			throw new Error("Error loading file")
		}

		const pageList = document.children

		await this.parseTree(pageList, "")

		return this.output
	}

	/**
	 * Format token output to a markup template
	 */
	markup = (template?: string, input?: Tokens): string => {
		if (!input) {
			input = this.output
		}

		for (let token in input) {
			if (Object.keys(input[token]).length === 0) {
				delete input[token]
			}
		}

		const arrayInput = Object.keys(input)
			.map((token) => ({ token, singular: tokenSingulars[token], attributes: Object.keys(input[token]).map((attr) => ({ name: attr, value: input[token][attr] })) }))
			.filter((item) => item.attributes.length > 0)

		if (template === "json") {
			return JSON.stringify(input, null, 2)
		}

		let result = Markup.up(template ? templates[template] || template : templates.ts, { tokens: arrayInput })

		return result
	}

	/**
	 * Make an API request call
	 */
	request = async (): Promise<Figma.Document> => {
		return this.client
			.get(`files/${this.fileId}`)
			.then((data) => {
				return data.data.document as Figma.Document
			})
			.catch((error) => {
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
	private parseTree = async (pages: ReadonlyArray<Figma.Canvas | Figma.FrameBase | Figma.Node>, parentName: string): Promise<void> => {
		for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
			const page = pages[pageIndex]

			const nameParts = page.name.split("-")

			if (page["children"]) {
				await this.parseTree(page["children"], parentName === "icons" && page.type === "FRAME" ? "icons" : nameParts[0])
			}

			const layer = page["children"] && page["children"].length > 0 ? page["children"][0] : page

			const role = nameParts[0]

			/**
			 * Colors
			 */
			if (this.tokens.indexOf("colors") > -1 && role === "color" && layer["fills"]) {
				const fill = layer["fills"][0]

				const value = fill.type === "SOLID" ? rgbaToStr(fill.color, fill.opacity || 1) : gradientToStr(fill.gradientStops)

				if (value) {
					this.output.colors[nameParts.slice(1).join("")] = value
				}
			}

			/**
			 * Space
			 */
			if (this.tokens.indexOf("space") > -1 && role === "spacing" && layer["absoluteBoundingBox"]) {
				this.output.space[`${nameParts.slice(1).join("")}`] = `${layer["absoluteBoundingBox"]["height"]}px`
			}

			/**
			 * Font
			 */
			if (role === "font" && layer["style"]) {
				if (this.tokens.indexOf("fonts") > -1 && nameParts[1] === "family") {
					this.output.fonts[nameParts.length > 2 ? nameParts.slice(2).join("") : "default"] = layer["style"]["fontFamily"]
				}

				if (this.tokens.indexOf("fontSizes") > -1 && (nameParts[1] === "style" || nameParts[1] === "size")) {
					this.output.fontSizes[nameParts.slice(2).join("")] = `${layer["style"]["fontSize"]}px`
				}

				if (this.tokens.indexOf("lineHeights") > -1 && (nameParts[1] === "style" || nameParts[1] === "lineheight")) {
					this.output.lineHeights[nameParts.slice(2).join("")] = `${layer["style"]["lineHeightPercentFontSize"]}%`
				}

				if (this.tokens.indexOf("letterSpacings") > -1 && (nameParts[1] === "style" || nameParts[1] === "spacing")) {
					this.output.letterSpacings[nameParts.slice(2).join("")] = `${Math.round((layer["style"]["letterSpacing"] / layer["style"]["fontSize"]) * 100) / 100}em`
				}

				if (this.tokens.indexOf("fontWeights") > -1 && (nameParts[1] === "style" || nameParts[1] === "weight")) {
					const fontWeight = layer["style"]["fontPostScriptName"].split("-").splice(-1, 1)[0].toLowerCase()
					this.output.fontWeights[nameParts.slice(2).join("")] = fontWeights[fontWeight] || layer["style"]["fontWeight"].toString()
				}

				if (this.tokens.indexOf("textTransforms") > -1 && (nameParts[1] === "style" || nameParts[1] === "transform")) {
					this.output.textTransforms[nameParts.slice(2).join("")] = layer["style"]["textCase"] === "UPPER" ? "uppercase" : "none"
				}
			}

			/**
			 * Icon
			 */
			if (this.tokens.indexOf("icons") > -1 && page.type !== "FRAME" && ((role === "icon" && nameParts.length > 1) || parentName === "icons")) {
				try {
					const iconName = nameParts
						.slice(parentName === "icons" ? 0 : 1)
						.map((item) => item.charAt(0).toUpperCase() + item.substr(1).toLowerCase())
						.join("")

					const image = await this.getImage(page.id)

					const optimizedImage = optimize(image as string)

					console.log(`Fetched icon ${iconName}, original ${image.length}, optimized ${optimizedImage.data.length}`)

					this.output.icons[iconName] = optimizedImage.data
				} catch (err) {}
			}

			/**
			 * Illustration
			 */

			if (this.tokens.indexOf("illustrations") > -1 && ((role === "illustration" && nameParts.length > 1) || parentName === "illustrations")) {
				console.log(role, nameParts, parentName)

				try {
					const illustrationName = nameParts
						.slice(parentName === "illustrations" ? 0 : 1)
						.map((item) => item.charAt(0).toUpperCase() + item.substr(1).toLowerCase())
						.join("")

					const image = await this.getImage(page.id)
					const optimizedImage = optimize(image as string)

					console.log(`Fetched illustration ${illustrationName}, original ${image.length}, optimized ${optimizedImage.data.length}`)

					this.output.illustrations[illustrationName] = optimizedImage.data
				} catch (err) {}
			}
		}
	}
}

export = FigmaParser
