/**
 *
 * Create all the DOM Elements for Advance Card
 *
 */

"use strict";

let version = "2.0.1";
let helpUrl = "https://github.com/bhavesh-jadav/Advance-Card/wiki";

import "./../style/visual.less";
import {
    valueFormatter,
    textMeasurementService,
    stringExtensions as StringExtensions,
    displayUnitSystemType
} from "powerbi-visuals-utils-formattingutils";
import { pixelConverter as PixelConverter } from "powerbi-visuals-utils-typeutils";
import {
    AdvanceCardVisualSettings, FixLabelSettings, DataLabelSettings, CategoryLabelSettings,
    FillSettings, StrokeSettings, ConditionSettings, TooltipSettings, GeneralSettings
} from "./settings";
import { Selection, BaseType, select, mouse } from "d3-selection";
import { valueType } from "powerbi-visuals-utils-typeutils";
import { manipulation } from "powerbi-visuals-utils-svgutils";
import { ElementExist, CreateLabelElement, UpdateLabelValue, UpdateLabelStyles, GetLabelSize, UpdateLabelColor, CreateSVGRectanglePath, SVGRectanglePathProperties } from "./AdvanceCardUtils";

import powerbi from "powerbi-visuals-api";
import Translate = manipulation.translate;
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import ValueType = valueType.ValueType;
import ExtendedType = valueType.ExtendedType;
import ValueFormatter = valueFormatter.valueFormatter;
import TextMeasurementService = textMeasurementService.textMeasurementService;
import TextProperties = textMeasurementService.TextProperties;
import DisplayUnitSystemType = displayUnitSystemType.DisplayUnitSystemType;

enum AdvanceCardClassNames {
    SVGClass= "root-svg",
    DataLabelClass = "data-label",
    CategoryLabelClass = "category-label",
    PrefixLabelClass = "prefix-label",
    PostfixLabelClass = "postfix-label",
    FillClass = "card-fill",
    StrokeClass = "card-stroke",
}

enum AdvanceCardIdNames {
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
    private rootSVGSize: DOMRect | ClientRect;

    constructor(private target: HTMLElement) {
        try {
            this.rootSVGElement = select(this.target).append("svg")
                .classed(AdvanceCardClassNames.SVGClass, true);
        } catch (err) {
            throw err;
        }
    }

    public SetSize(viewportWidth: number, viewportHeight: number, settings: AdvanceCardVisualSettings) {
        this.rootSVGElement.attr("width", viewportWidth)
            .attr("height", viewportHeight);
        let strokeWidth = settings.strokeSettings.show ? settings.strokeSettings.strokeWidth : 0;
        let minX = -strokeWidth / 2;
        let minY = minX;
        let width = viewportWidth + strokeWidth;
        let height = viewportHeight + strokeWidth;
        this.rootSVGElement.attr("viewBox", minX + " " + minY + " " + width + " " + height);
        this.rootSVGSize = (this.rootSVGElement.node() as HTMLElement).getBoundingClientRect();
    }

    public UpdateDataLabelValue (value: string) {
        UpdateLabelValue(this.dataLabelGroupElement, value);
    }

    public UpdateDataLabelTextStyle(dataLabelSettings: DataLabelSettings) {
        UpdateLabelStyles(this.dataLabelGroupElement, dataLabelSettings);
    }

