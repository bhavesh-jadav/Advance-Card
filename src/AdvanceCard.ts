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
    AdvanceCardVisualSettings, FixLabelSettings, DataLabelSettings, CategoryLabelSettings, IVisualTextProperties,
    FillSettings, StrokeSettings, ConditionSettings, TooltipSettings, GeneralSettings
} from "./settings";
import { Selection, BaseType, select, mouse } from "d3-selection";
import { valueType } from "powerbi-visuals-utils-typeutils";
import { manipulation } from "powerbi-visuals-utils-svgutils"

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
    private width: number;
    private height: number;

    constructor(private target: HTMLElement) {
        this.rootSVGElement = select(this.target).append("svg")
            .classed(AdvanceCardClassNames.SVGClass, true);
    }

    public SetSize(width: number, height: number) {
        this.rootSVGElement.attr("width", width)
            .attr("height", height);
        this.width = width;
        this.height = height;
    }

    public DataLabelExist() {
        return this.dataLabelGroupElement !== undefined;
    }

    public UpdateDataLabel (dataLabelValue: string, dataLabelSettings: DataLabelSettings) {
        if (!this.DataLabelExist()) {
            this.dataLabelGroupElement = this.rootSVGElement.append("g")
                .classed(AdvanceCardClassNames.DataLabelClass, true);
            let dataLabelTextElement = this.dataLabelGroupElement.append("text");
            dataLabelTextElement.append("tspan")
                .text(dataLabelValue);
                dataLabelTextElement.append("title")
                .text(dataLabelValue);
        } else {
            this.dataLabelGroupElement.select("tspan")
                .text(dataLabelValue);
            this.dataLabelGroupElement.select("title")
                .text(dataLabelValue);
        }
    }

    public GetDataLabelSize() {
        if (this.DataLabelExist()) {
            return (this.dataLabelGroupElement.node() as HTMLElement).getBoundingClientRect();
        }
    }

    public UpdateDataLabelTransform() {
        if (this.DataLabelExist()) {
            let dataLabelSize = this.GetDataLabelSize();
            let x = this.width / 2 - dataLabelSize.width / 2;
            let y = this.height / 2 - dataLabelSize.height / 2;
            this.dataLabelGroupElement.attr("transform", Translate(x, y));
        }
    }
    
    public RemoveDataLabel() {
        if (this.DataLabelExist()) {
            this.dataLabelGroupElement.remove();
            this.dataLabelGroupElement = undefined;
        }
    }
}