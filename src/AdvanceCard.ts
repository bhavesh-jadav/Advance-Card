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

import powerbi from "powerbi-visuals-api";
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

enum ClassNames {
    SVGClass= "root-svg",
    DataLabelClass = "data-label",
    CategoryLabelClass = "category-label",
    PrefixLabelClass = "prefix-label",
    PostfixLabelClass = "postfix-label"
}

export class AdvanceCard {

    private rootSVG: Selection<BaseType, any, any, any>;
    private settings: AdvanceCardVisualSettings;

    constructor(private target: HTMLElement) {
        this.rootSVG = select(this.target).append("svg")
            .classed(ClassNames.SVGClass, true);
    }

    public Created() {
        return this.rootSVG.nodes().length > 1;
    }

    public Create(tableData: powerbi.DataViewTable, width: number, height: number, settings: AdvanceCardVisualSettings) {
        this.settings = settings;
    }

    // public CreateDataLabel(settings: DataLabelSettings) {
    //     let dataLabelValueFormatted;
    //         if (dataFieldPresent === true) {
    //             if (dataLabelType.numeric || dataLabelType.integer) {
    //                 dataLabelValueFormatted = this._format(dataLabelValue as number,
    //                 {
    //                     "format": dataLabelFormat,
    //                     "value": (this.dataLabelSettings.displayUnit === 0 ? dataLabelValue as number  : this.dataLabelSettings.displayUnit),
    //                     "precision": this.dataLabelSettings.decimalPlaces,
    //                     "allowFormatBeautification": false,
    //                     "formatSingleValues": this.dataLabelSettings.displayUnit === 0,
    //                     "displayUnitSystemType": displayUnitSystem,
    //                     "cultureSelector": this.culture
    //                 });
    //             } else {
    //                 dataLabelValueFormatted = this._format(
    //                 dataLabelType.dateTime && dataLabelValue ? new Date(dataLabelValue) : dataLabelValue,
    //                     {
    //                         "format": dataLabelFormat,
    //                         "cultureSelector": this.culture
    //                     }
    //                 );
    //             }

    //             const dataLabelTextProperties: TextProperties = {
    //                 "text": dataLabelValueFormatted,
    //                 "fontFamily": this.dataLabelSettings.fontFamily,
    //                 "fontSize": PixelConverter.fromPoint(this.dataLabelSettings.fontSize)
    //             };
    //             const prefixWidth = (
    //                 showPrefix() === true ?
    //                 TextMeasurementService.measureSvgTextElementWidth(this.prefixLabel.node() as any) + this.prefixSettings.spacing :
    //                 0
    //             );

    //             let cornerRadiusSubtract = 0;
    //             if (
    //                 (
    //                     this.generalSettings.alignment === "left" && (
    //                         this.strokeSettings.topLeft || this.strokeSettings.bottomLeft ||
    //                         this.strokeSettings.topLeftInward || this.strokeSettings.bottomLeftInward
    //                     )
    //                 ) || (
    //                     this.generalSettings.alignment === "right" && (
    //                         this.strokeSettings.topRight || this.strokeSettings.bottomRight ||
    //                         this.strokeSettings.topRightInward || this.strokeSettings.bottomRightInward
    //                     )
    //                 )
    //             ) {
    //                 cornerRadiusSubtract = this.strokeSettings.cornerRadius;
    //             }
    //             let allowedTextWidth = viewPortWidth -
    //                 prefixWidth -
    //                 this._getAlignmentSpacing(this.generalSettings) -
    //                 (this.strokeSettings.show === true ? this.strokeSettings.strokeWidth : 0) -
    //                 cornerRadiusSubtract;

    //             const dataLabelValueShort = TextMeasurementService.getTailoredTextOrDefault(dataLabelTextProperties, allowedTextWidth);
    //             console.log(dataLabelValueShort, viewPortWidth, allowedTextWidth, prefixWidth, this._getAlignmentSpacing(this.generalSettings), (this.strokeSettings.show === true ? this.strokeSettings.strokeWidth : 0), cornerRadiusSubtract);
    //             this.dataLabel = this.contentGrp
    //                 .append("tspan")
    //                 .classed("dataLabel", true)
    //                 .attr("dx", () => {
    //                     if (showPrefix() === true) {
    //                         return this.prefixSettings.spacing;
    //                     } else {
    //                         return 0;
    //                     }
    //                 })
    //                 .style("text-anchor", "start")
    //                 .style("fill",
    //                     this.conditionSettings.applyToDataLabel === true ?
    //                     this._getConditionalColors(conditionValue, "F", this.conditionSettings) || this.dataLabelSettings.color :
    //                     this.dataLabelSettings.color
    //                 );

    //                 this.dataLabel = this._setTextStyleProperties(this.dataLabel, this.dataLabelSettings);
    //                 this.dataLabel.text(dataLabelValueShort);
    //         }
    //         // end adding data label --------------------------------------------------------------------------------------------------
    // }
}