    public UpdateDataLabelTransform(settings: AdvanceCardVisualSettings) {
        let dataLabelTextElement: Selection<BaseType, any, any, any> = this.dataLabelGroupElement.select("text");
        let x: number;
        let y = this._getYForTopRow(settings);
        let prefixLabelSize = GetLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
        let postfixLabelSize = GetLabelSize(this.postfixLabelGroupElement);

        if (settings.general.alignment === "center") {
            if (this.PrefixLabelExist() || this.PostfixLabelExist()) {
                let totalWidth = prefixLabelSize.width + this._getFixLabelSpacing(settings.prefixSettings) + dataLabelSize.width + this._getFixLabelSpacing(settings.postfixSettings) + postfixLabelSize.width;
                x = this.rootSVGSize.width / 2 - totalWidth / 2 + prefixLabelSize.width + this._getFixLabelSpacing(settings.prefixSettings);
                dataLabelTextElement.attr("text-anchor", "start");
            } else {
                x = this.rootSVGSize.width / 2;
                dataLabelTextElement.attr("text-anchor", "middle");
            }
        } else if (settings.general.alignment === "left") {
            if (this.PrefixLabelExist()) {
                x = settings.general.alignmentSpacing + prefixLabelSize.width + this._getFixLabelSpacing(settings.prefixSettings);
                dataLabelTextElement.attr("text-anchor", "start");
            } else {
                x = settings.general.alignmentSpacing;
                dataLabelTextElement.attr("text-anchor", "start");
            }
        } else if (settings.general.alignment === "right") {
            if (this.PostfixLabelExist()) {
                x = this.rootSVGSize.width - settings.general.alignmentSpacing - postfixLabelSize.width - this._getFixLabelSpacing(settings.postfixSettings);
                dataLabelTextElement.attr("text-anchor", "end");
            } else {
                x = this.rootSVGSize.width - settings.general.alignmentSpacing;
                dataLabelTextElement.attr("text-anchor", "end");
            }
        }

        dataLabelTextElement.attr("x", x).attr("y", y);
    }

    public UpdatePrefixLabelTransform(settings: AdvanceCardVisualSettings) {
        let prefixLabelTextElement: Selection<BaseType, any, any, any> = this.prefixLabelGroupElement.select("text");
        let x: number;
        let y = this._getYForTopRow(settings);
        let prefixLabelSize = GetLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
        let postfixLabelSize = GetLabelSize(this.postfixLabelGroupElement);
        if (settings.general.alignment === "center") {
            let totalWidth = prefixLabelSize.width + this._getFixLabelSpacing(settings.prefixSettings) + dataLabelSize.width + this._getFixLabelSpacing(settings.postfixSettings) + postfixLabelSize.width;
            console.log("prefix", prefixLabelSize.width, dataLabelSize.width, postfixLabelSize.width, totalWidth)
            x = this.rootSVGSize.width / 2 - totalWidth / 2;
            prefixLabelTextElement.attr("text-anchor", "start");
        } else if (settings.general.alignment === "left") {
            x = settings.general.alignmentSpacing;
            prefixLabelTextElement.attr("text-anchor", "start");
        } else if (settings.general.alignment === "right") {
            x = this.rootSVGSize.width - settings.general.alignmentSpacing - this._getFixLabelSpacing(settings.prefixSettings) - dataLabelSize.width - this._getFixLabelSpacing(settings.postfixSettings) - postfixLabelSize.width;
            prefixLabelTextElement.attr("text-anchor", "end");
        }
        prefixLabelTextElement.attr("x", x).attr("y", y);
    }

    public UpdatePostfixLabelTransform(settings: AdvanceCardVisualSettings) {
        let postfixLabelTextElement: Selection<BaseType, any, any, any> = this.postfixLabelGroupElement.select("text");
        let x: number;

        let y = this._getYForTopRow(settings);

        let prefixLabelSize = GetLabelSize(this.prefixLabelGroupElement);
        let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
        let postfixLabelSize = GetLabelSize(this.postfixLabelGroupElement);
        if (settings.general.alignment === "center") {
            let totalWidth = prefixLabelSize.width + this._getFixLabelSpacing(settings.prefixSettings) + dataLabelSize.width + this._getFixLabelSpacing(settings.postfixSettings) + postfixLabelSize.width;
            console.log("postfix", prefixLabelSize.width, dataLabelSize.width, postfixLabelSize.width, totalWidth)
            x = this.rootSVGSize.width / 2 - totalWidth / 2 + prefixLabelSize.width + this._getFixLabelSpacing(settings.prefixSettings) + dataLabelSize.width + this._getFixLabelSpacing(settings.postfixSettings);
            postfixLabelTextElement.attr("text-anchor", "start");
        } else if (settings.general.alignment === "left") {
            x = settings.general.alignmentSpacing + prefixLabelSize.width + this._getFixLabelSpacing(settings.prefixSettings) + dataLabelSize.width + this._getFixLabelSpacing(settings.postfixSettings);
            postfixLabelTextElement.attr("text-anchor", "start");
        } else if (settings.general.alignment === "right") {
            x = this.rootSVGSize.width - settings.general.alignmentSpacing;
            postfixLabelTextElement.attr("text-anchor", "end");
        }
        console.log(x);
        postfixLabelTextElement.attr("x", x).attr("y", y);
    }

