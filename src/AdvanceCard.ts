/**
 *
 * Create all the DOM Elements for Advance Card
 *
 */
"use strict";
import { BaseType, select, Selection } from "d3-selection";
import { stringExtensions as StringExtensions, textMeasurementService as TextMeasurementService, interfaces } from "powerbi-visuals-utils-formattingutils";
import { manipulation } from "powerbi-visuals-utils-svgutils";
import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import {
    createLabelElement,
    createSVGRectanglePath,
    elementExist,
    getLabelSize,
    ILabelTextProperties,
    SVGRectanglePathProperties,
    updateLabelColor,
    updateLabelStyles,
    updateLabelValueWithoutWrapping,
    updateLabelValueWithWrapping
} from "./AdvanceCardUtils";
import { AdvanceCardVisualSettings, ConditionSettings, FillSettings, StrokeSettings } from "./settings";

import translate = manipulation.translate;
import textMeasurementService = TextMeasurementService;
import TextProperties = interfaces.TextProperties;

export enum AdvanceCardClassNames {
    RootSVGClass= "root-svg",
    DataLabelClass = "data-label",
    CategoryLabelClass = "category-label",
    PrefixLabelClass = "prefix-label",
    PostfixLabelClass = "postfix-label",
    FillClass = "card-fill",
    StrokeClass = "card-stroke",
    CardBackgroundClass = "card-background",
}

export enum AdvanceCardIdNames {
    StrokePathId = "stroke-path",
    StrokePathClipPathId = "clip-path-stroke",
}

export class AdvanceCard {

    private rootSVGElement: Selection<BaseType, any, any, any>;
    private dataLabelGroupElement: Selection<BaseType, any, any, any>;
    private categoryLabelGroupElement: Selection<BaseType, any, any, any>;
    private prefixLabelGroupElement: Selection<BaseType, any, any, any>;
    private postfixLabelGroupElement: Selection<BaseType, any, any, any>;
    private fillGroupElement: Selection<BaseType, any, any, any>;
    private strokeGroupElement: Selection<BaseType, any, any, any>;
    private cardBackgroundGroupElement: Selection<BaseType, any, any, any>;
    private rootSVGSize: SVGRect;
    private settings: AdvanceCardVisualSettings;

    constructor(private target: HTMLElement) {
        try {
            this.rootSVGElement = select(this.target).append("svg")
                .classed(AdvanceCardClassNames.RootSVGClass, true);
        } catch (err) {
            throw err;
        }
    }

    public setSize(viewportWidth: number, viewportHeight: number, ) {
        this.rootSVGElement.attr("width", viewportWidth)
            .attr("height", viewportHeight);
        this.rootSVGSize = <SVGRect>(<SVGElement>this.rootSVGElement.node()).getBoundingClientRect();
        // this.rootSVGSize = new DOMRect(0, 0, width, height)
    }

    public updateSettings (settings: AdvanceCardVisualSettings) {
        this.settings = settings;
    }

    private getTextProperties(properties: ILabelTextProperties): TextProperties {
        return {
            fontFamily: properties.fontFamily,
            fontSize: pixelConverter.fromPoint(properties.fontSize),
            fontWeight: properties.isBold ? "bold" : "normal",
            fontStyle: properties.isItalic ? "italic" : "normal",
        };
    }

    public updateDataLabelValue (value: string) {
        let maxDataLabelWidth = this.getMaxAllowedDataLabelWidth();
        let maxDataLabelHeight = this.rootSVGSize.height;
        if (this.categoryLabelExist()) {
            maxDataLabelHeight -= getLabelSize(this.categoryLabelGroupElement).height;
        }
        let textProperties = this.getTextProperties(this.settings.dataLabelSettings);
        textProperties.text = value;
        if (this.settings.dataLabelSettings.wordWrap && !this.prefixLabelExist() && !this.postfixLabelExist()) {
            updateLabelValueWithWrapping(
                this.dataLabelGroupElement, textProperties, value,
                maxDataLabelWidth, maxDataLabelHeight
            );
        } else {
            let dataLabelValue = textMeasurementService.getTailoredTextOrDefault(textProperties, maxDataLabelWidth);
            updateLabelValueWithoutWrapping(this.dataLabelGroupElement, dataLabelValue, value);
        }
    }

    private getMaxAllowedDataLabelWidth () {
        let maxWidth = this.getMaxAllowedWidthWithStroke();
        if (this.prefixLabelExist()) {
            maxWidth -= (getLabelSize(this.prefixLabelGroupElement).width + this.getPreFixLabelSpacing());
        }
        if (this.postfixLabelExist()) {
            maxWidth -= (getLabelSize(this.postfixLabelGroupElement).width + this.getPostFixLabelSpacing());
        }
        return maxWidth;
    }

