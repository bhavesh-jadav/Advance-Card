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

let version = "2.0.1";
let helpUrl = "https://github.com/bhavesh-jadav/Advance-Card/wiki";

import { AdvanceCard } from "./AdvanceCard";
import "@babel/polyfill";
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
import { AdvanceCardData } from "./AdvanceCardData";
import { ILabelTextProperties } from "./AdvanceCardUtils";

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
    private settings: AdvanceCardVisualSettings;
    private prefixSettings: FixLabelSettings;
    private dataLabelSettings: DataLabelSettings;
    private postfixSettings: FixLabelSettings;
    private categoryLabelSettings: CategoryLabelSettings;
    private fillSettings: FillSettings;
    private strokeSettings: StrokeSettings;
    private conditionSettings: ConditionSettings;
    private tooltipSettings: TooltipSettings;
    private generalSettings: GeneralSettings;

    private host: IVisualHost;
    private tableData: powerbi.DataViewTable;
    private culture: string;

    private advanceCard: AdvanceCard;
    private advanceCardData: AdvanceCardData;

    constructor(options: VisualConstructorOptions) {
        this.host = options.host;
        this.advanceCard = new AdvanceCard(options.element);
    }

    public update(options: VisualUpdateOptions) {

        let t0 = performance.now();

        try {
            if (
                !options.dataViews ||
                !options.dataViews[0] ||
                !options.dataViews[0].table ||
                !options.dataViews[0].table.columns ||
                !options.dataViews[0].table.rows
            ) {
                return;
            } else {
                this.settings = this._parseSettings(options.dataViews[0]);
                this.tableData = options.dataViews[0].table;
            }

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

            if (this.conditionSettings.conditionNumbers > 10) {
                this.conditionSettings.conditionNumbers = 10;
            }
            else if (this.conditionSettings.conditionNumbers <= 0) {
                this.conditionSettings.conditionNumbers = 1;
            }

            const viewPortHeight: number = options.viewport.height;
            const viewPortWidth: number = options.viewport.width;

            this.advanceCardData = new AdvanceCardData(this.tableData, this.settings, this.culture);
            let dataLabelValue = this.advanceCardData.GetDataLabelValue();
            let prefixLabelValue = this.advanceCardData.GetPrefixLabelValue();
            let postfixLabelValue = this.advanceCardData.GetPostfixLabelValue();

            this.advanceCard.UpdateSettings(this.settings);
            this.advanceCard.SetSize(viewPortWidth, viewPortHeight);

            if (dataLabelValue) {

                if (!this.advanceCard.DataLabelExist()) {
                    this.advanceCard.CreateDataLabel();
                }

                this.advanceCard.UpdateDataLabelValue(dataLabelValue);
                this.advanceCard.UpdateDataLabelTextStyle();

                if (this.categoryLabelSettings.show) {
                    if (!this.advanceCard.CategoryLabelExist()) {
                        this.advanceCard.CreateCategoryLabel();
                    }
                    this.advanceCard.UpdateCategoryLabelValue(this.advanceCardData.GetDataLabelDisplayName());
                    this.advanceCard.UpdateCategoryLabelStyles();
                } else if (this.advanceCard.CategoryLabelExist()) {
                    this.advanceCard.RemoveCategoryLabel();
                }

            } else if (this.advanceCard.DataLabelExist()) {
                this.advanceCard.RemoveDataLabel();
                if (this.advanceCard.CategoryLabelExist()) {
                    this.advanceCard.RemoveCategoryLabel();
                }
            }

            if (this.prefixSettings.show && prefixLabelValue) {
                if (!this.advanceCard.PrefixLabelExist()) {
                    this.advanceCard.CreatePrefixLabel();
                }
                this.advanceCard.UpdatePrefixLabelValue(prefixLabelValue);
                this.advanceCard.UpdatePrefixLabelStyles();
            } else if (this.advanceCard.PrefixLabelExist()) {
                this.advanceCard.RemovePrefixLabel();
            }

            if (this.postfixSettings.show && postfixLabelValue) {
                if (!this.advanceCard.PostfixLabelExist()) {
                    this.advanceCard.CreatePostfixLabel();
                }
                this.advanceCard.UpdatePostfixLabelValue(postfixLabelValue);
                this.advanceCard.UpdatePostfixLabelStyles();
            } else if (this.advanceCard.PostfixLabelExist()) {
                this.advanceCard.RemovePostfixLabel();
            }

            let conditionForegroundColor: string = undefined;
            let conditionBackgroundColor: string = undefined;
            if (this.conditionSettings.show) {
                let conditionValue = this.advanceCardData.GetConditionValue();
                if (conditionValue) {
                    conditionForegroundColor = this.advanceCard.GetConditionalColors(conditionValue, "F", this.conditionSettings);
                    conditionBackgroundColor = this.advanceCard.GetConditionalColors(conditionValue, "B", this.conditionSettings);
                }
            }

            if (this.strokeSettings.show) {
                if (!this.advanceCard.StrokeExists()) {
                    this.advanceCard.CreateStroke();
                }
                this.advanceCard.UpdateStroke(this.strokeSettings);
            } else if (this.advanceCard.StrokeExists()) {
                this.advanceCard.RemoveStroke();
            }

            if (this.fillSettings.show) {
                if (!this.advanceCard.FillExists()) {
                    this.advanceCard.CreateFill();
                }
                if (conditionBackgroundColor) {
                    this.advanceCard.UpdateFill(this.fillSettings, conditionBackgroundColor);
                } else {
                    this.advanceCard.UpdateFill(this.fillSettings, this.fillSettings.backgroundColor as string);
                }
            } else if (this.advanceCard.FillExists()) {
                this.advanceCard.RemoveFill();
            }

            if (this.advanceCard.DataLabelExist()) {
                if (conditionForegroundColor &&  this.conditionSettings.applyToDataLabel) {
                    this.advanceCard.UpdateDataLabelColor(conditionForegroundColor);
                } else {
                    this.advanceCard.UpdateDataLabelColor(this.dataLabelSettings.color);
                }
                this.advanceCard.UpdateDataLabelTransform();
            }
            if (this.advanceCard.CategoryLabelExist()) {
                if (conditionForegroundColor && this.conditionSettings.applyToCategoryLabel) {
                    this.advanceCard.UpdateCategoryLabelColor(conditionForegroundColor);
                } else {
                    this.advanceCard.UpdateCategoryLabelColor(this.categoryLabelSettings.color);
                }
                this.advanceCard.UpdateCategoryLabelTransform();
            }
            if (this.advanceCard.PrefixLabelExist()) {
                if (conditionForegroundColor && this.conditionSettings.applyToPrefix) {
                    this.advanceCard.UpdatePrefixLabelColor(conditionForegroundColor);
                } else {
                    this.advanceCard.UpdatePrefixLabelColor(this.prefixSettings.color);
                }
                this.advanceCard.UpdatePrefixLabelTransform();
            }
            if (this.advanceCard.PostfixLabelExist()) {
                if (conditionForegroundColor && this.conditionSettings.applyToPostfix) {
                    this.advanceCard.UpdatePostfixLabelColor(conditionForegroundColor);
                } else {
                    this.advanceCard.UpdatePostfixLabelColor(this.postfixSettings.color);
                }
                this.advanceCard.UpdatePostfixLabelTransform();
            }

            let selectionId = this.host.createSelectionIdBuilder()
                .withMeasure(options.dataViews[0].table.columns[0].queryName)
                .createSelectionId();

            let rootElement = this.advanceCard.GetRootElement();
            let tooltipData = this.advanceCardData.GetTooltipData();

            rootElement.on("mousemove", (e) => {
                if (tooltipData) {
                    const mouseX = mouse(rootElement.node() as any)[0];
                    const mouseY = mouse(rootElement.node() as any)[1];
                    this.host.tooltipService.show({
                        "dataItems": tooltipData,
                        "identities": [selectionId],
                        "coordinates": [mouseX, mouseY],
                        "isTouchEvent": true
                    });
                }
            });

        } catch (err) {
            console.log(err);
        }

        let t1 = performance.now();
        // console.log("Advance Card creation time: " + (t1 - t0).toFixed(2) + " milliseconds");


        // let conditionFieldPresent: boolean = false;
        // let conditionValue: number;
        // let dataFieldPresent: boolean;
        // let dataLabelValue: any;
        // let prefixFieldPresent: boolean;
        // let prefixValue: any;
        // let postfixFieldPresent: boolean;
        // let postfixValue: any;
        // let categoryLabelValue: string;
        // let dataLabelType: any;
        // let dataLabelFormat: string;
        // let displayUnitSystem = DisplayUnitSystemType.DataLabels;

        // const showPrefix = () => {
        //     return this.prefixSettings.show === true && !StringExtensions.isNullOrEmpty(prefixValue);
        // };
        // const showPostfix = () => {
        //     return this.postfixSettings.show === true && !StringExtensions.isNullOrEmpty(postfixValue);
        // };

        // this.tableData.columns.forEach((column, index) => {
        //     if (column.roles.mainMeasure !== undefined) {
        //         dataFieldPresent = true;
        //         dataLabelValue = this.tableData.rows[0][index];
        //         categoryLabelValue = this.tableData.columns[index].displayName;
        //         dataLabelType = this.tableData.columns[index].type;
        //         dataLabelFormat = this.tableData.columns[index].format;
        //     } else if (dataFieldPresent !== true) {
        //         dataFieldPresent = false;
        //     }

        //     if (
        //         column.roles.conditionMeasure === true &&
        //         ( column.type.numeric === true || column.type.integer === true )
        //     ) {
        //         conditionValue = this.tableData.rows[0][index] as number;
        //         conditionFieldPresent = true;
        //     } else if (conditionFieldPresent !== true) {
        //         conditionValue = dataLabelValue as number;
        //     }

        //     if (column.roles.prefixMeasure) {
        //         prefixFieldPresent = true;
        //         prefixValue = this.tableData.rows[0][index];
        //     } else if (prefixFieldPresent !== true) {
        //         prefixFieldPresent = false;
        //         prefixValue = this.prefixSettings.text;
        //     }

        //     if (column.roles.postfixMeasure) {
        //         postfixFieldPresent = true;
        //         postfixValue = this.tableData.rows[0][index];
        //     } else if (postfixFieldPresent !== true) {
        //         postfixFieldPresent = false;
        //         postfixValue = this.postfixSettings.text;
        //     }
        // });

        // if (dataFieldPresent === false) {
        //     this.categoryLabelSettings.show = false;
        // }

        // if (typeof document !== "undefined") {

        //     // adding parent element ---------------------------------------------------------------------------------------------
        //     this.root = select(".root").remove();
        //     this.root = select(this.target)
        //         .append("svg")
        //         .classed("root", true)
        //         .attr("width", viewPortWidth)
        //         .attr("height", viewPortHeight);

        //     // adding background and stroke ----------------------------------------------------------------------------------------
        //     if (this.fillSettings.show === true || this.strokeSettings.show === true) {

        //         this.cardBackground = this.root.append("g")
        //             .classed("cardBG", true)
        //             .attr("opacity", 1 - this.fillSettings.transparency / 100);

        //         let pathData: string;
        //         if (this.strokeSettings.show === true) {
        //             pathData = this.rounded_rect(
        //                 this.strokeSettings.strokeWidth / 2, this.strokeSettings.strokeWidth / 2,
        //                 viewPortWidth - this.strokeSettings.strokeWidth,
        //                 viewPortHeight - this.strokeSettings.strokeWidth,
        //                 this.strokeSettings
        //             );
        //         } else {
        //             pathData = this.rounded_rect(
        //                 0, 0,
        //                 viewPortWidth,
        //                 viewPortHeight,
        //                 this.strokeSettings
        //             );
        //         }

        //         let cardBGShape = this.cardBackground.append("path")
        //             .attr("d", pathData);

        //         if (this.fillSettings.show === true) {
        //             cardBGShape.attr("fill",
        //                 this._getConditionalColors(conditionValue, "B", this.conditionSettings) ||
        //                         (this.fillSettings.backgroundColor as string || "none"),
        //             );
        //         } else {
        //             cardBGShape.attr("fill", "none");
        //         }

        //         if (this.fillSettings.showImage === true && this.fillSettings.show === true) {

        //             this.strokeSettings.cornerRadius = this.strokeSettings.cornerRadius - this.fillSettings.imagePadding * 0.25;
        //             let clipPathData = this.rounded_rect(
        //                 0, 0,
        //                 viewPortWidth - this.strokeSettings.strokeWidth * 2 - this.fillSettings.imagePadding,
        //                 viewPortHeight - this.strokeSettings.strokeWidth * 2 - this.fillSettings.imagePadding,
        //                 this.strokeSettings
        //             );
        //             this.strokeSettings.cornerRadius = this.strokeSettings.cornerRadius + this.fillSettings.imagePadding * 0.25;

        //             let translateXY = this.strokeSettings.strokeWidth + this.fillSettings.imagePadding / 2;
        //             // this.cardBackground.append("g")
        //             //     .attr("transform", "translate(" + translateXY + "," + translateXY + ")")
        //             //     .append("path")
        //             //     .attr("d", clipPathData)
        //             //     .attr("fill", "none")
        //             //     .attr("stroke", this.strokeSettings.strokeColor as string || "none")
        //             //     .attr("stroke-width", this.strokeSettings.strokeWidth);

        //             this.cardBackground.append("defs")
        //                 .append("clipPath")
        //                 .attr("id", "imageClipPath")
        //                 .append("path")
        //                 .attr("d", clipPathData);

        //             let cardBGImage = this.cardBackground
        //                 .append("g")
        //                 .classed("cardBGImage", true)
        //                 .attr("transform", "translate(" + translateXY + "," + translateXY + ")")
        //                 .attr("clip-path", "url(#imageClipPath)")
        //                 .append("image")
        //                 .attr("xlink:href", this.fillSettings.imageURL)
        //                 .attr("height", viewPortHeight - this.strokeSettings.strokeWidth - this.fillSettings.imagePadding)
        //                 .attr("width", viewPortWidth - this.strokeSettings.strokeWidth - this.fillSettings.imagePadding);
        //         }

        //         if (this.strokeSettings.show === true) {
        //             const strokeType = this.settings.strokeSettings.strokeType;
        //             cardBGShape.attr("stroke", this.strokeSettings.strokeColor as string || "none")
        //                 .attr("stroke-width", this.strokeSettings.strokeWidth)
        //                 .style("stroke-dasharray", (d) => {
        //                     if (!StringExtensions.isNullOrUndefinedOrWhiteSpaceString(this.strokeSettings.strokeArray)) {
        //                         return this.strokeSettings.strokeArray as string;
        //                     } else {
        //                         if (strokeType === "1") {
        //                             return "8 , 4";
        //                         } else if (strokeType === "2") {
        //                             return "2 , 4";
        //                         }
        //                     }
        //                 });
        //         }
        //     }
        //     // end adding background and stroke ------------------------------------------------------------------------------------

        //     // adding parent element -----------------------------------------------------------------------------------------------
        //     this.cardGrp = this.root.append("g")
        //         .classed("cardGrp", true);

        //     this.contentGrp = this.cardGrp
        //         .append("g")
        //         .classed("contentGrp", true);
        //     // end adding parent element -----------------------------------------------------------------------------------------

        //     this.contentGrp = this.contentGrp.append("text")
        //         .style("text-anchor", "middle");

        //     // adding prefix -----------------------------------------------------------------------------------------------------
        //     if (showPrefix() === true) {
        //         const prefixLabelTextProperties: TextProperties = {
        //             "text": prefixValue,
        //             "fontFamily": this.prefixSettings.fontFamily,
        //             "fontSize": PixelConverter.fromPoint(this.prefixSettings.fontSize)
        //         };
        //         const prefixValueShort = TextMeasurementService.getTailoredTextOrDefault(
        //             prefixLabelTextProperties,
        //             viewPortWidth - this._getAlignmentSpacing(this.generalSettings) -
        //             this.strokeSettings.strokeWidth - this.strokeSettings.cornerRadius
        //         );
        //         this.prefixLabel = this.contentGrp
        //             .append("tspan")
        //             .classed("prefixLabel", true)
        //             .style("text-anchor", "start")
        //             .style("fill",
        //                 this.conditionSettings.applyToPrefix === true ?
        //                 this._getConditionalColors(conditionValue, "F", this.conditionSettings) || this.prefixSettings.color :
        //                 this.prefixSettings.color
        //             );

        //         this.prefixLabel = this._setTextStyleProperties(this.prefixLabel, this.prefixSettings);
        //         this.prefixLabel.text(prefixValueShort);

        //     } else if (this.prefixLabel) {
        //         select(".prefixLabel").remove();
        //     }
        //     // end adding prefix ------------------------------------------------------------------------------------------------------

        //     // adding data label -------------------------------------------------------------------------------------------------------
        //     let dataLabelValueFormatted;
        //     if (dataFieldPresent === true) {
        //         if (dataLabelType.numeric || dataLabelType.integer) {
        //             dataLabelValueFormatted = this._format(dataLabelValue as number,
        //             {
        //                 "format": dataLabelFormat,
        //                 "value": (this.dataLabelSettings.displayUnit === 0 ? dataLabelValue as number  : this.dataLabelSettings.displayUnit),
        //                 "precision": this.dataLabelSettings.decimalPlaces,
        //                 "allowFormatBeautification": false,
        //                 "formatSingleValues": this.dataLabelSettings.displayUnit === 0,
        //                 "displayUnitSystemType": displayUnitSystem,
        //                 "cultureSelector": this.culture
        //             });
        //         } else {
        //             dataLabelValueFormatted = this._format(
        //             dataLabelType.dateTime && dataLabelValue ? new Date(dataLabelValue) : dataLabelValue,
        //                 {
        //                     "format": dataLabelFormat,
        //                     "cultureSelector": this.culture
        //                 }
        //             );
        //         }

        //         const dataLabelTextProperties: TextProperties = {
        //             "text": dataLabelValueFormatted,
        //             "fontFamily": this.dataLabelSettings.fontFamily,
        //             "fontSize": PixelConverter.fromPoint(this.dataLabelSettings.fontSize)
        //         };
        //         const prefixWidth = (
        //             showPrefix() === true ?
        //             TextMeasurementService.measureSvgTextElementWidth(this.prefixLabel.node() as any) + this.prefixSettings.spacing :
        //             0
        //         );

        //         let cornerRadiusSubtract = 0;
        //         if (
        //             (
        //                 this.generalSettings.alignment === "left" && (
        //                     this.strokeSettings.topLeft || this.strokeSettings.bottomLeft ||
        //                     this.strokeSettings.topLeftInward || this.strokeSettings.bottomLeftInward
        //                 )
        //             ) || (
        //                 this.generalSettings.alignment === "right" && (
        //                     this.strokeSettings.topRight || this.strokeSettings.bottomRight ||
        //                     this.strokeSettings.topRightInward || this.strokeSettings.bottomRightInward
        //                 )
        //             )
        //         ) {
        //             cornerRadiusSubtract = this.strokeSettings.cornerRadius;
        //         }
        //         let allowedTextWidth = viewPortWidth -
        //             prefixWidth -
        //             this._getAlignmentSpacing(this.generalSettings) -
        //             (this.strokeSettings.show === true ? this.strokeSettings.strokeWidth : 0) -
        //             cornerRadiusSubtract;

        //         const dataLabelValueShort = TextMeasurementService.getTailoredTextOrDefault(dataLabelTextProperties, allowedTextWidth);
        //         this.dataLabel = this.contentGrp
        //             .append("tspan")
        //             .classed("dataLabel", true)
        //             .attr("dx", () => {
        //                 if (showPrefix() === true) {
        //                     return this.prefixSettings.spacing;
        //                 } else {
        //                     return 0;
        //                 }
        //             })
        //             .style("text-anchor", "start")
        //             .style("fill",
        //                 this.conditionSettings.applyToDataLabel === true ?
        //                 this._getConditionalColors(conditionValue, "F", this.conditionSettings) || this.dataLabelSettings.color :
        //                 this.dataLabelSettings.color
        //             );

        //             this.dataLabel = this._setTextStyleProperties(this.dataLabel, this.dataLabelSettings);
        //             this.dataLabel.text(dataLabelValueShort);
        //     }

        //     // end adding data label --------------------------------------------------------------------------------------------------

        //     // adding postfix ------------------------------------------------------------------------------------------------------
        //     if (showPostfix() === true) {
        //         const prefixWidth = (
        //             showPrefix() === true ?
        //             TextMeasurementService.measureSvgTextElementWidth(this.prefixLabel.node() as any) + this.prefixSettings.spacing :
        //             0
        //         );
        //         const dataLabelWidth = (
        //             dataFieldPresent === true ?
        //             TextMeasurementService.measureSvgTextElementWidth(this.dataLabel.node() as any) :
        //             0
        //         );
        //         const postfixLabelTextProperties: TextProperties = {
        //             "text": postfixValue,
        //             "fontFamily": this.postfixSettings.fontFamily,
        //             "fontSize": PixelConverter.fromPoint(this.postfixSettings.fontSize)
        //         };
        //         const postfixValueShort = TextMeasurementService.getTailoredTextOrDefault(
        //             postfixLabelTextProperties,
        //             viewPortWidth - prefixWidth - dataLabelWidth - this.strokeSettings.strokeWidth -
        //             this._getAlignmentSpacing(this.generalSettings) - this.strokeSettings.cornerRadius
        //         );
        //         postfixLabelTextProperties.text = postfixValueShort;

        //         this.postfixLabel = this.contentGrp
        //             .append("tspan")
        //             .classed("postfixLabel", true)
        //             .attr("dx", () => {
        //                 if (showPostfix() === true) {
        //                     return this.postfixSettings.spacing;
        //                 } else {
        //                     return 0;
        //                 }
        //             })
        //             .style("text-anchor", "start")
        //             .style("fill",
        //                 this.conditionSettings.applyToPostfix === true ?
        //                 this._getConditionalColors(conditionValue, "F", this.conditionSettings) || this.postfixSettings.color :
        //                 this.postfixSettings.color
        //             );

        //             this.postfixLabel = this._setTextStyleProperties(this.postfixLabel, this.postfixSettings);
        //             this.postfixLabel.text(postfixValueShort);

        //     } else if (this.postfixLabel) {
        //         select(".postfixLabel").remove();
        //     }
        //     // end adding postfix -----------------------------------------------------------------------------------------------------

        //     // adding title to content ------------------------------------------------------------------------------------------------
        //     let title = "";
        //     title += showPrefix() === true ? prefixValue + " " : "";
        //     title += dataFieldPresent === true ? dataLabelValueFormatted as string : "";
        //     title += showPostfix() === true ? " " + postfixValue : "";
        //     this.contentGrp.append("title")
        //         .text(title);
        //     // end adding title to content --------------------------------------------------------------------------------------------

        //     let cardGrpWidth: number;
        //     let cardGrpHeight: number;
        //     let cardGrpSize: SVGRect;
        //     // adding category label --------------------------------------------------------------------------------------------------
        //     if (this.categoryLabelSettings.show === true && dataFieldPresent === true) {

        //         const categoryLabelTextProperties: TextProperties = {
        //             "text": categoryLabelValue,
        //             "fontFamily": this.categoryLabelSettings.fontFamily,
        //             "fontSize": PixelConverter.fromPoint(this.categoryLabelSettings.fontSize)
        //         };

        //         const prefixWidth = (
        //             showPrefix() === true ?
        //             TextMeasurementService.measureSvgTextElementWidth(this.prefixLabel.node() as any) + this.prefixSettings.spacing :
        //             0
        //         );

        //         const categoryLabelValueShort = TextMeasurementService.getTailoredTextOrDefault(
        //             categoryLabelTextProperties,
        //             viewPortWidth - prefixWidth / 2 - this._getAlignmentSpacing(this.generalSettings) -
        //             this.strokeSettings.strokeWidth - this.strokeSettings.cornerRadius
        //         );

        //         this.categoryLabelGrp = this.cardGrp.append("g")
        //         .classed("categoryLabelGrp", true);

        //         this.categoryLabel = this.categoryLabelGrp.append("g")
        //             .classed("categoryLabel", true)
        //             .append("text")
        //             .append("tspan")
        //             .style("text-anchor", "start")
        //             .style("fill",
        //                 this.conditionSettings.applyToCategoryLabel === true ?
        //                 this._getConditionalColors(conditionValue, "F", this.conditionSettings) || this.categoryLabelSettings.color :
        //                 this.categoryLabelSettings.color
        //             );

        //         this.categoryLabel = this._setTextStyleProperties(this.categoryLabel, this.categoryLabelSettings);
        //         this.categoryLabel.text(categoryLabelValueShort);

        //         cardGrpSize = (this.contentGrp.node() as any).getBoundingClientRect();
        //         cardGrpWidth = cardGrpSize.width;
        //         cardGrpHeight = cardGrpSize.height;
        //         const categoryLabelSize: SVGRect = (this.categoryLabel.node() as any).getBoundingClientRect();
        //         const categoryLabelWidth: number = categoryLabelSize.width;
        //         const categoryLabelHeight: number = categoryLabelSize.height;

        //         let categoryLabelX: number;
        //         const categoryLabelY: number = cardGrpHeight / 2 + categoryLabelHeight * 0.5;

        //         if (this.generalSettings.alignment === "left") {
        //             categoryLabelX = 0;
        //         } else if (this.generalSettings.alignment === "center") {
        //             categoryLabelX = cardGrpWidth / 2 - categoryLabelWidth / 2;
        //         } else if (this.generalSettings.alignment === "right") {
        //             categoryLabelX = cardGrpWidth - categoryLabelWidth;
        //         }
        //         this.categoryLabelGrp = this.categoryLabelGrp.attr("transform", "translate(" + categoryLabelX + "," + categoryLabelY + ")");

        //         this.categoryLabel = this.categoryLabel.append("title")
        //             .text(categoryLabelValue ? categoryLabelValue : "");

        //     } else if (this.categoryLabelGrp) {
        //         this.categoryLabelGrp = select(".categoryLabelGrp").remove();
        //         this.categoryLabelSettings.show = false;
        //     }
        //     // end adding category label -----------------------------------------------------------------------------------------------

        //     cardGrpSize = (this.cardGrp.node() as any).getBoundingClientRect();
        //     cardGrpWidth = cardGrpSize.width;
        //     cardGrpHeight = cardGrpSize.height;

        //     let cardGrpX: number;
        //     const cardGrpY: number = (viewPortHeight / 2 + (this.categoryLabelSettings.show === true ? 0 : cardGrpHeight * 0.3));
        //     const alignmentSpacing = this._getAlignmentSpacing(this.generalSettings);

        //     if (this.generalSettings.alignment === "left") {
        //         if (
        //             (this.strokeSettings.show === true || this.fillSettings.show === true) &&
        //             (this.strokeSettings.topLeft === true || this.strokeSettings.bottomLeft === true)
        //         ) {
        //             cardGrpX = alignmentSpacing + this.strokeSettings.cornerRadius;
        //         } else {
        //             cardGrpX = alignmentSpacing;
        //         }
        //     } else if (this.generalSettings.alignment === "center") {
        //         if (viewPortWidth > cardGrpWidth) {
        //             cardGrpX = viewPortWidth / 2 - cardGrpWidth / 2;
        //         } else {
        //             cardGrpX = 5;
        //         }
        //     } else if (this.generalSettings.alignment === "right") {
        //         if (
        //             (this.strokeSettings.show === true || this.fillSettings.show === true) &&
        //             (this.strokeSettings.topRight === true || this.strokeSettings.bottomRight === true)
        //         ) {
        //             cardGrpX = viewPortWidth - cardGrpWidth - alignmentSpacing - this.strokeSettings.cornerRadius;
        //         } else {
        //             cardGrpX = viewPortWidth - cardGrpWidth - alignmentSpacing;
        //         }
        //     }

        //     this.cardGrp = this.cardGrp.attr("transform", "translate(" + cardGrpX + ", " + cardGrpY + ")");

        //     // adding tooltip -----------------------------------------------------------------------------------------------------------
        //     if (this.tooltipSettings.show === true) {
        //         const tooltipDataItems = [];
        //         if (this.tooltipSettings.title != null || this.tooltipSettings.content != null) {
        //             tooltipDataItems.push({
        //                 "displayName": this.tooltipSettings.title,
        //                 "value": this.tooltipSettings.content
        //             });
        //         }

        //         this.tableData.columns.forEach((column, index) => {
        //             const displayUnit = this.getPropertyValue<number>(column.objects, "tootlipSettings", "measureFormat", 0);
        //             const precision = this.getPropertyValue<number>(column.objects, "tootlipSettings", "measurePrecision", 0);
        //             const value = this.tableData.rows[0][index];
        //             const valueType = this.tableData.columns[index].type;
        //             let valueFormatted = "";

        //             if (valueType.numeric || valueType.integer) {
        //                 valueFormatted = this._format(
        //                     value as number,
        //                     {
        //                         "format": this.tableData.columns[index].format,
        //                         "value": displayUnit === 0 ? value as number : displayUnit,
        //                         "precision": precision,
        //                         "allowFormatBeautification": false,
        //                         "formatSingleValues": displayUnit === 0,
        //                         "displayUnitSystemType": displayUnitSystem,
        //                         "cultureSelector": this.culture
        //                     });
        //             } else {
        //                 valueFormatted = this._format(
        //                     valueType.dateTime ? new Date(value as string) : value,
        //                     {
        //                         "format": this.tableData.columns[index].format,
        //                         "cultureSelector": this.culture
        //                     }
        //                 );
        //             }
        //             if (column.roles.tooltipMeasures === true) {
        //                 tooltipDataItems.push({
        //                     "displayName": this.tableData.columns[index].displayName,
        //                     "value": valueFormatted
        //                 });
        //             }
        //         });

        //         this.root.on("mousemove", (e) => {
        //             const mouseX = mouse(this.root.node() as any)[0];
        //             const mouseY = mouse(this.root.node() as any)[1];

        //             this.host.tooltipService.show({
        //                 "dataItems": tooltipDataItems,
        //                 "identities": [],
        //                 "coordinates": [mouseX, mouseY],
        //                 "isTouchEvent": true
        //             });
        //         });
        //     }
        // }

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
                        "conditionNumbers": this.conditionSettings.conditionNumbers,
                        "applyToDataLabel": this.conditionSettings.applyToDataLabel,
                        "applyToCategoryLabel": this.conditionSettings.applyToCategoryLabel,
                        "applyToPrefix": this.conditionSettings.applyToPrefix,
                        "applyToPostfix": this.conditionSettings.applyToPostfix
                    },
                    "selector": null
                });
                for (let index = 1; index <= this.conditionSettings.conditionNumbers; index++) {
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
            return (AdvanceCardVisualSettings.enumerateObjectInstances(this.settings, options) as VisualObjectInstanceEnumerationObject);
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

    private _parseSettings(dataView: DataView): AdvanceCardVisualSettings {
        return AdvanceCardVisualSettings.parse(dataView) as AdvanceCardVisualSettings;
    }
}