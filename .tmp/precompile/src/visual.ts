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

import valueFormatter = powerbi.extensibility.utils.formatting.valueFormatter;
module powerbi.extensibility.visual.advanceCardE03760C5AB684758B56AA29F9E6C257B  {
    "use strict";
    export class Visual implements IVisual {
        private target: HTMLElement; // to store root html element

        private settings: VisualSettings; // to store settings i.e. properties of the visual
        private prefixSettings: FixLabelSettings;
        private dataLabelSettings: DataLabelSettings;
        private postfixSettings: FixLabelSettings;
        private categoryLabelSettings: CategoryLabelSettings;
        private backgroundSettings: BackgroundSettings;
        private strokeSettings: StrokeSettings;
        private conditionSettings: ConditionSettings;
        private tooltipSettings: TooltipSettings;

        private root: d3.Selection<SVGElement>;
        private cardGrp: d3.Selection<SVGElement>;
        private contentGrp: d3.Selection<SVGElement>;
        private dataLabel: d3.Selection<SVGElement>;
        private prefixLabel: d3.Selection<SVGElement>;
        private postfixLabel: d3.Selection<SVGElement>;
        private categoryLabel: d3.Selection<SVGElement>;
        private categoryLabelGrp: d3.Selection<SVGElement>;
        private cardBackground: d3.Selection<SVGElement>;
        private host: IVisualHost;
        private tableData: DataView;

        constructor(options: VisualConstructorOptions) {
            this.host = options.host;
            this.target = options.element;
        }

