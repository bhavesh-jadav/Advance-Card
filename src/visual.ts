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
let helpUrl = "http://www.bhaveshjadav.in/powerbi/advancecard/";

import "./../style/visual.less";
import "@babel/polyfill";

import { event as d3event, mouse } from "d3-selection";
import powerbi from "powerbi-visuals-api";
import { stringExtensions as StringExtensions } from "powerbi-visuals-utils-formattingutils";

import { AdvanceCard } from "./AdvanceCard";
import { AdvanceCardData } from "./AdvanceCardData";
import { AdvanceCardVisualSettings } from "./settings";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
import VisualUpdateOptions = powerbi.extensibility.visual.VisualUpdateOptions;
import IVisual = powerbi.extensibility.visual.IVisual;
import EnumerateVisualObjectInstancesOptions = powerbi.EnumerateVisualObjectInstancesOptions;
import VisualObjectInstance = powerbi.VisualObjectInstance;
import DataView = powerbi.DataView;
import VisualObjectInstanceEnumerationObject = powerbi.VisualObjectInstanceEnumerationObject;
import IVisualHost = powerbi.extensibility.visual.IVisualHost;

export class AdvanceCardVisual implements IVisual {
    private settings: AdvanceCardVisualSettings;
    private host: IVisualHost;
    private tableData: powerbi.DataViewTable;
    private culture: string;
    private renderingEvents: powerbi.extensibility.IVisualEventService

    private advanceCard: AdvanceCard;
    private advanceCardData: AdvanceCardData;
    private selectionManager: powerbi.extensibility.ISelectionManager;

    constructor(options: VisualConstructorOptions) {
        this.renderingEvents = options.host.eventService;
        this.host = options.host;
        this.advanceCard = new AdvanceCard(options.element);
        this.selectionManager = options.host.createSelectionManager();
    }

