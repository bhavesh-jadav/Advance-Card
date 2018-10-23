/*
*  Power BI Visual CLI
*
*  Copyright (c) Microsoft Corporation
*  All rights reserved.
*  MIT License
*
*  Permission is hereby granted, free of charge, to any person obtaining a copy
*  of this software and associated documentation files (the ""Software""), to deal
*  in the Software without restriction, including without limitation the rights
*  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
*  copies of the Software, and to permit persons to whom the Software is
*  furnished to do so, subject to the following conditions:
*
*  The above copyright notice and this permission notice shall be included in
*  all copies or substantial portions of the Software.
*
*  THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
*  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
*  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
*  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
*  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
*  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
*  THE SOFTWARE.
*/
"use strict";

let version = "2.0.0";
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
    VisualSettings, FixLabelSettings, DataLabelSettings, CategoryLabelSettings, IVisualTextProperties,
    FillSettings, StrokeSettings, ConditionSettings, TooltipSettings, GeneralSettings
} from "./settings";
import { Selection, BaseType, select, mouse } from "d3-selection";

import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

import ValueFormatter = valueFormatter.valueFormatter;
import TextMeasurementService = textMeasurementService.textMeasurementService;
import TextProperties = textMeasurementService.TextProperties;
import DisplayUnitSystemType = displayUnitSystemType.DisplayUnitSystemType;

export class AdvanceCardVisual implements IVisual {
    private target: HTMLElement; // to store root html element
    private settings: VisualSettings; // to store settings i.e. properties of the visual
    private prefixSettings: FixLabelSettings;
    private dataLabelSettings: DataLabelSettings;
    private postfixSettings: FixLabelSettings;
    private categoryLabelSettings: CategoryLabelSettings;
    private fillSettings: FillSettings;
    private strokeSettings: StrokeSettings;
    private conditionSettings: ConditionSettings;
    private tooltipSettings: TooltipSettings;
    private generalSettings: GeneralSettings;