    public UpdateCategoryLabelTransform(settings: AdvanceCardVisualSettings) {
        let categoryLabelElement: Selection<BaseType, any, any, any> = this.categoryLabelGroupElement.select("text");
        let x: number;
        let dataLabelCategoryLabelSpacing = 5;
        let categoryLabelSize = GetLabelSize(this.categoryLabelGroupElement);

        let y = this.rootSVGSize.height / 2 + categoryLabelSize.height / 2 + dataLabelCategoryLabelSpacing / 2;

        if (settings.general.alignment === "center") {
            x = this.rootSVGSize.width / 2;
            categoryLabelElement.attr("text-anchor", "middle");
        } else if (settings.general.alignment === "left") {
            x = settings.general.alignmentSpacing;
            categoryLabelElement.attr("text-anchor", "start");
        } else if (settings.general.alignment === "right") {
            x = this.rootSVGSize.width - settings.general.alignmentSpacing;
            categoryLabelElement.attr("text-anchor", "end");
        }
        categoryLabelElement.attr("x", x).attr("y", y);
    }

    private _getYForTopRow(settings: AdvanceCardVisualSettings) {
        let y: number;
        if (settings.categoryLabelSettings.show) {
            let dataLabelCategoryLabelSpacing = 5;
            let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
            y = this.rootSVGSize.height / 2 - dataLabelSize.height / 2 - dataLabelCategoryLabelSpacing / 2;
        } else {
            y = this.rootSVGSize.height / 2;
        }
        return y;
    }

