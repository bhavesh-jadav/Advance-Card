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
import { LabelExist, CreateLabelElement, UpdateLabelValue, UpdateLabelStyles, GetLabelSize } from "./AdvanceCardUtils";

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
    PostfixLabelClass = "postfix-label"
}

export class AdvanceCard {

    private rootSVGElement: Selection<BaseType, any, any, any>;
    private dataLabelGroupElement: Selection<BaseType, any, any, any>;
    private categoryLabelGroupElement: Selection<BaseType, any, any, any>;

    constructor(private target: HTMLElement) {
        this.rootSVGElement = select(this.target).append("svg")
            .classed(AdvanceCardClassNames.SVGClass, true);
    }

    /**
     * Set the size of the Advance Card
     *
     * @param {number} width generally the width of the viewport
     * @param {number} height generally the height of the viewport
     * @memberof AdvanceCard
     */
    public SetSize(width: number, height: number) {
        this.rootSVGElement.attr("width", width)
            .attr("height", height);
    }

    private _getRootSVGSize() {
        if (this.rootSVGElement) {
            return (this.rootSVGElement.node() as HTMLElement).getBoundingClientRect();
        }
    }

    public UpdateDataLabelValue (value: string) {
        UpdateLabelValue(this.dataLabelGroupElement, value);
    }

    public UpdateDataLabelTextStyle(dataLabelSettings: DataLabelSettings) {
        UpdateLabelStyles(this.dataLabelGroupElement, dataLabelSettings);
    }

    public UpdateDataLabelColor(color: string) {
        this.dataLabelGroupElement.select("text")
            .style("fill", color);
    }

    public UpdateDataLabelTransform(settings: AdvanceCardVisualSettings) {
        let dataLabelTextElement: Selection<BaseType, any, any, any> = this.dataLabelGroupElement.select("text");
        let x: number;
        let y: number;
        let rootSVGSize = this._getRootSVGSize();

        // Calculate y. TODO: Adjust for category label.
        if (settings.categoryLabelSettings.show) {
            let dataLabelCategoryLabelSpacing = 5;
            let dataLabelSize = GetLabelSize(this.dataLabelGroupElement);
            y = rootSVGSize.height / 2 - dataLabelSize.height / 2 - dataLabelCategoryLabelSpacing / 2;
        } else {
            y = rootSVGSize.height / 2;
        }

        if (settings.general.alignment === "center") {
            x = rootSVGSize.width / 2;
            dataLabelTextElement.attr("text-anchor", "middle");
        } else if (settings.general.alignment === "left") {
            x = settings.general.alignmentSpacing;
            dataLabelTextElement.attr("text-anchor", "start");
        } else if (settings.general.alignment === "right") {
            x = rootSVGSize.width - settings.general.alignmentSpacing;
            dataLabelTextElement.attr("text-anchor", "end");
        }

        dataLabelTextElement.attr("x", x).attr("y", y);
    }

    public UpdateCategoryLabelTransform(settings: AdvanceCardVisualSettings) {
        let categoryLabel: Selection<BaseType, any, any, any> = this.categoryLabelGroupElement.select("text");
        let x: number;
        let y: number;
        let rootSVGSize = this._getRootSVGSize();
        let dataLabelCategoryLabelSpacing = 5;
        let categoryLabelSize = GetLabelSize(this.categoryLabelGroupElement);

        y = rootSVGSize.height / 2 + categoryLabelSize.height / 2 + dataLabelCategoryLabelSpacing / 2;

        if (settings.general.alignment === "center") {
            x = rootSVGSize.width / 2;
            categoryLabel.attr("text-anchor", "middle");
        } else if (settings.general.alignment === "left") {
            x = settings.general.alignmentSpacing;
            categoryLabel.attr("text-anchor", "start");
        } else if (settings.general.alignment === "right") {
            x = rootSVGSize.width - settings.general.alignmentSpacing;
            categoryLabel.attr("text-anchor", "end");
        }
        categoryLabel.attr("x", x).attr("y", y);
    }

    public RemoveDataLabel() {
        this.dataLabelGroupElement.remove();
        this.dataLabelGroupElement = undefined;
    }

    public RemoveCategoryLabel() {
        this.categoryLabelGroupElement.remove();
        this.categoryLabelGroupElement = undefined;
    }

    public UpdateCategoryLabelValue(value: string) {
        UpdateLabelValue(this.categoryLabelGroupElement, value);
    }

    public UpdateCategoryLabelStyles(categoryLabelSettings: CategoryLabelSettings) {
        UpdateLabelStyles(this.categoryLabelGroupElement, categoryLabelSettings);
    }

    public DataLabelExist() {
        return LabelExist(this.dataLabelGroupElement);
    }

    public CategoryLabelExist() {
        return LabelExist(this.categoryLabelGroupElement);
    }

    public CreateDataLabel() {
        this.dataLabelGroupElement = CreateLabelElement(this.rootSVGElement, this.dataLabelGroupElement, AdvanceCardClassNames.DataLabelClass);
    }

    public CreateCategoryLabel() {
        this.categoryLabelGroupElement = CreateLabelElement(this.rootSVGElement, this.categoryLabelGroupElement, AdvanceCardClassNames.CategoryLabelClass);
    }
}