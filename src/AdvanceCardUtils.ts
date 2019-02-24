
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
import { Selection, BaseType, select, mouse } from "d3-selection";
import { valueType } from "powerbi-visuals-utils-typeutils";
import { manipulation } from "powerbi-visuals-utils-svgutils";

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

export function LabelExist(labelGroup: Selection<BaseType, any, any, any>) {
    if (labelGroup) {
        return true;
    } else {
        return false;
    }
}


/**
 * Creates and appends label element to parent SVG and returns the created element. It will only create element if parent is not null and labelGroup is null
 *
 * @export
 * @param {Selection<BaseType, any, any, any>} parent parent SVG
 * @param {Selection<BaseType, any, any, any>} labelGroup label group variable
 * @param {string} labelClassName class name of the label
 * @returns {Selection<BaseType, any, any, any>} label group
 */
export function CreateLabelElement(parent: Selection<BaseType, any, any, any>, labelGroup: Selection<BaseType, any, any, any>, labelClassName: string): Selection<BaseType, any, any, any> {
    if (parent && !labelGroup) {
        labelGroup = parent.append("g")
            .classed(labelClassName, true);
        labelGroup.append("text");
        labelGroup.append("title");
    }
    return labelGroup;
}

/**
 * Return size of the label element if exist else returns 0 for size.
 *
 * @export
 * @param {Selection<BaseType, any, any, any>} labelGroup
 * @returns {(DOMRect | ClientRect)}
 */
export function GetLabelSize(labelGroup: Selection<BaseType, any, any, any>): DOMRect | ClientRect {
    if (LabelExist(labelGroup)) {
        return (labelGroup.node() as HTMLElement).getBoundingClientRect();
    } else {
        return new DOMRect(0, 0, 0, 0);
    }
}

export function UpdateLabelValue(labelGroup: Selection<BaseType, any, any, any>, value: string) {
    labelGroup.select("text")
            .text(value);
    labelGroup.select("title")
        .text(value);
}

export function UpdateLabelStyles(labelGroup: Selection<BaseType, any, any, any>, labelStyles: ILabelTextProperties) {
    labelGroup.select("text")
        .style("font-family", labelStyles.fontFamily)
        .style("font-size", PixelConverter.fromPoint(labelStyles.fontSize))
        .style("font-style", labelStyles.isItalic === true ? "italic" : "normal")
        .style("font-weight", labelStyles.isBold === true ? "bold" : "normal")
        .attr("alignment-baseline", "middle");
}


export interface ILabelTextProperties {
    fontSize: number;
    fontFamily: string;
    isBold: boolean;
    isItalic: boolean;
    color: string;
}