    public updateDataLabelTextStyle() {
        updateLabelStyles(this.dataLabelGroupElement, this.settings.dataLabelSettings);
    }

    public updateDataLabelTransform() {
        let dataLabelTextElement: Selection<BaseType, any, any, any> = this.dataLabelGroupElement.select("text");
        let x: number;
        let y = this.getYForTopRow();
        let prefixLabelSize = getLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = getLabelSize(this.dataLabelGroupElement);
        let postfixLabelSize = getLabelSize(this.postfixLabelGroupElement);
        let prefixSpacing = this.getPreFixLabelSpacing();
        let postfixSpacing = this.getPostFixLabelSpacing();

        if (this.settings.general.alignment === "center") {
            if (this.prefixLabelExist() || this.postfixLabelExist()) {
                let totalWidth = prefixLabelSize.width + prefixSpacing + dataLabelSize.width + postfixSpacing + postfixLabelSize.width;
                x = this.rootSVGSize.width / 2 - totalWidth / 2 + prefixLabelSize.width + prefixSpacing;
                dataLabelTextElement.attr("text-anchor", "start");
            } else {
                x = this.rootSVGSize.width / 2;
                dataLabelTextElement.attr("text-anchor", "middle");
            }
            x += this.settings.general.alignmentSpacing;
        } else if (this.settings.general.alignment === "left") {
            if (this.prefixLabelExist()) {
                x = this.settings.general.alignmentSpacing + prefixLabelSize.width + prefixSpacing;
                dataLabelTextElement.attr("text-anchor", "start");
            } else {
                x = this.settings.general.alignmentSpacing;
                dataLabelTextElement.attr("text-anchor", "start");
            }
        } else if (this.settings.general.alignment === "right") {
            if (this.postfixLabelExist()) {
                x = this.rootSVGSize.width - this.settings.general.alignmentSpacing - postfixLabelSize.width - postfixSpacing;
                dataLabelTextElement.attr("text-anchor", "end");
            } else {
                x = this.rootSVGSize.width - this.settings.general.alignmentSpacing;
                dataLabelTextElement.attr("text-anchor", "end");
            }
        }
        this.dataLabelGroupElement.attr("transform", translate(x, y));
    }

    public updatePrefixLabelTransform() {
        let prefixLabelTextElement: Selection<BaseType, any, any, any> = this.prefixLabelGroupElement.select("text");
        let x: number;
        let y = this.getYForTopRow();
        let prefixLabelSize = getLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = getLabelSize(this.dataLabelGroupElement);
        let postfixLabelSize = getLabelSize(this.postfixLabelGroupElement);
        let prefixSpacing = this.getPreFixLabelSpacing();
        let postfixSpacing = this.getPostFixLabelSpacing();

        if (this.settings.general.alignment === "center") {
            let totalWidth = prefixLabelSize.width + prefixSpacing + dataLabelSize.width + postfixSpacing + postfixLabelSize.width;
            x = this.rootSVGSize.width / 2 - totalWidth / 2;
            x += this.settings.general.alignmentSpacing;
            prefixLabelTextElement.attr("text-anchor", "start");
        } else if (this.settings.general.alignment === "left") {
            x = this.settings.general.alignmentSpacing;
            prefixLabelTextElement.attr("text-anchor", "start");
        } else if (this.settings.general.alignment === "right") {
            x = this.rootSVGSize.width - this.settings.general.alignmentSpacing - prefixSpacing - dataLabelSize.width - postfixSpacing - postfixLabelSize.width;
            prefixLabelTextElement.attr("text-anchor", "end");
        }
        // prefixLabelTextElement.attr("x", x).attr("y", y);
        this.prefixLabelGroupElement.attr("transform", translate(x, y));
    }