        public update(options: VisualUpdateOptions) {

            this.settings = this.parseSettings(options.dataViews[0]);

            const tableData = options.dataViews[0].table;

            const dataLabelValue = tableData.rows[0][0];
            const dataLabelType = tableData.columns[0].type;
            const dataDisplayName = tableData.columns[0].displayName;
            const viewPortHeight: number = options.viewport.height;
            const viewPortWidth: number = options.viewport.width;

            this.prefixSettings = this.settings.prefixSettings;
            this.dataLabelSettings = this.settings.dataLabelSettings;
            this.postfixSettings = this.settings.postfixSettings;
            this.categoryLabelSettings = this.settings.categoryLabelSettings;
            this.backgroundSettings = this.settings.backgroundSettings;
            this.strokeSettings = this.settings.strokeSettings;
            this.conditionSettings = this.settings.conditionSettings;
            this.tooltipSettings = this.settings.tootlipSettings;

            let condtionValue: number;
            tableData.columns.forEach((element, index) => {
                if (element.roles.conditionMeasure == true) {
                    condtionValue = tableData.rows[0][index] as number;
                    return;
                } else {
                    condtionValue = dataLabelValue as number;
                }
            });

            // console.log(condtionValue);

            if (typeof document !== "undefined") {

                // adding parent element----------------------------------------------------------------------------------------------
                this.root = d3.select(".root").remove();

                this.root = d3.select(this.target)
                    .append("svg")
                    .classed("root", true)
                    .attr({
                        "width": viewPortWidth,
                        "height": viewPortHeight
                    });

                // adding background and stroke-----------------------------------------------------------------------------------------
                if (this.backgroundSettings.show == true || this.strokeSettings.show == true) {
                    const pathData = this.rounded_rect(
                        0, 0, viewPortWidth - 10, viewPortHeight - 10,
                        this.strokeSettings
                    );

                    this.cardBackground = this.root.append("path")
                        .attr("d", pathData)
                        .attr("transform", "translate(5, 5)");

                    if (this.backgroundSettings.show == true) {
                        this.cardBackground = this.cardBackground.attr({
                            "fill": this._getCardgrpColors(condtionValue, "B", this.conditionSettings) ||
                                    (this.backgroundSettings.backgroundColor as string || "none"),
                        });
                    } else {
                        this.cardBackground = this.cardBackground.attr({
                            "fill": "none",
                        });
                    }

                    if (this.strokeSettings.show == true) {
                        const strokeType = this.settings.strokeSettings.strokeType;
                        this.cardBackground = this.cardBackground.attr({
                            "stroke": this.strokeSettings.strokeColor as string || "none",
                            "stroke-width" : this.strokeSettings.strokeTickness
                        })
                        .style("stroke-dasharray", (d) => {
                            if (this.strokeSettings.strokeArray) {
                                return this.strokeSettings.strokeArray as string;
                            } else {
                                if (strokeType == "1") {
                                    return "8 , 4";
                                } else if (strokeType == "2") {
                                    return "2 , 4";
                                }
                            }
                        });
                    }
                }
                // end adding background and stroke-------------------------------------------------------------------------------------

                // adding parent element------------------------------------------------------------------------------------------------
                this.cardGrp = this.root.append("g")
                    .classed("cardGrp", true);

                this.contentGrp = this.cardGrp
                    .append("g")
                    .classed("contentGrp", true);
                // end adding parent element------------------------------------------------------------------------------------------

                // adding prefix-------------------------------------------------------------------------------------------------------
                if (this.prefixSettings.show == true) {
                    this.prefixLabel = this.contentGrp
                        .append("g")
                        .classed("prefixLabel", true)
                        .append("text")
                        .style({
                            "text-anchor": "start",
                            "font-size": this.prefixSettings.fontSize * 1.33333333333333,
                            "fill": this.conditionSettings.applyToPrefix == true ?
                                    this._getCardgrpColors(condtionValue, "F", this.conditionSettings) || this.prefixSettings.color :
                                    this.prefixSettings.color,
                            "font-family": this.prefixSettings.fontFamily,
                            "font-weight": this.prefixSettings.isBold == true ? "bold" : "normal",
                            "font-style": this.prefixSettings.isItalic == true ? "italic" : "normal"
                        })
                        .append("tspan")
                        .text(this.prefixSettings.text);
                } else {
                    d3.select(".prefixLabel").remove();
                    this.prefixLabel = this.contentGrp
                        .append("g")
                        .classed("prefixLabel", true);
                }
                // end adding prefix-----------------------------------------------------------------------------------------------------

                // adding data label--------------------------------------------------------------------------------------------------------
                let dataLabelValueFormatted;
                if (!dataLabelType.text) {
                    let formatValue = 1001;
                    switch (this.dataLabelSettings.displayUnit) {
                        case 0:
                            formatValue = 1001;
                            break;
                        case 1:
                            formatValue = 0;
                            break;
                        case 1000:
                            formatValue = 1001;
                            break;
                        case 1000000:
                            formatValue = 1e6;
                            break;
                        case 1000000000:
                            formatValue = 1e9;
                            break;
                        case 1000000000000:
                            formatValue = 1e12;
                            break;
                    }
                    const formatter = valueFormatter.create({
                        "value": formatValue,
                        "precision": this.dataLabelSettings.decimalPlaces,
                        "allowFormatBeautification": true
                    });
                    dataLabelValueFormatted = formatter.format(dataLabelValue);
                }

                const prefixWidth = this._getBoundingClientRect("prefixLabel", 0).width;
                const prefixSpacing = this.prefixSettings.spacing;
                const postfixSpacing = this.postfixSettings.spacing;
                const showPrefix = this.prefixSettings.show;
                this.dataLabel = this.contentGrp
                    .append("g")
                    .classed("dataLabel", true)
                    .attr("transform", (d, i) => {
                        if (showPrefix) {
                            return "translate(" + (prefixWidth + prefixSpacing) + ", 0)";
                        } else {
                            return "translate(0, 0)";
                        }
                    })
                    .append("text")
                    .style({
                        "text-anchor": "start",
                        "font-size": this.dataLabelSettings.fontSize * 1.33333333333333,
                        "fill": this.conditionSettings.applyToDataLabel == true ?
                                this._getCardgrpColors(condtionValue, "F", this.conditionSettings) || this.dataLabelSettings.color :
                                this.dataLabelSettings.color,
                        "font-family": this.dataLabelSettings.fontFamily,
                        "font-weight": this.dataLabelSettings.isBold == true ? "bold" : "normal",
                        "font-style": this.dataLabelSettings.isItalic == true ? "italic" : "normal"
                    })
                    .append("tspan")
                    .text(dataLabelType.text == true ? dataLabelValue as string : dataLabelValueFormatted as string);
                // end adding data label---------------------------------------------------------------------------------------------------

                // adding postfix-------------------------------------------------------------------------------------------------------
                const measureWidth = this._getBoundingClientRect("dataLabel", 0).width;
                if (this.postfixSettings.show == true) {
                    this.postfixLabel = this.contentGrp
                        .append("g")
                        .classed("postfixLabel", true)
                        .attr("transform", (d, i) => {
                            if (showPrefix) {
                                return "translate(" + (prefixWidth + prefixSpacing + measureWidth + postfixSpacing) + ", 0)";
                            } else {
                                return "translate(" + (prefixWidth + measureWidth + postfixSpacing) + ", 0)";
                            }
                        })
                        .append("text")
                        .style({
                            "text-anchor": "start",
                            "font-size": this.postfixSettings.fontSize * 1.33333333333333,
                            "fill": this.conditionSettings.applyToPostfix == true ?
                                    this._getCardgrpColors(condtionValue, "F", this.conditionSettings) || this.postfixSettings.color :
                                    this.postfixSettings.color,
                            "font-family": this.postfixSettings.fontFamily,
                            "font-weight": this.postfixSettings.isBold == true ? "bold" : "normal",
                            "font-style": this.postfixSettings.isItalic == true ? "italic" : "normal"
                        })
                        .append("tspan")
                        .text(this.postfixSettings.text);
                } else {
                    d3.select(".postfixLabel").remove();
                }
                // end adding postfix------------------------------------------------------------------------------------------------------

                // adding title to content-------------------------------------------------------------------------------------------------
                let title = "";
                title += this.prefixSettings.show == true ? this.prefixSettings.text + " " : "";
                title += dataLabelValue as string;
                title += this.postfixSettings.show == true ? " " + this.postfixSettings.text : "";
                this.contentGrp.append("title")
                    .text(title);
                // end adding title to content---------------------------------------------------------------------------------------------

                let contentGrpWidth;
                let contentGrpHeight;

                // adding category label---------------------------------------------------------------------------------------------------
                if (this.categoryLabelSettings.show == true) {
                    this.categoryLabelGrp = this.cardGrp.append("g")
                    .classed("categoryLabelGrp", true);

                    this.categoryLabel = this.categoryLabelGrp.append("g")
                        .classed("categoryLabel", true)
                        .append("text")
                        .style({
                            "text-anchor": "start",
                            "font-size": this.categoryLabelSettings.fontSize * 1.33333333333333,
                            "fill": this.conditionSettings.applyToCategoryLabel == true ?
                                    this._getCardgrpColors(condtionValue, "F", this.conditionSettings) || this.categoryLabelSettings.color :
                                    this.categoryLabelSettings.color,
                            "font-family": this.categoryLabelSettings.fontFamily,
                            "font-weight": this.categoryLabelSettings.isBold == true ? "bold" : "normal",
                            "font-style": this.categoryLabelSettings.isItalic == true ? "italic" : "normal"
                        })
                        .append("tspan")
                        .text(dataDisplayName);

                    contentGrpWidth = this._getBoundingClientRect("contentGrp", 0).width;
                    contentGrpHeight = this._getBoundingClientRect("contentGrp", 0).height;
                    const categoryLabelWidth = this._getBoundingClientRect("categoryLabel", 0).width;
                    const categoryLabelHeight = this._getBoundingClientRect("categoryLabel", 0).height;

                    this.categoryLabelGrp = this.categoryLabelGrp.attr("transform", (d, i) => {
                        return "translate(" + (contentGrpWidth / 2 - categoryLabelWidth / 2) + ","
                                + (categoryLabelHeight / 2 + contentGrpHeight / 2) + ")";
                    });

                    this.categoryLabel = this.categoryLabel.append("title")
                        .text(dataDisplayName ? dataDisplayName : "");
                } else {
                    this.categoryLabelGrp = d3.select(".categoryLabelGrp").remove();
                }
                // end adding category label------------------------------------------------------------------------------------------------

                contentGrpWidth = this._getBoundingClientRect("contentGrp", 0) == null ? 0 : this._getBoundingClientRect("contentGrp", 0).width;
                contentGrpHeight = this._getBoundingClientRect("contentGrp", 0) == null ? 0 : this._getBoundingClientRect("cardGrp", 0).height;
                const categoryLabelGrpHeight = this._getBoundingClientRect("categoryLabelGrp", 0) == null
                                            ? 0 : this._getBoundingClientRect("categoryLabelGrp", 0).height;
                this.cardGrp = this.cardGrp.attr("transform", "translate("
                    + (viewPortWidth / 2 - contentGrpWidth / 2)
                    + ","
                    + (viewPortHeight / 2 + contentGrpHeight / 4 - (categoryLabelGrpHeight / 2) * 1.25555555555555)
                    + ")");

                if (this.tooltipSettings.show == true) {

                    const tooltipDataItems = [];
                    if (this.tooltipSettings.title != null || this.tooltipSettings.content != null) {
                        tooltipDataItems.push({
                            "displayName": this.tooltipSettings.title,
                            "value": this.tooltipSettings.content
                        });
                    }

                    tableData.columns.forEach((element, index) => {
                        if (element.roles.tooltipMeasures == true) {
                            tooltipDataItems.push({
                                "displayName": tableData.columns[index].displayName,
                                "value": tableData.rows[0][index],
                            });
                        }
                    });

                    this.root.on("mousemove", (e) => {
                        const mouseX = d3.mouse(this.root.node())[0];
                        const mouseY = d3.mouse(this.root.node())[1];

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
                case "conditionSettings":
                    settings.push({
                        "objectName": options.objectName,
                        "properties": {
                            "show": this.conditionSettings.show,
                            "conditionNumbers": conditionNumbers > 10 ? 10 : conditionNumbers == 0 ? conditionNumbers = 1 : conditionNumbers,
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
                default:
                    break;
            }
            if (settings.length > 0) {
                return settings;
            } else {
                return (VisualSettings.enumerateObjectInstances(this.settings, options) as VisualObjectInstanceEnumerationObject);
            }
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

                const tli = this.strokeSettings.topLeftInward == true ? 0 : 1;
                const tri = this.strokeSettings.topRightInward  == true ? 0 : 1;
                const bli = this.strokeSettings.bottomLeftInward == true ? 0 : 1;
                const bri = this.strokeSettings.bottomRightInward  == true ? 0 : 1;

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

            private _getBoundingClientRect(className: string, index: number) {
                const elements = document.getElementsByClassName(className);
                if (elements.length != 0) {
                    return elements[index].getBoundingClientRect();
                } else {
                    return null;
                }
            }

            private parseSettings(dataView: DataView): VisualSettings {
                return VisualSettings.parse(dataView) as VisualSettings;
            }

            private _getCardgrpColors(originalValue: number, colorType: string, conditonSettings: ConditionSettings): string | null {
                if (conditonSettings.show == true) {
                    for (let conditionNumber = 1; conditionNumber <= conditonSettings.conditionNumbers; conditionNumber++) {
                        const compareValue =  conditonSettings["value" + conditionNumber];
                        if (compareValue != null) {
                            const condition = conditonSettings["condition" + conditionNumber];
                            let conditonResult;
                            switch (condition) {
                                case ">":
                                    conditonResult = originalValue > compareValue;
                                    break;
                                case ">=":
                                    conditonResult = originalValue >= compareValue;
                                    break;
                                case "=":
                                    conditonResult = originalValue == compareValue;
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
                            if (conditonResult == true) {
                                if (colorType == "F") {
                                    return conditonSettings["foregroundColor" + conditionNumber];
                                } else if (colorType == "B") {
                                    return conditonSettings["backgroundColor" + conditionNumber];
                                }
                                break;
                            }
                        }
                    }
                }
                return null;
            }
    }
}