    public update(options: VisualUpdateOptions) {
        try {
            //let t0 = performance.now();
            this.renderingEvents.renderingStarted(options);
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

            this.culture = this.host.locale;

            if (this.settings.conditionSettings.conditionNumbers > 10) {
                this.settings.conditionSettings.conditionNumbers = 10;
            }
            else if (this.settings.conditionSettings.conditionNumbers <= 0) {
                this.settings.conditionSettings.conditionNumbers = 1;
            }

            const viewPortHeight: number = options.viewport.height;
            const viewPortWidth: number = options.viewport.width;

            this.advanceCardData = new AdvanceCardData(this.tableData, this.settings, this.culture);
            let dataLabelValue = this.advanceCardData.GetDataLabelValue();
            let prefixLabelValue = this.advanceCardData.GetPrefixLabelValue();
            let postfixLabelValue = this.advanceCardData.GetPostfixLabelValue();

            this.advanceCard.UpdateSettings(this.settings);
            this.advanceCard.SetSize(viewPortWidth, viewPortHeight);

            // Create all the respective element in DOM based on settings.
            if (dataLabelValue) {
                if (!this.advanceCard.DataLabelExist()) {
                    this.advanceCard.CreateDataLabel();
                }
                if (this.settings.categoryLabelSettings.show) {
                    if (!this.advanceCard.CategoryLabelExist()) {
                        this.advanceCard.CreateCategoryLabel();
                    }
                } else if (this.advanceCard.CategoryLabelExist()) {
                    this.advanceCard.RemoveCategoryLabel();
                }
            } else if (this.advanceCard.DataLabelExist()) {
                this.advanceCard.RemoveDataLabel();
                if (this.advanceCard.CategoryLabelExist()) {
                    this.advanceCard.RemoveCategoryLabel();
                }
            }

            if (this.settings.prefixSettings.show && prefixLabelValue) {
                if (!this.advanceCard.PrefixLabelExist()) {
                    this.advanceCard.CreatePrefixLabel();
                }
            } else if (this.advanceCard.PrefixLabelExist()) {
                this.advanceCard.RemovePrefixLabel();
            }

            if (this.settings.postfixSettings.show && postfixLabelValue) {
                if (!this.advanceCard.PostfixLabelExist()) {
                    this.advanceCard.CreatePostfixLabel();
                }
            } else if (this.advanceCard.PostfixLabelExist()) {
                this.advanceCard.RemovePostfixLabel();
            }

            if (this.settings.strokeSettings.show) {
                if (!this.advanceCard.StrokeExists()) {
                    this.advanceCard.CreateStroke();
                }
            } else if (this.advanceCard.StrokeExists()) {
                this.advanceCard.RemoveStroke();
            }
            if (this.settings.backgroundSettings.show) {
                if (!this.advanceCard.FillExists()) {
                    this.advanceCard.CreateFill();
                }
            } else if (this.advanceCard.FillExists()) {
                this.advanceCard.RemoveFill();
            }


            // Get conditional color and store it in variable.
            let conditionForegroundColor: string = undefined;
            let conditionBackgroundColor: string = undefined;
            if (this.settings.conditionSettings.show) {
                let conditionValue = this.advanceCardData.GetConditionValue();
                if (conditionValue) {
                    conditionForegroundColor = this.advanceCard.GetConditionalColors(conditionValue, "F", this.settings.conditionSettings);
                    conditionBackgroundColor = this.advanceCard.GetConditionalColors(conditionValue, "B", this.settings.conditionSettings);
                }
            }

            // Update settings such as value, styles, colors etc. of all the element that were created.
            if (this.advanceCard.DataLabelExist()) {
                this.advanceCard.UpdateDataLabelValue(dataLabelValue);
                this.advanceCard.UpdateDataLabelTextStyle();
                if (this.advanceCard.CategoryLabelExist()) {
                    this.advanceCard.UpdateCategoryLabelValue(this.advanceCardData.GetDataLabelDisplayName());
                    this.advanceCard.UpdateCategoryLabelStyles();
                    if (conditionForegroundColor && this.settings.conditionSettings.applyToCategoryLabel) {
                        this.advanceCard.UpdateCategoryLabelColor(conditionForegroundColor);
                    } else {
                        this.advanceCard.UpdateCategoryLabelColor(this.settings.categoryLabelSettings.color);
                    }
                }
                if (conditionForegroundColor &&  this.settings.conditionSettings.applyToDataLabel) {
                    this.advanceCard.UpdateDataLabelColor(conditionForegroundColor);
                } else {
                    this.advanceCard.UpdateDataLabelColor(this.settings.dataLabelSettings.color);
                }
            }

            if (this.advanceCard.PrefixLabelExist()) {
                this.advanceCard.UpdatePrefixLabelValue(prefixLabelValue);
                this.advanceCard.UpdatePrefixLabelStyles();
                if (conditionForegroundColor && this.settings.conditionSettings.applyToPrefix) {
                    this.advanceCard.UpdatePrefixLabelColor(conditionForegroundColor);
                } else {
                    this.advanceCard.UpdatePrefixLabelColor(this.settings.prefixSettings.color);
                }
            }

            if (this.advanceCard.PostfixLabelExist()) {
                this.advanceCard.UpdatePostfixLabelValue(postfixLabelValue);
                this.advanceCard.UpdatePostfixLabelStyles();
                if (conditionForegroundColor && this.settings.conditionSettings.applyToPostfix) {
                    this.advanceCard.UpdatePostfixLabelColor(conditionForegroundColor);
                } else {
                    this.advanceCard.UpdatePostfixLabelColor(this.settings.postfixSettings.color);
                }
            }

            if (this.advanceCard.StrokeExists()) {
                this.advanceCard.UpdateStroke(this.settings.strokeSettings);
            }

            if (this.advanceCard.FillExists()) {
                if (conditionBackgroundColor) {
                    this.advanceCard.UpdateFill(this.settings.backgroundSettings, conditionBackgroundColor);
                } else {
                    this.advanceCard.UpdateFill(this.settings.backgroundSettings, this.settings.backgroundSettings.backgroundColor as string);
                }
            }

            // Position each element correctly in DOM.
            if (this.advanceCard.DataLabelExist()) {
                this.advanceCard.UpdateDataLabelTransform();
            }
            if (this.advanceCard.CategoryLabelExist()) {
                this.advanceCard.UpdateCategoryLabelTransform();
            }
            if (this.advanceCard.PrefixLabelExist()) {
                this.advanceCard.UpdatePrefixLabelTransform();
            }
            if (this.advanceCard.PostfixLabelExist()) {
                this.advanceCard.UpdatePostfixLabelTransform();
            }

            let rootSVGElement = this.advanceCard.GetRootElement();

            rootSVGElement.on("click", (e) => {
                if (this.settings.externalLink.show && !StringExtensions.isNullOrUndefinedOrWhiteSpaceString(this.settings.externalLink.url)) {
                    this.host.launchUrl(this.settings.externalLink.url);
                }
            });

            let selectionId = this.host.createSelectionIdBuilder()
                .withMeasure(options.dataViews[0].table.columns[0].queryName)
                .createSelectionId();
            let tooltipData = this.advanceCardData.GetTooltipData();
            rootSVGElement.on("mousemove", (e) => {
                if (tooltipData) {
                    const mouseX = mouse(rootSVGElement.node() as any)[0];
                    const mouseY = mouse(rootSVGElement.node() as any)[1];
                    this.host.tooltipService.show({
                        "dataItems": tooltipData,
                        "identities": [selectionId],
                        "coordinates": [mouseX, mouseY],
                        "isTouchEvent": true
                    });
                }
            });

            rootSVGElement.on("contextmenu", () => {
                const mouseEvent: MouseEvent = d3event as MouseEvent;
                this.selectionManager.showContextMenu(selectionId, {
                    x: mouseEvent.clientX,
                    y: mouseEvent.clientY
                });
                mouseEvent.preventDefault();
            });

            this.renderingEvents.renderingFinished(options);

            //let t1 = performance.now();
            // console.log("Advance Card creation time: " + (t1 - t0).toFixed(2) + " milliseconds");
            // debugger;

        } catch (err) {
            this.renderingEvents.renderingFailed(options, err as string);
            console.log(err);
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
        switch (options.objectName) {
            case "general":
                settings.push({
                    "objectName": options.objectName,
                    "properties": {
                        "alignmentSpacing": this.settings.general.alignmentSpacing,
                        "alignment": this.settings.general.alignment
                    },
                    "selector": null
                });
                break;

            case "conditionSettings":
                settings.push({
                    "objectName": options.objectName,
                    "properties": {
                        "show": this.settings.conditionSettings.show,
                        "conditionNumbers": this.settings.conditionSettings.conditionNumbers,
                        "applyToDataLabel": this.settings.conditionSettings.applyToDataLabel,
                        "applyToCategoryLabel": this.settings.conditionSettings.applyToCategoryLabel,
                        "applyToPrefix": this.settings.conditionSettings.applyToPrefix,
                        "applyToPostfix": this.settings.conditionSettings.applyToPostfix
                    },
                    "selector": null
                });
                for (let index = 1; index <= this.settings.conditionSettings.conditionNumbers; index++) {
                    settings.push({
                        "objectName": options.objectName,
                        "properties": {
                            [conditionKey + index]: this.settings.conditionSettings["condition" + index],
                            [valueKey + index]: this.settings.conditionSettings["value" + index],
                            [foregroundColorKey + index]: this.settings.conditionSettings["foregroundColor" + index],
                            [backgroundColorKey + index]: this.settings.conditionSettings["backgroundColor" + index]
                        },
                        "selector": null
                    });
                }
                break;

            case "tootlipSettings":
                settings.push({
                    "objectName": options.objectName,
                    "properties": {
                        "title": this.settings.tootlipSettings.title,
                        "content": this.settings.tootlipSettings.content
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
                if (this.settings.backgroundSettings.showImage === true) {
                    settings.push({
                        "objectName": options.objectName,
                        "displayName": "Fill",
                        "properties": {
                            "show": this.settings.backgroundSettings.show,
                            "backgroundColor": this.settings.backgroundSettings.backgroundColor,
                            "showImage": this.settings.backgroundSettings.showImage,
                            "imageURL": this.settings.backgroundSettings.imageURL,
                            "imagePadding": this.settings.backgroundSettings.imagePadding,
                            "transparency": this.settings.backgroundSettings.transparency
                        },
                        "selector": null
                    });
                } else {
                    settings.push({
                        "objectName": options.objectName,
                        "displayName": "Fill",
                        "properties": {
                            "show": this.settings.backgroundSettings.show,
                            "backgroundColor": this.settings.backgroundSettings.backgroundColor,
                            "showImage": this.settings.backgroundSettings.showImage,
                            "transparency": this.settings.backgroundSettings.transparency
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