    public updatePostfixLabelTransform() {
        let postfixLabelTextElement: Selection<BaseType, any, any, any> = this.postfixLabelGroupElement.select("text");
        let x: number;
        let y = this.getYForTopRow();
        let prefixLabelSize = getLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = getLabelSize(this.dataLabelGroupElement);
        let postfixLabelSize = getLabelSize(this.postfixLabelGroupElement);
        let prefixSpacing = this.getPreFixLabelSpacing();
        let postfixSpacing = this.getPostFixLabelSpacing();

        if (this.settings.general.alignment === "center") {
            let totalWidth = prefixLabelSize.width + prefixSpacing + dataLabelSize.width + postfixSpacing + postfixLabelSize.width;
            x = this.rootSVGSize.width / 2 - totalWidth / 2 + prefixLabelSize.width + prefixSpacing + dataLabelSize.width + postfixSpacing;
            x += this.settings.general.alignmentSpacing;
            postfixLabelTextElement.attr("text-anchor", "start");
        } else if (this.settings.general.alignment === "left") {
            x = this.settings.general.alignmentSpacing + prefixLabelSize.width + prefixSpacing + dataLabelSize.width + postfixSpacing;
            postfixLabelTextElement.attr("text-anchor", "start");
        } else if (this.settings.general.alignment === "right") {
            x = this.rootSVGSize.width - this.settings.general.alignmentSpacing;
            postfixLabelTextElement.attr("text-anchor", "end");
        }
        // postfixLabelTextElement.attr("x", x).attr("y", y);
        this.postfixLabelGroupElement.attr("transform", translate(x, y));
    }

    public updateCategoryLabelTransform() {
        let categoryLabelElement: Selection<BaseType, any, any, any> = this.categoryLabelGroupElement.select("text");
        let x: number;
        let dataLabelCategoryLabelSpacing = 5;
        let dataLabelSize = getLabelSize(this.dataLabelGroupElement);
        let categoryLabelSize = getLabelSize(this.categoryLabelGroupElement);
        let totalHeight = dataLabelSize.height + dataLabelCategoryLabelSpacing + categoryLabelSize.height;

        // let y = this.rootSVGSize.height / 2 + categoryLabelSize.height / 2 + dataLabelCategoryLabelSpacing / 2;
        // let y = this.rootSVGSize.height / 2 - totalHeight / 2 + dataLabelSize.height + categoryLabelSize.height;
        let y = (0 - categoryLabelSize.y) + (this.rootSVGSize.height - categoryLabelSize.height) / 2 + dataLabelSize.height / 2;

        if (this.settings.general.alignment === "center") {
            x = this.rootSVGSize.width / 2;
            x += this.settings.general.alignmentSpacing;
            categoryLabelElement.attr("text-anchor", "middle");
        } else if (this.settings.general.alignment === "left") {
            x = this.settings.general.alignmentSpacing;
            categoryLabelElement.attr("text-anchor", "start");
        } else if (this.settings.general.alignment === "right") {
            x = this.rootSVGSize.width - this.settings.general.alignmentSpacing;
            categoryLabelElement.attr("text-anchor", "end");
        }
        this.categoryLabelGroupElement.attr("transform", translate(x, y));
    }

    private getYForTopRow() {
        let y: number;
        let dataLabelSize = getLabelSize(this.dataLabelGroupElement);
        let categoryLabelSize = getLabelSize(this.categoryLabelGroupElement);
        if (this.settings.categoryLabelSettings.show) {
            y = (0 - dataLabelSize.y) + (this.rootSVGSize.height - dataLabelSize.height) / 2 - categoryLabelSize.height / 2;
        } else {
            y = (0 - dataLabelSize.y) + (this.rootSVGSize.height - dataLabelSize.height) / 2;
        }
        return y;
    }

    private getPreFixLabelSpacing() {
        if (this.prefixLabelExist()) {
            return this.settings.prefixSettings.spacing;
        } else {
            return 0;
        }
    }

    private getPostFixLabelSpacing() {
        if (this.postfixLabelExist()) {
            return this.settings.postfixSettings.spacing;
        } else {
            return 0;
        }
    }

    public removeDataLabel() {
        this.dataLabelGroupElement.remove();
        this.dataLabelGroupElement = undefined;
    }

    public removeCategoryLabel() {
        this.categoryLabelGroupElement.remove();
        this.categoryLabelGroupElement = undefined;
    }

    public removePrefixLabel() {
        this.prefixLabelGroupElement.remove();
        this.prefixLabelGroupElement = undefined;
    }

    public removePostfixLabel() {
        this.postfixLabelGroupElement.remove();
        this.postfixLabelGroupElement = undefined;
    }

    private getMaxAllowedWidthWithStroke() {
        let maxWidth = this.rootSVGSize.width;
        if (this.settings.strokeSettings.show) {
            maxWidth -= this.settings.strokeSettings.strokeWidth * 2.1;
        }
        return maxWidth;
    }

    public updateCategoryLabelValue(value: string) {
        let maxCategoryLabelWidth = this.getMaxAllowedWidthWithStroke();
        let textProperties = this.getTextProperties(this.settings.categoryLabelSettings);
        textProperties.text = value;
        let categoryLabelValue = textMeasurementService.getTailoredTextOrDefault(textProperties, maxCategoryLabelWidth);
        updateLabelValueWithoutWrapping(this.categoryLabelGroupElement, categoryLabelValue, value);
    }