    private _getFixLabelSpacing(fixSettings: FixLabelSettings) {
        if (fixSettings.show) {
            return fixSettings.spacing;
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

    public UpdateCategoryLabelValue(value: string) {
        UpdateLabelValue(this.categoryLabelGroupElement, value);
    }

    public UpdatePrefixLabelValue(value: string) {
        UpdateLabelValue(this.prefixLabelGroupElement, value);
    }

    public UpdatePostfixLabelValue(value: string) {
        UpdateLabelValue(this.postfixLabelGroupElement, value);
    }

    public UpdateCategoryLabelStyles(categoryLabelSettings: CategoryLabelSettings) {
        UpdateLabelStyles(this.categoryLabelGroupElement, categoryLabelSettings);
    }

    public UpdatePrefixLabelStyles(prefixLabelSettings: FixLabelSettings) {
        UpdateLabelStyles(this.prefixLabelGroupElement, prefixLabelSettings);
    }

    public UpdatePostfixLabelStyles(postfixLabelSettings: FixLabelSettings) {
        UpdateLabelStyles(this.postfixLabelGroupElement, postfixLabelSettings);
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

    public CreateFill() {
        let obj: string;
        if (select("." + AdvanceCardClassNames.StrokeClass).empty()) {
            obj = "g";
        } else {
            obj = "." + AdvanceCardClassNames.StrokeClass;
        }
        this.fillGroupElement = this.rootSVGElement.insert("g", obj)
            .classed(AdvanceCardClassNames.FillClass, true);

        this.fillGroupElement.append("rect")
            .attr("width", this.rootSVGSize.width)
            .attr("height", this.rootSVGSize.height);
    }

    public CreateStroke() {
        this.strokeGroupElement = this.rootSVGElement.insert("g", "g")
            .classed(AdvanceCardClassNames.StrokeClass, true);
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
            fillImage.attr("xlink:href",fillSettings.imageURL)
                .attr("width", this.rootSVGSize.width - fillSettings.imagePadding)
                .attr("height", this.rootSVGSize.height - fillSettings.imagePadding)
                .attr("x", fillSettings.imagePadding / 2)
                .attr("y", fillSettings.imagePadding / 2);
        } else if (ElementExist(this.fillGroupElement.select("image"))) {
            this.fillGroupElement.select("image").remove();
        }
        fillRect.style("opacity", 1 - fillSettings.transparency / 100);

        if (!select("#" + AdvanceCardIdNames.StrokePathClipPathId).empty()) {
            this.fillGroupElement.attr("clip-path", "url(#" + AdvanceCardIdNames.StrokePathClipPathId + ")");
        }
    }

    public UpdateStroke(strokeSettings: StrokeSettings) {
        let pathProperties: SVGRectanglePathProperties = {
            x: 0,
            y: 0,
            width: this.rootSVGSize.width,
            height: this.rootSVGSize.height,
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
            .attr("stroke", strokeSettings.strokeColor as string || "none")
            .attr("stroke-width", strokeSettings.strokeWidth)
            .style("stroke-dasharray", (d) => {
                if (!StringExtensions.isNullOrUndefinedOrWhiteSpaceString(strokeSettings.strokeArray)) {
                    return strokeSettings.strokeArray as string;
                } else {
                    if (strokeSettings.strokeType === "1") {
                        return "8 , 4";
                    } else if (strokeSettings.strokeType === "2") {
                        return "2 , 4";
                    }
                }
            });

        this.strokeGroupElement.append("defs")
            .append("clipPath")
            .attr("id", AdvanceCardIdNames.StrokePathClipPathId)
            .append("use")
            .attr("xlink:href", "#stroke-path");
    }

    // public UpdateStroke(strokeSettings: StrokeSettings) {
    //     this.rootSVGBackgroundGroupElement.style("box-sizing", "border-box")
    //         .style("border-width", strokeSettings.strokeWidth + "px")
    //         .style("border-color", strokeSettings.strokeColor as string)
    //         .style("border-style", "solid");
    //     this._updateStrokeCornerRadii(strokeSettings);
    // }

    // private _updateStrokeCornerRadii(strokeSettings: StrokeSettings) {
    //     let cornerRadius = strokeSettings.cornerRadius + "px";
    //     // TODO: Handle inverted corner radius.
    //     if (strokeSettings.topLeft) {
    //         this.rootSVGBackgroundGroupElement.style("border-top-left-radius", cornerRadius);
    //     } else {
    //         this.rootSVGBackgroundGroupElement.style("border-top-left-radius", null);
    //     }
    //     if (strokeSettings.topRight) {
    //         this.rootSVGBackgroundGroupElement.style("border-top-right-radius", cornerRadius);
    //     } else {
    //         this.rootSVGBackgroundGroupElement.style("border-top-right-radius", null);
    //     }
    //     if (strokeSettings.bottomLeft) {
    //         this.rootSVGBackgroundGroupElement.style("border-bottom-left-radius", cornerRadius);
    //     } else {
    //         this.rootSVGBackgroundGroupElement.style("border-bottom-left-radius", null);
    //     }
    //     if (strokeSettings.bottomRight) {
    //         this.rootSVGBackgroundGroupElement.style("border-bottom-right-radius", cornerRadius);
    //     } else {
    //         this.rootSVGBackgroundGroupElement.style("border-bottom-right-radius", null);
    //     }
    // }

    public RemoveFill() {
        this.fillGroupElement.remove();
        this.fillGroupElement = undefined;
    }

    public RemoveStroke() {
        this.strokeGroupElement.remove();
        this.strokeGroupElement = undefined;
    }

    // public ResetStroke() {
    //     this.rootSVGBackgroundGroupElement.style("border-width", null)
    //         .style("border-color", null)
    //         .style("border-style", null);
    // }

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