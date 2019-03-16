
"use strict";

let version = "2.0.1";
let helpUrl = "https://github.com/bhavesh-jadav/Advance-Card/wiki";

import "./../style/visual.less";
import {
    valueFormatter,
    textMeasurementService,
    wordBreaker,
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

export function ElementExist(labelGroup: Selection<BaseType, any, any, any>) {
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
export function GetLabelSize(labelGroup: Selection<BaseType, any, any, any>): DOMRect {
    if (ElementExist(labelGroup)) {
        return (labelGroup.node() as any).getBBox() as DOMRect;
    } else {
        return new DOMRect(0, 0, 0, 0);
    }
}

export function UpdateLabelValueWithWrapping(labelGroup: Selection<BaseType, any, any, any>, textProperties: TextProperties, value: string, maxWidth: number, maxHeight: number) {

    let textHeight: number = TextMeasurementService.estimateSvgTextHeight(textProperties);
    let maxNumLines: number = Math.max(1, Math.floor(maxHeight / textHeight));
    let labelValues = wordBreaker.splitByWidth(value, textProperties, TextMeasurementService.measureSvgTextWidth, maxWidth, maxNumLines, TextMeasurementService.getTailoredTextOrDefault);

    let labelGroupText = labelGroup.select("text");

    labelGroupText.selectAll("tspan")
        .remove();
    labelGroupText.text(null);
    labelGroupText.selectAll("tspan")
        .data(labelValues)
        .enter()
        .append("tspan")
        .attr("x", 0)
        .attr("dy", (d, i) => {
            if (i === 0) {
                return 0;
            } else {
                return textHeight;
            }
        })
        .text((d) => {
            return d;
        });
    labelGroup.select("title")
        .text(value);
}

export function UpdateLabelValueWithoutWrapping(labelGroup: Selection<BaseType, any, any, any>, value: string) {
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


export function UpdateLabelColor(labelGroup: Selection<BaseType, any, any, any>, color: string) {
    labelGroup.select("text")
        .style("fill", color);
}

// base of following function is taken from https://stackoverflow.com/questions/12115691/svg-d3-js-rounded-corner-on-one-corner-of-a-rectangle
export function CreateSVGRectanglePath(properties: SVGRectanglePathProperties) {

    let x = properties.x;
    let y = properties.y;
    let w = properties.width;
    let h = properties.height;

    const r = properties.cornerRadius;

    const tl = properties.topLeftRound;
    const tr = properties.topRightRound;
    const bl = properties.bottomLeftRound;
    const br = properties.bottomRightRound;

    const tli = properties.topLeftRoundInward === true ? 0 : 1;
    const tri = properties.topRightRoundInward  === true ? 0 : 1;
    const bli = properties.bottomLeftRoundInward === true ? 0 : 1;
    const bri = properties.bottomRightRoundInward  === true ? 0 : 1;

    let pathData: string;
    pathData  = "M" + (x + r) + "," + y;
    pathData += "h" + (w - 2 * r);
    if (tr) {
        pathData += "a" + r + "," + r + " 0 0 " + tri + " " + r + "," + r;
    } else {
        pathData += "h" + r; pathData += "v" + r;
    }
    pathData += "v" + (h - 2 * r);
    if (br) {
        pathData += "a" + r + "," + r + " 0 0 " + bri + " " + -r + "," + r;
    } else {
        pathData += "v" + r; pathData += "h" + -r;
    }
    pathData += "h" + (2 * r - w);
    if (bl) {
        pathData += "a" + r + "," + r + " 0 0 " + bli + " " + -r + "," + -r;
    } else {
        pathData += "h" + -r; pathData += "v" + -r;
    }
    pathData += "v" + (2 * r - h);
    if (tl) {
        pathData += "a" + r + "," + r + " 0 0 " + tli + " " + r + "," + -r;
    } else {
        pathData += "v" + -r; pathData += "h" + r;
    }
    pathData += "z";
    return pathData;
}


export interface ILabelTextProperties {
    fontSize: number;
    fontFamily: string;
    isBold: boolean;
    isItalic: boolean;
    color: string;
}

export interface SVGRectanglePathProperties {
    x: number;
    y: number;
    width: number;
    height: number;
    cornerRadius: number;
    topLeftRound: boolean;
    topRightRound: boolean;
    bottomLeftRound: boolean;
    bottomRightRound: boolean;
    topLeftRoundInward: boolean;
    topRightRoundInward: boolean;
    bottomLeftRoundInward: boolean;
    bottomRightRoundInward: boolean;
}