    public updatePrefixLabelValue(value: string) {
        updateLabelValueWithoutWrapping(this.prefixLabelGroupElement, value, value);
    }

    public updatePostfixLabelValue(value: string) {
        updateLabelValueWithoutWrapping(this.postfixLabelGroupElement, value, value);
    }

    public updateCategoryLabelStyles() {
        updateLabelStyles(this.categoryLabelGroupElement, this.settings.categoryLabelSettings);
    }

    public updatePrefixLabelStyles() {
        updateLabelStyles(this.prefixLabelGroupElement, this.settings.prefixSettings);
    }

    public updatePostfixLabelStyles() {
        updateLabelStyles(this.postfixLabelGroupElement, this.settings.postfixSettings);
    }

    public dataLabelExist() {
        return elementExist(this.dataLabelGroupElement);
    }

    public categoryLabelExist() {
        return elementExist(this.categoryLabelGroupElement);
    }

    public prefixLabelExist() {
        return elementExist(this.prefixLabelGroupElement);
    }

    public postfixLabelExist() {
        return elementExist(this.postfixLabelGroupElement);
    }

    public createDataLabel() {
        this.dataLabelGroupElement = createLabelElement(this.rootSVGElement, this.dataLabelGroupElement, AdvanceCardClassNames.DataLabelClass);
    }

    public createCategoryLabel() {
        this.categoryLabelGroupElement = createLabelElement(this.rootSVGElement, this.categoryLabelGroupElement, AdvanceCardClassNames.CategoryLabelClass);
    }

    public createPrefixLabel() {
        this.prefixLabelGroupElement = createLabelElement(this.rootSVGElement, this.prefixLabelGroupElement, AdvanceCardClassNames.PrefixLabelClass);
    }

    public createPostfixLabel() {
        this.postfixLabelGroupElement = createLabelElement(this.rootSVGElement, this.postfixLabelGroupElement, AdvanceCardClassNames.PostfixLabelClass);
    }

    public updateDataLabelColor(color: string) {
        updateLabelColor(this.dataLabelGroupElement, color);
    }

    public updateCategoryLabelColor(color: string) {
        updateLabelColor(this.categoryLabelGroupElement, color);
    }

    public updatePrefixLabelColor(color: string) {
        updateLabelColor(this.prefixLabelGroupElement, color);
    }

    public updatePostfixLabelColor(color: string) {
        updateLabelColor(this.postfixLabelGroupElement, color);
    }

    public fillExists() {
        return elementExist(this.fillGroupElement);
    }

    public strokeExists() {
        return elementExist(this.strokeGroupElement);
    }

    private createCardBackground() {
        this.cardBackgroundGroupElement = this.rootSVGElement.insert("g", "g")
            .classed(AdvanceCardClassNames.CardBackgroundClass, true);
    }

    public createFill() {
        // let obj: string;
        // if (select("." + AdvanceCardClassNames.StrokeClass).empty()) {
        //     obj = "g";
        // } else {
        //     obj = "." + AdvanceCardClassNames.StrokeClass;
        // }
        if (!elementExist(this.cardBackgroundGroupElement)) {
            this.createCardBackground();
        }
        this.fillGroupElement = this.cardBackgroundGroupElement.insert("g", "g")
            .classed(AdvanceCardClassNames.FillClass, true);

        this.fillGroupElement.append("rect")
            .attr("width", this.rootSVGSize.width)
            .attr("height", this.rootSVGSize.height);
    }

    public createStroke() {
        if (!elementExist(this.cardBackgroundGroupElement)) {
            this.createCardBackground();
        }
        this.strokeGroupElement = this.cardBackgroundGroupElement.append("g")
            .classed(AdvanceCardClassNames.StrokeClass, true);

        this.strokeGroupElement.append("defs")
            .append("clipPath")
            .attr("id", AdvanceCardIdNames.StrokePathClipPathId)
            .append("use");
    }

    public updateFill(fillSettings: FillSettings, fillColor: string) {
        let fillRect = this.fillGroupElement.select("rect");
        fillRect.style("fill", fillColor || "none")
            .attr("width", this.rootSVGSize.width)
            .attr("height", this.rootSVGSize.height);
        if (fillSettings.showImage && !StringExtensions.isNullOrUndefinedOrWhiteSpaceString(fillSettings.imageURL)) {
            let fillImage = this.fillGroupElement.select("image");
            if (fillImage.empty()) {
                fillImage = this.fillGroupElement.append("image");
            }
            fillImage.attr("xlink:href", fillSettings.imageURL)
                .attr("width", this.rootSVGSize.width - fillSettings.imagePadding)
                .attr("height", this.rootSVGSize.height - fillSettings.imagePadding)
                .attr("x", fillSettings.imagePadding / 2)
                .attr("y", fillSettings.imagePadding / 2);
        } else if (elementExist(this.fillGroupElement.select("image"))) {
            this.fillGroupElement.select("image").remove();
        }
        this.fillGroupElement.style("opacity", 1 - fillSettings.transparency / 100);

        if (!select("#" + AdvanceCardIdNames.StrokePathClipPathId).empty()) {
            this.fillGroupElement.attr("clip-path", "url(#" + AdvanceCardIdNames.StrokePathClipPathId + ")");
        }
    }

