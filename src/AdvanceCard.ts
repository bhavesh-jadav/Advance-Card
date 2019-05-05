/**
 *
 * Create all the DOM Elements for Advance Card
 *
 */
"use strict";
import { BaseType, select, Selection } from "d3-selection";
import { stringExtensions as StringExtensions, textMeasurementService } from "powerbi-visuals-utils-formattingutils";
import { manipulation } from "powerbi-visuals-utils-svgutils";
import { translate } from "powerbi-visuals-utils-svgutils/lib/manipulation";
import { pixelConverter } from "powerbi-visuals-utils-typeutils";

import {
    CreateLabelElement,
    CreateSVGRectanglePath,
    ElementExist,
    GetLabelSize,
    ILabelTextProperties,
    SVGRectanglePathProperties,
    UpdateLabelColor,
    UpdateLabelStyles,
    UpdateLabelValueWithoutWrapping,
    UpdateLabelValueWithWrapping
} from "./AdvanceCardUtils";
import { AdvanceCardVisualSettings, ConditionSettings, FillSettings, StrokeSettings } from "./settings";

import Translate = manipulation.translate;
import TextMeasurementService = textMeasurementService.textMeasurementService;
import TextProperties = textMeasurementService.TextProperties;

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

    public SetSize(viewportWidth: number, viewportHeight: number, ) {
        this.rootSVGElement.attr("width", viewportWidth)
            .attr("height", viewportHeight);
        this.rootSVGSize = (this.rootSVGElement.node() as SVGElement).getBoundingClientRect() as SVGRect;
        // this.rootSVGSize = new DOMRect(0, 0, width, height)
    }

    public UpdateSettings (settings: AdvanceCardVisualSettings) {
        this.settings = settings;
    }

    private _getTextProperties(properties: ILabelTextProperties): TextProperties {
        let textProperties: TextProperties = {
            fontFamily: properties.fontFamily,
            fontSize: pixelConverter.fromPoint(properties.fontSize),
            fontWeight: properties.isBold ? "bold" : "normal",
            fontStyle: properties.isItalic ? "italic" : "normal",
        };
        return textProperties;
    }

    public UpdateDataLabelValue (value: string) {
        let maxDataLabelWidth = this._getMaxAllowedDataLabelWidth();
        let maxDataLabelHeight = this.rootSVGSize.height;
        if (this.CategoryLabelExist()) {
            maxDataLabelHeight -= GetLabelSize(this.categoryLabelGroupElement).height;
        }
        let textProperties = this._getTextProperties(this.settings.dataLabelSettings);
        textProperties.text = value;
        if (this.settings.dataLabelSettings.wordWrap && !this.PrefixLabelExist() && !this.PostfixLabelExist()) {
            UpdateLabelValueWithWrapping(
                this.dataLabelGroupElement, textProperties, value,
                maxDataLabelWidth, maxDataLabelHeight
            );
        } else {
            let dataLabelValue = TextMeasurementService.getTailoredTextOrDefault(textProperties, maxDataLabelWidth);
            UpdateLabelValueWithoutWrapping(this.dataLabelGroupElement, dataLabelValue, value);
        }
    }

    private _getMaxAllowedDataLabelWidth () {
        let maxWidth = this._getMaxAllowedWidthWithStroke()
        if (this.PrefixLabelExist()) {
            maxWidth -= (GetLabelSize(this.prefixLabelGroupElement).width + this._getPreFixLabelSpacing());
        }
        if (this.PostfixLabelExist()) {
            maxWidth -= (GetLabelSize(this.postfixLabelGroupElement).width + this._getPostFixLabelSpacing());
        }
        return maxWidth;
    }

    public UpdateDataLabelTextStyle() {
        UpdateLabelStyles(this.dataLabelGroupElement, this.settings.dataLabelSettings);
    }

    public UpdateDataLabelTransform() {
        let dataLabelTextElement: Selection<BaseType, any, any, any> = this.dataLabelGroupElement.select("text");
        let x: number;
        let y = this._getYForTopRow();
        let prefixLabelSize = GetLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
        let postfixLabelSize = GetLabelSize(this.postfixLabelGroupElement);
        let prefixSpacing = this._getPreFixLabelSpacing();
        let postfixSpacing = this._getPostFixLabelSpacing();

        if (this.settings.general.alignment === "center") {
            if (this.PrefixLabelExist() || this.PostfixLabelExist()) {
                let totalWidth = prefixLabelSize.width + prefixSpacing + dataLabelSize.width + postfixSpacing + postfixLabelSize.width;
                x = this.rootSVGSize.width / 2 - totalWidth / 2 + prefixLabelSize.width + prefixSpacing;
                dataLabelTextElement.attr("text-anchor", "start");
            } else {
                x = this.rootSVGSize.width / 2;
                dataLabelTextElement.attr("text-anchor", "middle");
            }
            x += this.settings.general.alignmentSpacing;
        } else if (this.settings.general.alignment === "left") {
            if (this.PrefixLabelExist()) {
                x = this.settings.general.alignmentSpacing + prefixLabelSize.width + prefixSpacing;
                dataLabelTextElement.attr("text-anchor", "start");
            } else {
                x = this.settings.general.alignmentSpacing;
                dataLabelTextElement.attr("text-anchor", "start");
            }
        } else if (this.settings.general.alignment === "right") {
            if (this.PostfixLabelExist()) {
                x = this.rootSVGSize.width - this.settings.general.alignmentSpacing - postfixLabelSize.width - postfixSpacing;
                dataLabelTextElement.attr("text-anchor", "end");
            } else {
                x = this.rootSVGSize.width - this.settings.general.alignmentSpacing;
                dataLabelTextElement.attr("text-anchor", "end");
            }
        }
        this.dataLabelGroupElement.attr("transform", translate(x, y));
    }

    public UpdatePrefixLabelTransform() {
        let prefixLabelTextElement: Selection<BaseType, any, any, any> = this.prefixLabelGroupElement.select("text");
        let x: number;
        let y = this._getYForTopRow();
        let prefixLabelSize = GetLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
        let postfixLabelSize = GetLabelSize(this.postfixLabelGroupElement);
        let prefixSpacing = this._getPreFixLabelSpacing();
        let postfixSpacing = this._getPostFixLabelSpacing();

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
        this.prefixLabelGroupElement.attr("transform", Translate(x, y));
    }

    public UpdatePostfixLabelTransform() {
        let postfixLabelTextElement: Selection<BaseType, any, any, any> = this.postfixLabelGroupElement.select("text");
        let x: number;
        let y = this._getYForTopRow();
        let prefixLabelSize = GetLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
        let postfixLabelSize = GetLabelSize(this.postfixLabelGroupElement);
        let prefixSpacing = this._getPreFixLabelSpacing();
        let postfixSpacing = this._getPostFixLabelSpacing();

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
        this.postfixLabelGroupElement.attr("transform", Translate(x, y));
    }

    public UpdateCategoryLabelTransform() {
        let categoryLabelElement: Selection<BaseType, any, any, any> = this.categoryLabelGroupElement.select("text");
        let x: number;
        let dataLabelCategoryLabelSpacing = 5;
        let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
        let categoryLabelSize = GetLabelSize(this.categoryLabelGroupElement);
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
        this.categoryLabelGroupElement.attr("transform", Translate(x, y));
    }

    private _getYForTopRow() {
        let y: number;
        let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
        let categoryLabelSize = GetLabelSize(this.categoryLabelGroupElement);
        if (this.settings.categoryLabelSettings.show) {
            y = (0 - dataLabelSize.y) + (this.rootSVGSize.height - dataLabelSize.height) / 2 - categoryLabelSize.height / 2;
        } else {
            y = (0 - dataLabelSize.y) + (this.rootSVGSize.height - dataLabelSize.height) / 2;
        }
        return y;
    }

    private _getPreFixLabelSpacing() {
        if (this.PrefixLabelExist()) {
            return this.settings.prefixSettings.spacing;
        } else {
            return 0;
        }
    }

    private _getPostFixLabelSpacing() {
        if (this.PostfixLabelExist()) {
            return this.settings.postfixSettings.spacing;
        } else {
            return 0;
        }
    }

    public RemoveDataLabel() {
        this.dataLabelGroupElement.remove();
        this.dataLabelGroupElement = undefined;
    }

    public RemoveCategoryLabel() {
        this.categoryLabelGroupElement.remove();
        this.categoryLabelGroupElement = undefined;
    }

    public RemovePrefixLabel() {
        this.prefixLabelGroupElement.remove();
        this.prefixLabelGroupElement = undefined;
    }

    public RemovePostfixLabel() {
        this.postfixLabelGroupElement.remove();
        this.postfixLabelGroupElement = undefined;
    }

    private _getMaxAllowedWidthWithStroke() {
        let maxWidth = this.rootSVGSize.width;
        if (this.settings.strokeSettings.show) {
            maxWidth -= this.settings.strokeSettings.strokeWidth * 2.1;
        }
        return maxWidth;
    }

    public UpdateCategoryLabelValue(value: string) {
        let maxCategoryLabelWidth = this._getMaxAllowedWidthWithStroke();
        let textProperties = this._getTextProperties(this.settings.categoryLabelSettings);
        textProperties.text = value;
        let categoryLabelValue = TextMeasurementService.getTailoredTextOrDefault(textProperties, maxCategoryLabelWidth);
        UpdateLabelValueWithoutWrapping(this.categoryLabelGroupElement, categoryLabelValue, value);
    }

    public UpdatePrefixLabelValue(value: string) {
        UpdateLabelValueWithoutWrapping(this.prefixLabelGroupElement, value, value);
    }

    public UpdatePostfixLabelValue(value: string) {
        UpdateLabelValueWithoutWrapping(this.postfixLabelGroupElement, value, value);
    }

    public UpdateCategoryLabelStyles() {
        UpdateLabelStyles(this.categoryLabelGroupElement, this.settings.categoryLabelSettings);
    }

    public UpdatePrefixLabelStyles() {
        UpdateLabelStyles(this.prefixLabelGroupElement, this.settings.prefixSettings);
    }

    public UpdatePostfixLabelStyles() {
        UpdateLabelStyles(this.postfixLabelGroupElement, this.settings.postfixSettings);
    }

    public DataLabelExist() {
        return ElementExist(this.dataLabelGroupElement);
    }

    public CategoryLabelExist() {
        return ElementExist(this.categoryLabelGroupElement);
    }

    public PrefixLabelExist() {
        return ElementExist(this.prefixLabelGroupElement);
    }

    public PostfixLabelExist() {
        return ElementExist(this.postfixLabelGroupElement);
    }

    public CreateDataLabel() {
        this.dataLabelGroupElement = CreateLabelElement(this.rootSVGElement, this.dataLabelGroupElement, AdvanceCardClassNames.DataLabelClass);
    }

    public CreateCategoryLabel() {
        this.categoryLabelGroupElement = CreateLabelElement(this.rootSVGElement, this.categoryLabelGroupElement, AdvanceCardClassNames.CategoryLabelClass);
    }

    public CreatePrefixLabel() {
        this.prefixLabelGroupElement = CreateLabelElement(this.rootSVGElement, this.prefixLabelGroupElement, AdvanceCardClassNames.PrefixLabelClass);
    }

    public CreatePostfixLabel() {
        this.postfixLabelGroupElement = CreateLabelElement(this.rootSVGElement, this.postfixLabelGroupElement, AdvanceCardClassNames.PostfixLabelClass);
    }

    public UpdateDataLabelColor(color: string) {
        UpdateLabelColor(this.dataLabelGroupElement, color);
    }

    public UpdateCategoryLabelColor(color: string) {
        UpdateLabelColor(this.categoryLabelGroupElement, color);
    }

    public UpdatePrefixLabelColor(color: string) {
        UpdateLabelColor(this.prefixLabelGroupElement, color);
    }

    public UpdatePostfixLabelColor(color: string) {
        UpdateLabelColor(this.postfixLabelGroupElement, color);
    }

    public FillExists() {
        return ElementExist(this.fillGroupElement);
    }

    public StrokeExists() {
        return ElementExist(this.strokeGroupElement);
    }

    private _createCardBackground() {
        this.cardBackgroundGroupElement = this.rootSVGElement.insert("g", "g")
            .classed(AdvanceCardClassNames.CardBackgroundClass, true);
    }

    public CreateFill() {
        // let obj: string;
        // if (select("." + AdvanceCardClassNames.StrokeClass).empty()) {
        //     obj = "g";
        // } else {
        //     obj = "." + AdvanceCardClassNames.StrokeClass;
        // }
        if (!ElementExist(this.cardBackgroundGroupElement)) {
            this._createCardBackground();
        }
        this.fillGroupElement = this.cardBackgroundGroupElement.insert("g", "g")
            .classed(AdvanceCardClassNames.FillClass, true);

        this.fillGroupElement.append("rect")
            .attr("width", this.rootSVGSize.width)
            .attr("height", this.rootSVGSize.height);
    }

    public CreateStroke() {
        if (!ElementExist(this.cardBackgroundGroupElement)) {
            this._createCardBackground();
        }
        this.strokeGroupElement = this.cardBackgroundGroupElement.append("g")
            .classed(AdvanceCardClassNames.StrokeClass, true);

        this.strokeGroupElement.append("defs")
            .append("clipPath")
            .attr("id", AdvanceCardIdNames.StrokePathClipPathId)
            .append("use");
    }

    public UpdateFill(fillSettings: FillSettings, fillColor: string) {
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
        } else if (ElementExist(this.fillGroupElement.select("image"))) {
            this.fillGroupElement.select("image").remove();
        }
        this.fillGroupElement.style("opacity", 1 - fillSettings.transparency / 100);

        if (!select("#" + AdvanceCardIdNames.StrokePathClipPathId).empty()) {
            this.fillGroupElement.attr("clip-path", "url(#" + AdvanceCardIdNames.StrokePathClipPathId + ")");
        }
    }

    public UpdateStroke(strokeSettings: StrokeSettings) {
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

        let pathData = CreateSVGRectanglePath(pathProperties);

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

    public RemoveFill() {
        this.fillGroupElement.remove();
        this.fillGroupElement = undefined;
    }

    public RemoveStroke() {
        this.strokeGroupElement.remove();
        this.strokeGroupElement = undefined;
    }

    public GetRootElement() {
        return this.rootSVGElement;
    }

    public GetConditionalColors(originalValue: number, colorType: string, conditionSettings: ConditionSettings) {
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