    private root: Selection<BaseType, any, any, any>;
    private cardGrp: Selection<BaseType, any, any, any>;
    private contentGrp: Selection<BaseType, any, any, any>;
    private dataLabel: Selection<BaseType, any, any, any>;
    private prefixLabel: Selection<BaseType, any, any, any>;
    private postfixLabel: Selection<BaseType, any, any, any>;
    private categoryLabel: Selection<BaseType, any, any, any>;
    private categoryLabelGrp: Selection<BaseType, any, any, any>;
    private cardBackground: Selection<BaseType, any, any, any>;
    private host: IVisualHost;
    private tableData: powerbi.DataViewTable;
    private culture: string;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.target = options.element;
    }

    public update(options: VisualUpdateOptions) {
        this.settings = this._parseSettings(options.dataViews[0]);
        this.tableData = options.dataViews[0].table;
        this.prefixSettings = this.settings.prefixSettings;
        this.dataLabelSettings = this.settings.dataLabelSettings;
        this.postfixSettings = this.settings.postfixSettings;
        this.categoryLabelSettings = this.settings.categoryLabelSettings;
        this.fillSettings = this.settings.backgroundSettings;
        this.strokeSettings = this.settings.strokeSettings;
        this.conditionSettings = this.settings.conditionSettings;
        this.tooltipSettings = this.settings.tootlipSettings;
        this.generalSettings = this.settings.general;
        this.culture = this.host.locale;

        let conditionFieldPresent: boolean = false;
        let conditionValue: number;
        let dataFieldPresent: boolean;
        let dataLabelValue: any;
        let prefixFieldPresent: boolean;
        let prefixValue: any;
        let postfixFieldPresent: boolean;
        let postfixValue: any;
        let categoryLabelValue: string;
        let dataLabelType: any;
        let dataLabelFormat: string;
        let displayUnitSystem = DisplayUnitSystemType.DataLabels;

        const viewPortHeight: number = options.viewport.height;
        const viewPortWidth: number = options.viewport.width;
        const showPrefix = () => {
            return this.prefixSettings.show === true && !StringExtensions.isNullOrEmpty(prefixValue);
        };
        const showPostfix = () => {
            return this.postfixSettings.show === true && !StringExtensions.isNullOrEmpty(postfixValue);
        };

        this.tableData.columns.forEach((column, index) => {

            if (column.roles.mainMeasure !== undefined) {
                dataFieldPresent = true;
                dataLabelValue = this.tableData.rows[0][index];
                categoryLabelValue = this.tableData.columns[index].displayName;
                dataLabelType = this.tableData.columns[index].type;
                dataLabelFormat = this.tableData.columns[index].format;
            } else if (dataFieldPresent !== true) {
                dataFieldPresent = false;
            }

            if (
                column.roles.conditionMeasure === true &&
                ( column.type.numeric === true || column.type.integer === true )
            ) {
                conditionValue = this.tableData.rows[0][index] as number;
                conditionFieldPresent = true;
            } else if (conditionFieldPresent !== true) {
                conditionValue = dataLabelValue as number;
            }

            if (column.roles.prefixMeasure) {
                prefixFieldPresent = true;
                prefixValue = this.tableData.rows[0][index];
            } else if (prefixFieldPresent !== true) {
                prefixFieldPresent = false;
                prefixValue = this.prefixSettings.text;
            }

            if (column.roles.postfixMeasure) {
                postfixFieldPresent = true;
                postfixValue = this.tableData.rows[0][index];
            } else if (postfixFieldPresent !== true) {
                postfixFieldPresent = false;
                postfixValue = this.postfixSettings.text;
            }
        });

        if (dataFieldPresent === false) {
            this.categoryLabelSettings.show = false;
        }

        if (typeof document !== "undefined") {

            // adding parent element ---------------------------------------------------------------------------------------------
            this.root = select(".root").remove();
            this.root = select(this.target)
                .append("svg")
                .classed("root", true)
                .attr("width", viewPortWidth)
                .attr("height", viewPortHeight);

            // adding background and stroke ----------------------------------------------------------------------------------------
            if (this.fillSettings.show === true || this.strokeSettings.show === true) {

                let pathData;
                if (this.strokeSettings.show === true) {
                    pathData = this.rounded_rect(
                        this.strokeSettings.strokeWidth / 2, this.strokeSettings.strokeWidth / 2,
                        viewPortWidth - this.strokeSettings.strokeWidth,
                        viewPortHeight - this.strokeSettings.strokeWidth,
                        this.strokeSettings
                    );
                } else {
                    pathData = this.rounded_rect(
                        0, 0,
                        viewPortWidth,
                        viewPortHeight,
                        this.strokeSettings
                    );
                }

                this.cardBackground = this.root.append("g")
                    .classed("cardBG", true)
                    .attr("opacity", 1 - this.fillSettings.transparency / 100);

                let cardBGShape = this.cardBackground.append("path")
                    .attr("d", pathData);

                if (this.fillSettings.show === true) {
                    cardBGShape.attr("fill",
                        this._getConditionalColors(conditionValue, "B", this.conditionSettings) ||
                                (this.fillSettings.backgroundColor as string || "none"),
                    );
                } else {
                    cardBGShape.attr("fill", "none");
                }

                if (this.fillSettings.showImage === true && this.fillSettings.show === true) {

                    this.strokeSettings.cornerRadius = this.strokeSettings.cornerRadius - this.fillSettings.imagePadding * 0.25;

                    let clipPathData = this.rounded_rect(
                        0, 0,
                        viewPortWidth - this.strokeSettings.strokeWidth * 2 - this.fillSettings.imagePadding,
                        viewPortHeight - this.strokeSettings.strokeWidth * 2 - this.fillSettings.imagePadding,
                        this.strokeSettings
                    );

                    let translateXY = this.strokeSettings.strokeWidth + this.fillSettings.imagePadding / 2;
                    // this.cardBackground.append("g")
                    //     .attr("transform", "translate(" + translateXY + "," + translateXY + ")")
                    //     .append("path")
                    //     .attr("d", clipPathData)
                    //     .attr("fill", "none")
                    //     .attr("stroke", this.strokeSettings.strokeColor as string || "none")
                    //     .attr("stroke-width", this.strokeSettings.strokeWidth);

                    this.cardBackground.append("defs")
                        .append("clipPath")
                        .attr("id", "imageClipPath")
                        .append("path")
                        .attr("d", clipPathData);

                    let cardBGImage = this.cardBackground
                        .append("g")
                        .classed("cardBGImage", true)
                        .attr("transform", "translate(" + translateXY + "," + translateXY + ")")
                        .attr("clip-path", "url(#imageClipPath)")
                        .append("image")
                        .attr("xlink:href", this.fillSettings.imageURL)
                        .attr("height", viewPortHeight - this.strokeSettings.strokeWidth - this.fillSettings.imagePadding)
                        .attr("width", viewPortWidth - this.strokeSettings.strokeWidth - this.fillSettings.imagePadding);
                }

                if (this.strokeSettings.show === true) {
                    const strokeType = this.settings.strokeSettings.strokeType;
                    cardBGShape.attr("stroke", this.strokeSettings.strokeColor as string || "none")
                        .attr("stroke-width", this.strokeSettings.strokeWidth)
                        .style("stroke-dasharray", (d) => {
                            if (this.strokeSettings.strokeArray) {
                                return this.strokeSettings.strokeArray as string;
                            } else {
                                if (strokeType === "1") {
                                    return "8 , 4";
                                } else if (strokeType === "2") {
                                    return "2 , 4";
                                }
                            }
                        });
                }
            }
            // end adding background and stroke ------------------------------------------------------------------------------------

            // adding parent element -----------------------------------------------------------------------------------------------
            this.cardGrp = this.root.append("g")
                .classed("cardGrp", true);

            this.contentGrp = this.cardGrp
                .append("g")
                .classed("contentGrp", true);
            // end adding parent element -----------------------------------------------------------------------------------------

            this.contentGrp = this.contentGrp.append("text")
                .style("text-anchor", "middle");

            // adding prefix -----------------------------------------------------------------------------------------------------
            if (showPrefix() === true) {
                const prefixLabelTextProperties: TextProperties = {
                    "text": prefixValue,
                    "fontFamily": this.prefixSettings.fontFamily,
                    "fontSize": PixelConverter.fromPoint(this.prefixSettings.fontSize)
                };
                const prefixValueShort = TextMeasurementService.getTailoredTextOrDefault(prefixLabelTextProperties, viewPortWidth);
                this.prefixLabel = this.contentGrp
                    .append("tspan")
                    .classed("prefixLabel", true)
                    .style("text-anchor", "start")
                    .style("fill",
                        this.conditionSettings.applyToPrefix === true ?
                        this._getConditionalColors(conditionValue, "F", this.conditionSettings) || this.prefixSettings.color :
                        this.prefixSettings.color
                    );

                this.prefixLabel = this._setTextStyleProperties(this.prefixLabel, this.prefixSettings);
                this.prefixLabel.text(prefixValueShort);

            } else if (this.prefixLabel) {
                select(".prefixLabel").remove();
            }
            // end adding prefix ------------------------------------------------------------------------------------------------------

            // adding data label -------------------------------------------------------------------------------------------------------
            let dataLabelValueFormatted;
            if (dataFieldPresent === true) {
                if (dataLabelType.numeric || dataLabelType.integer) {
                    dataLabelValueFormatted = this._format(dataLabelValue as number,
                    {
                        "format": dataLabelFormat,
                        "value": (this.dataLabelSettings.displayUnit === 0 ? dataLabelValue as number  : this.dataLabelSettings.displayUnit),
                        "precision": this.dataLabelSettings.decimalPlaces,
                        "allowFormatBeautification": false,
                        "formatSingleValues": this.dataLabelSettings.displayUnit === 0,
                        "displayUnitSystemType": displayUnitSystem,
                        "cultureSelector": this.culture
                    });
                } else {
                    dataLabelValueFormatted = this._format(
                    dataLabelType.dateTime ? new Date(dataLabelValue) : dataLabelValue,
                        {
                            "format": dataLabelFormat,
                            "cultureSelector": this.culture
                        }
                    );
                }

                const dataLabelTextProperties: TextProperties = {
                    "text": dataLabelValueFormatted,
                    "fontFamily": this.dataLabelSettings.fontFamily,
                    "fontSize": PixelConverter.fromPoint(this.dataLabelSettings.fontSize)
                };

                const prefixWidth = (
                    showPrefix() === true ?
                    TextMeasurementService.measureSvgTextElementWidth(this.prefixLabel.node() as any) + this.prefixSettings.spacing :
                    0
                );

                const dataLabelValueShort = TextMeasurementService.getTailoredTextOrDefault(dataLabelTextProperties, viewPortWidth - prefixWidth);

                this.dataLabel = this.contentGrp
                    .append("tspan")
                    .classed("dataLabel", true)
                    .attr("dx", () => {
                        if (showPrefix() === true) {
                            return this.prefixSettings.spacing;
                        } else {
                            return 0;
                        }
                    })
                    .style("text-anchor", "start")
                    .style("fill",
                        this.conditionSettings.applyToDataLabel === true ?
                        this._getConditionalColors(conditionValue, "F", this.conditionSettings) || this.dataLabelSettings.color :
                        this.dataLabelSettings.color
                    );

                    this.dataLabel = this._setTextStyleProperties(this.dataLabel, this.dataLabelSettings);
                    this.dataLabel.text(dataLabelValueShort);
            }
            // end adding data label --------------------------------------------------------------------------------------------------

            // adding postfix ------------------------------------------------------------------------------------------------------
            if (showPostfix() === true) {
                const prefixWidth = (
                    showPrefix() === true ?
                    TextMeasurementService.measureSvgTextElementWidth(this.prefixLabel.node() as any) + this.prefixSettings.spacing :
                    0
                );
                const dataLabelWidth = (
                    dataFieldPresent === true ?
                    TextMeasurementService.measureSvgTextElementWidth(this.dataLabel.node() as any) :
                    0
                );
                const postfixLabelTextProperties: TextProperties = {
                    "text": postfixValue,
                    "fontFamily": this.postfixSettings.fontFamily,
                    "fontSize": PixelConverter.fromPoint(this.postfixSettings.fontSize)
                };
                const postfixValueShort = TextMeasurementService.getTailoredTextOrDefault(
                    postfixLabelTextProperties, viewPortWidth - prefixWidth - dataLabelWidth
                );
                postfixLabelTextProperties.text = postfixValueShort;

                this.postfixLabel = this.contentGrp
                    .append("tspan")
                    .classed("postfixLabel", true)
                    .attr("dx", () => {
                        if (showPostfix() === true) {
                            return this.postfixSettings.spacing;
                        } else {
                            return 0;
                        }
                    })
                    .style("text-anchor", "start")
                    .style("fill",
                        this.conditionSettings.applyToPostfix === true ?
                        this._getConditionalColors(conditionValue, "F", this.conditionSettings) || this.postfixSettings.color :
                        this.postfixSettings.color
                    );

                    this.postfixLabel = this._setTextStyleProperties(this.postfixLabel, this.postfixSettings);
                    this.postfixLabel.text(postfixValueShort);

            } else if (this.postfixLabel) {
                select(".postfixLabel").remove();
            }
            // end adding postfix -----------------------------------------------------------------------------------------------------

            // adding title to content ------------------------------------------------------------------------------------------------
            let title = "";
            title += showPrefix() === true ? prefixValue + " " : "";
            title += dataFieldPresent === true ? dataLabelValueFormatted as string : "";
            title += showPostfix() === true ? " " + postfixValue : "";
            this.contentGrp.append("title")
                .text(title);
            // end adding title to content --------------------------------------------------------------------------------------------

            let contentGrpWidth: number;
            let contentGrpHeight: number;
            let contentGrpSize: SVGRect;
            // adding category label --------------------------------------------------------------------------------------------------
            if (this.categoryLabelSettings.show === true && dataFieldPresent === true) {

                const categoryLabelTextProperties: TextProperties = {
                    "text": categoryLabelValue,
                    "fontFamily": this.categoryLabelSettings.fontFamily,
                    "fontSize": PixelConverter.fromPoint(this.categoryLabelSettings.fontSize)
                };

                const prefixWidth = (
                    showPrefix() === true ?
                    TextMeasurementService.measureSvgTextElementWidth(this.prefixLabel.node() as any) + this.prefixSettings.spacing :
                    0
                );

                const categoryLabelValueShort = TextMeasurementService.getTailoredTextOrDefault(
                    categoryLabelTextProperties, viewPortWidth - prefixWidth / 2
                );

                this.categoryLabelGrp = this.cardGrp.append("g")
                .classed("categoryLabelGrp", true);

                this.categoryLabel = this.categoryLabelGrp.append("g")
                    .classed("categoryLabel", true)
                    .append("text")
                    .append("tspan")
                    .style("text-anchor", "start")
                    .style("fill",
                        this.conditionSettings.applyToCategoryLabel === true ?
                        this._getConditionalColors(conditionValue, "F", this.conditionSettings) || this.categoryLabelSettings.color :
                        this.categoryLabelSettings.color
                    );

                this.categoryLabel = this._setTextStyleProperties(this.categoryLabel, this.categoryLabelSettings);
                this.categoryLabel.text(categoryLabelValueShort);

                contentGrpSize = (this.contentGrp.node() as any).getBoundingClientRect();
                contentGrpWidth = contentGrpSize.width;
                contentGrpHeight = contentGrpSize.height;
                const categoryLabelSize: SVGRect = (this.categoryLabel.node() as any).getBoundingClientRect();
                const categoryLabelWidth: number = categoryLabelSize.width;
                const categoryLabelHeight: number = categoryLabelSize.height;

                let categoryLabelX: number;
                const categoryLabelY: number = contentGrpHeight / 2 + categoryLabelHeight * 0.5;

                if (this.generalSettings.alignment === "left") {
                    categoryLabelX = 0;
                } else if (this.generalSettings.alignment === "center") {
                    categoryLabelX = contentGrpWidth / 2 - categoryLabelWidth / 2;
                } else if (this.generalSettings.alignment === "right") {
                    categoryLabelX = contentGrpWidth - categoryLabelWidth;
                }
                this.categoryLabelGrp = this.categoryLabelGrp.attr("transform", "translate(" + categoryLabelX + "," + categoryLabelY + ")");

                this.categoryLabel = this.categoryLabel.append("title")
                    .text(categoryLabelValue ? categoryLabelValue : "");

            } else if (this.categoryLabelGrp) {
                this.categoryLabelGrp = select(".categoryLabelGrp").remove();
                this.categoryLabelSettings.show = false;
            }
            // end adding category label -----------------------------------------------------------------------------------------------

            contentGrpSize = (this.contentGrp.node() as any).getBoundingClientRect();
            contentGrpWidth = contentGrpSize.width;
            contentGrpHeight = contentGrpSize.height;

            let cardGrpX: number;
            const cardGrpY: number = (viewPortHeight / 2 + (this.categoryLabelSettings.show === true ? 0 : contentGrpHeight * 0.3));
            const alignmentSpacing = this.generalSettings.alignmentSpacing;

            if (this.generalSettings.alignment === "left") {
                if (this.strokeSettings.show === true || this.fillSettings.show === true) {
                    if (this.strokeSettings.topLeft === true || this.strokeSettings.bottomLeft === true) {
                        cardGrpX = alignmentSpacing + this.strokeSettings.cornerRadius;
                    } else {
                        cardGrpX = alignmentSpacing;
                    }
                } else {
                    cardGrpX = alignmentSpacing;
                }
            } else if (this.generalSettings.alignment === "center") {
                if (viewPortWidth > contentGrpWidth) {
                    cardGrpX = viewPortWidth / 2 - contentGrpWidth / 2;
                } else {
                    cardGrpX = 5;
                }
            } else if (this.generalSettings.alignment === "right") {
                if (this.strokeSettings.show === true || this.fillSettings.show === true) {
                    if (this.strokeSettings.topRight === true || this.strokeSettings.bottomRight === true) {
                        cardGrpX = viewPortWidth - contentGrpWidth - alignmentSpacing - this.strokeSettings.cornerRadius;
                    } else {
                        cardGrpX = viewPortWidth - contentGrpWidth - alignmentSpacing;
                    }
                } else {
                    cardGrpX = viewPortWidth - contentGrpWidth - alignmentSpacing;
                }
            }
            this.cardGrp = this.cardGrp.attr("transform", "translate(" + cardGrpX + ", " + cardGrpY + ")");

            // adding tooltip -----------------------------------------------------------------------------------------------------------
            if (this.tooltipSettings.show === true) {
                const tooltipDataItems = [];
                if (this.tooltipSettings.title != null || this.tooltipSettings.content != null) {
                    tooltipDataItems.push({
                        "displayName": this.tooltipSettings.title,
                        "value": this.tooltipSettings.content
                    });
                }

                this.tableData.columns.forEach((column, index) => {
                    const displayUnit = this.getPropertyValue<number>(column.objects, "tootlipSettings", "measureFormat", 0);
                    const precision = this.getPropertyValue<number>(column.objects, "tootlipSettings", "measurePrecision", 0);
                    const value = this.tableData.rows[0][index];
                    const valueType = this.tableData.columns[index].type;
                    let valueFormatted = "";

                    if (valueType.numeric || valueType.integer) {
                        valueFormatted = this._format(
                            value as number,
                            {
                                "format": this.tableData.columns[index].format,
                                "value": displayUnit === 0 ? value as number : displayUnit,
                                "precision": precision,
                                "allowFormatBeautification": false,
                                "formatSingleValues": displayUnit === 0,
                                "displayUnitSystemType": displayUnitSystem,
                                "cultureSelector": this.culture
                            });
                    } else {
                        valueFormatted = this._format(
                            valueType.dateTime ? new Date(value as string) : value,
                            {
                                "format": this.tableData.columns[index].format,
                                "cultureSelector": this.culture
                            }
                        );
                    }
                    if (column.roles.tooltipMeasures === true) {
                        tooltipDataItems.push({
                            "displayName": this.tableData.columns[index].displayName,
                            "value": valueFormatted
                        });
                    }
                });

                this.root.on("mousemove", (e) => {
                    const mouseX = mouse(this.root.node() as any)[0];
                    const mouseY = mouse(this.root.node() as any)[1];

                    this.host.tooltipService.show({
                        "dataItems": tooltipDataItems,
                        "identities": [],
                        "coordinates": [mouseX, mouseY],
                        "isTouchEvent": true
                    });
                });
            }
        }
    }

    /**
     * This function gets called for each of the objects defined in the capabilities files and allows you to select which of the
     * objects and properties you want to expose to the users in the property pane.
     *
     */
    public enumerateObjectInstances(options: EnumerateVisualObjectInstancesOptions): VisualObjectInstance[] | VisualObjectInstanceEnumerationObject {
        const settings: VisualObjectInstance[] = [];
        const conditionKey = "condition";
        const valueKey = "value";
        const foregroundColorKey = "foregroundColor";
        const backgroundColorKey = "backgroundColor";
        let conditionNumbers = this.conditionSettings.conditionNumbers;
        switch (options.objectName) {

            case "general":
                settings.push({
                    "objectName": options.objectName,
                    "properties": {
                        "alignmentSpacing": this.generalSettings.alignmentSpacing,
                        "alignment": this.generalSettings.alignment
                    },
                    "selector": null
                });
                break;

            case "conditionSettings":
                settings.push({
                    "objectName": options.objectName,
                    "properties": {
                        "show": this.conditionSettings.show,
                        "conditionNumbers": conditionNumbers > 10 ? 10 : conditionNumbers === 0 ? conditionNumbers = 1 : conditionNumbers,
                        "applyToDataLabel": this.conditionSettings.applyToDataLabel,
                        "applyToCategoryLabel": this.conditionSettings.applyToCategoryLabel,
                        "applyToPrefix": this.conditionSettings.applyToPrefix,
                        "applyToPostfix": this.conditionSettings.applyToPostfix
                    },
                    "selector": null
                });
                for (let index = 1; index <= conditionNumbers; index++) {
                    settings.push({
                        "objectName": options.objectName,
                        "properties": {
                            [conditionKey + index]: this.conditionSettings["condition" + index],
                            [valueKey + index]: this.conditionSettings["value" + index],
                            [foregroundColorKey + index]: this.conditionSettings["foregroundColor" + index],
                            [backgroundColorKey + index]: this.conditionSettings["backgroundColor" + index]
                        },
                        "selector": null
                    });
                }
                break;

            case "tootlipSettings":
                settings.push({
                    "objectName": options.objectName,
                    "properties": {
                        "show": this.tooltipSettings.show,
                        "title": this.tooltipSettings.title,
                        "content": this.tooltipSettings.content
                    },
                    "selector": null
                });
                this.tableData.columns.forEach((column) => {
                    if (column.roles.tooltipMeasures === true) {
                        if (column.type.numeric || column.type.integer) {
                            settings.push({
                                "objectName": options.objectName,
                                "displayName": column.displayName + " Display Unit",
                                "properties": {
                                    "measureFormat": this.getPropertyValue<number>(column.objects, options.objectName, "measureFormat", 0)
                                },
                                "selector": {
                                    "metadata": column.queryName
                                }
                            });
                            settings.push({
                                "objectName": options.objectName,
                                "displayName": column.displayName + " Precision",
                                "properties": {
                                    "measurePrecision": this.getPropertyValue<number>(column.objects, options.objectName, "measurePrecision", 0)
                                },
                                "selector": {
                                    "metadata": column.queryName
                                }
                            });
                        }
                    }
                });
                break;

            case "aboutSettings":
                settings.push({
                    "objectName": options.objectName,
                    "displayName": "About",
                    "properties": {
                        "version": version,
                        "helpUrl": helpUrl
                    },
                    "selector": null
                });
                break;

            case "backgroundSettings":
                if (this.fillSettings.showImage === true) {
                    settings.push({
                        "objectName": options.objectName,
                        "displayName": "Fill",
                        "properties": {
                            "show": this.fillSettings.show,
                            "backgroundColor": this.fillSettings.backgroundColor,
                            "showImage": this.fillSettings.showImage,
                            "imageURL": this.fillSettings.imageURL,
                            "imagePadding": this.fillSettings.imagePadding,
                            "transparency": this.fillSettings.transparency
                        },
                        "selector": null
                    });
                } else {
                    settings.push({
                        "objectName": options.objectName,
                        "displayName": "Fill",
                        "properties": {
                            "show": this.fillSettings.show,
                            "backgroundColor": this.fillSettings.backgroundColor,
                            "showImage": this.fillSettings.showImage,
                            "transparency": this.fillSettings.transparency
                        },
                        "selector": null
                    });
                }

            default:
                break;
        }
        if (settings.length > 0) {
            return settings;
        } else {
            return (VisualSettings.enumerateObjectInstances(this.settings, options) as VisualObjectInstanceEnumerationObject);
        }
    }

    public getPropertyValue<T>(objects: powerbi.DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
        if (objects) {
            const object = objects[objectName];
            if (object) {
                const property: T = <T> object[propertyName];
                if (property !== undefined) {
                    return property;
                }
            }
        }
        return defaultValue;
    }

    // base of following function is taken from https://stackoverflow.com/questions/12115691/svg-d3-js-rounded-corner-on-one-corner-of-a-rectangle
    // original function credit to @stackmate on stackoverflow
    private rounded_rect(
        x: number, y: number,  w: number,
        h: number, strokeSettings: StrokeSettings) {

        const r = this.strokeSettings.cornerRadius;

        const tl = this.strokeSettings.topLeft;
        const tr = this.strokeSettings.topRight;
        const bl = this.strokeSettings.bottomLeft;
        const br = this.strokeSettings.bottomRight;

        const tli = this.strokeSettings.topLeftInward === true ? 0 : 1;
        const tri = this.strokeSettings.topRightInward  === true ? 0 : 1;
        const bli = this.strokeSettings.bottomLeftInward === true ? 0 : 1;
        const bri = this.strokeSettings.bottomRightInward  === true ? 0 : 1;

        let retval;
        retval  = "M" + (x + r) + "," + y;
        retval += "h" + (w - 2 * r);
        if (tr) {
            retval += "a" + r + "," + r + " 0 0 " + tri + " " + r + "," + r;
        } else {
            retval += "h" + r; retval += "v" + r;
        }
        retval += "v" + (h - 2 * r);
        if (br) {
            retval += "a" + r + "," + r + " 0 0 " + bri + " " + -r + "," + r;
        } else {
            retval += "v" + r; retval += "h" + -r;
        }
        retval += "h" + (2 * r - w);
        if (bl) {
            retval += "a" + r + "," + r + " 0 0 " + bli + " " + -r + "," + -r;
        } else {
            retval += "h" + -r; retval += "v" + -r;
        }
        retval += "v" + (2 * r - h);
        if (tl) {
            retval += "a" + r + "," + r + " 0 0 " + tli + " " + r + "," + -r;
        } else {
            retval += "v" + -r; retval += "h" + r;
        }
        retval += "z";
        return retval;
    }

    private _parseSettings(dataView: DataView): VisualSettings {
        return VisualSettings.parse(dataView) as VisualSettings;
    }

    private _format(data, properties) {
        const formatter = ValueFormatter.create(properties);
        return formatter.format(data);
    }

    private _setTextStyleProperties(element: Selection<BaseType, any, any, any>,  visualTextProperties: IVisualTextProperties) {

        if (element) {
            element.style("font-family", visualTextProperties.fontFamily)
                .style("font-size", PixelConverter.fromPoint(visualTextProperties.fontSize))
                .style("font-style", visualTextProperties.isItalic === true ? "italic" : "normal")
                .style("font-weight", visualTextProperties.isBold === true ? "bold" : "normal");
        }
        return element;
    }

    private _getConditionalColors(originalValue: number, colorType: string, conditionSettings: ConditionSettings): string | null {
        if (conditionSettings.show === true) {
            for (let conditionNumber = 1; conditionNumber <= conditionSettings.conditionNumbers; conditionNumber++) {
                const compareValue =  conditionSettings["value" + conditionNumber];
                if (compareValue != null) {
                    const condition = conditionSettings["condition" + conditionNumber];
                    let conditonResult;
                    switch (condition) {
                        case ">":
                            conditonResult = originalValue > compareValue;
                            break;
                        case ">=":
                            conditonResult = originalValue >= compareValue;
                            break;
                        case "=":
                            conditonResult = originalValue === compareValue;
                            break;
                        case "<":
                            conditonResult = originalValue < compareValue;
                            break;
                        case "<=":
                            conditonResult = originalValue <= compareValue;
                            break;
                        default:
                            break;
                    }
                    if (conditonResult === true) {
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