    public updateStroke(strokeSettings: StrokeSettings) {
        let pathProperties: SVGRectanglePathProperties = {
            x: strokeSettings.strokeWidth / 2,
            y: strokeSettings.strokeWidth / 2,
            width: this.rootSVGSize.width - strokeSettings.strokeWidth - 3,
            height: this.rootSVGSize.height - strokeSettings.strokeWidth - 3,
            cornerRadius: strokeSettings.cornerRadius,
            topLeftRound: strokeSettings.topLeft,
            topRightRound: strokeSettings.topRight,
            bottomLeftRound: strokeSettings.bottomLeft,
            bottomRightRound: strokeSettings.bottomRight,
            topLeftRoundInward: strokeSettings.topLeftInward,
            topRightRoundInward: strokeSettings.topRightInward,
            bottomLeftRoundInward: strokeSettings.bottomLeftInward,
            bottomRightRoundInward: strokeSettings.bottomRightInward,
        };

        let pathData = createSVGRectanglePath(pathProperties);

        let strokePath = this.strokeGroupElement.select("path");
        if (strokePath.empty()) {
            strokePath = this.strokeGroupElement.append("path");
        }
        strokePath.attr("d", pathData)
            .attr("id", AdvanceCardIdNames.StrokePathId)
            .attr("fill", "none")
            .attr("stroke", strokeSettings.strokeColor || "none")
            .attr("stroke-width", strokeSettings.strokeWidth)
            .style("stroke-dasharray", (d) => {
                let strokeDasharray = "";
                if (!StringExtensions.isNullOrUndefinedOrWhiteSpaceString(strokeSettings.strokeArray)) {
                    strokeDasharray = strokeSettings.strokeArray;
                } else {
                    // convert strokeSettings.strokeType to number then check
                    if (+strokeSettings.strokeType === 1) {
                        strokeDasharray = strokeSettings.strokeWidth * 3 + " " + strokeSettings.strokeWidth * 0.3;
                    } else if (+strokeSettings.strokeType === 2) {
                        strokeDasharray = strokeSettings.strokeWidth + " " + strokeSettings.strokeWidth;
                    }
                }
                return strokeDasharray;
            })
            .style("stroke-linecap", strokeSettings.strokeLineCap);

        this.strokeGroupElement.select("#" + AdvanceCardIdNames.StrokePathClipPathId)
            .select("use")
            .attr("xlink:href", "#stroke-path");
    }

    public removeFill() {
        this.fillGroupElement.remove();
        this.fillGroupElement = undefined;
    }

    public removeStroke() {
        this.strokeGroupElement.remove();
        this.strokeGroupElement = undefined;
    }

    public getRootElement() {
        return this.rootSVGElement;
    }

    public getConditionalColors(originalValue: number, colorType: string, conditionSettings: ConditionSettings) {
        if (conditionSettings.show === true) {
            for (let conditionNumber = 1; conditionNumber <= conditionSettings.conditionNumbers; conditionNumber++) {
                const compareValue: number =  conditionSettings["value" + conditionNumber];
                if (compareValue !== null || compareValue !== undefined) {
                    const condition: string = conditionSettings["condition" + conditionNumber];
                    let conditionResult: boolean;
                    switch (condition) {
                        case ">":
                            conditionResult = originalValue > compareValue;
                            break;
                        case ">=":
                            conditionResult = originalValue >= compareValue;
                            break;
                        case "=":
                            conditionResult = originalValue === compareValue;
                            break;
                        case "<":
                            conditionResult = originalValue < compareValue;
                            break;
                        case "<=":
                            conditionResult = originalValue <= compareValue;
                            break;
                        default:
                            break;
                    }
                    if (conditionResult === true) {
                        if (colorType === "F") {
                            return conditionSettings["foregroundColor" + conditionNumber];
                        } else if (colorType === "B") {
                            return conditionSettings["backgroundColor" + conditionNumber];
                        }
                        break;
                    }
                }
            }
        }
        return null;
    }
}