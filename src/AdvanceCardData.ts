/**
 *
 * Analyze and prepare data for Advance Card
 *
 */

"use strict";

import powerbiVisualsApi from "powerbi-visuals-api";
import { displayUnitSystemType, stringExtensions as StringExtensions, valueFormatter } from "powerbi-visuals-utils-formattingutils";
import { valueType } from "powerbi-visuals-utils-typeutils";
import { AdvanceCardVisualSettings } from "./settings";

import ValueType = valueType.ValueType;
import ExtendedType = valueType.ExtendedType;
import ValueTypeDescriptor = powerbiVisualsApi.ValueTypeDescriptor;
import ValueFormatter = valueFormatter;
import DisplayUnitSystemType = displayUnitSystemType.DisplayUnitSystemType;

export class AdvanceCardData {

    private mainData: ISingleValueData = {
        "hasValue": false,
        "value": undefined,
        "type": undefined,
    };
    private prefixData: ISingleValueData = {
        "hasValue": false,
        "value": undefined,
        "type": undefined,
    };
    private postfixData: ISingleValueData = {
        "hasValue": false,
        "value": undefined,
        "type": undefined,
    };
    private conditionData: ISingleValueData = {
        "hasValue": false,
        "value": undefined,
        "type": undefined,
    };
    private tooltipData: ITooltipData = {
        "hasValue": false,
        "values": [],
        "columnMetadata": [],
    };

    constructor (private tableData: powerbiVisualsApi.DataViewTable, private settings: AdvanceCardVisualSettings, private culture: string) {
        this.createAdvanceCardData();
    }

    private createAdvanceCardData() {
        try {
            this.tableData.columns.forEach((column, index) => {
                if (column.roles.mainMeasure !== undefined) {
                    this.mainData = {
                        "hasValue": true,
                        "value": this.tableData.rows[0][index],
                        "displayName": column.displayName,
                        "type": column.type,
                        "format": column.format,
                    };
                }

                if (column.roles.conditionMeasure === true) {
                    this.conditionData = {
                        "hasValue": true,
                        "value": <number>this.tableData.rows[0][index],
                        "type": column.type,
                    };

                }

                if (column.roles.prefixMeasure) {
                    this.prefixData = {
                        "hasValue": true,
                        "value": this.tableData.rows[0][index],
                        "type": column.type,
                        "format": column.format,
                    };

                } else if (
                    this.prefixData.hasValue !== true &&
                    !StringExtensions.isNullOrUndefinedOrWhiteSpaceString(this.settings.prefixSettings.text)
                ) {
                    this.prefixData = {
                        "hasValue": true,
                        "value": this.settings.prefixSettings.text,
                        "type": ValueType.fromDescriptor({extendedType: ExtendedType.Text}),
                        "format": "",
                    };
                }

                if (column.roles.postfixMeasure) {
                    this.postfixData = {
                        "hasValue": true,
                        "value": this.tableData.rows[0][index],
                        "type": column.type,
                        "format": column.format,
                    };
                } else if (
                    this.postfixData.hasValue !== true &&
                    !StringExtensions.isNullOrUndefinedOrWhiteSpaceString(this.settings.postfixSettings.text)
                ) {
                    this.postfixData = {
                        "hasValue": true,
                        "value": this.settings.postfixSettings.text,
                        "type": ValueType.fromDescriptor({extendedType: ExtendedType.Text}),
                        "format": "",
                    };
                }

                if (column.roles.tooltipMeasures) {
                    this.tooltipData.hasValue = true;
                    this.tooltipData.values.push({
                        "hasValue": true,
                        "value": this.tableData.rows[0][index],
                        "type": column.type,
                        "displayName": column.displayName,
                        "format": column.format,
                    });
                    this.tooltipData.columnMetadata.push(column);
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    public getDataLabelValue() {
        let dataLabelValueFormatted: string;
        if (this.mainData.hasValue) {
            if (this.mainData.type.numeric || this.mainData.type.integer) {
                dataLabelValueFormatted = this.formatLabel(<number>this.mainData.value,
                {
                    "format": this.mainData.format,
                    "value": (
                        this.settings.dataLabelSettings.displayUnit === 0 ?
                        <number>this.mainData.value :
                        this.settings.dataLabelSettings.displayUnit
                    ),
                    "precision": this.settings.dataLabelSettings.decimalPlaces,
                    "allowFormatBeautification": false,
                    "formatSingleValues": this.settings.dataLabelSettings.displayUnit === 0,
                    "displayUnitSystemType": DisplayUnitSystemType.DataLabels,
                    "cultureSelector": this.culture
                });
            } else {
                dataLabelValueFormatted = this.formatLabel(
                this.mainData.type.dateTime && this.mainData.value ? new Date(this.mainData.value) : this.mainData.value,
                    {
                        "format": this.mainData.format,
                        "cultureSelector": this.culture
                    }
                );
            }
            return dataLabelValueFormatted;
        } else {
            return this.mainData.value;
        }
    }

    public getDataLabelDisplayName() {
        if (this.mainData.hasValue) {
            return this.mainData.displayName;
        }
    }

    public getPrefixLabelValue() {
        // TO DO Format Prefix data
        return this.prefixData.value;
    }

    public getPostfixLabelValue() {
        // TO DO Format Postfix data
        return this.postfixData.value;
    }

    public getConditionValue() {
        if (this.conditionData.hasValue) {
            return this.conditionData.value;
        } else if (this.mainData.hasValue && (this.mainData.type.integer || this.mainData.type.numeric)) {
            return this.mainData.value;
        } else {
            return undefined;
        }
    }

    public getTooltipData() {
        if (this.tooltipData.hasValue) {
            let tooltipDataItems: powerbiVisualsApi.extensibility.VisualTooltipDataItem[] = [];

            if (
                !StringExtensions.isNullOrUndefinedOrWhiteSpaceString(this.settings.tootlipSettings.title) ||
                !StringExtensions.isNullOrUndefinedOrWhiteSpaceString(this.settings.tootlipSettings.content)
            ) {
                tooltipDataItems.push({
                    "displayName": this.settings.tootlipSettings.title,
                    "value": this.settings.tootlipSettings.content
                });
            }

            this.tooltipData.columnMetadata.forEach((column, index) => {
                const displayUnit = this.getPropertyValue<number>(column.objects, "tootlipSettings", "measureFormat", 0);
                const precision = this.getPropertyValue<number>(column.objects, "tootlipSettings", "measurePrecision", 0);
                const value = this.tooltipData.values[index].value;
                const valueType = this.tooltipData.values[index].type;
                let valueFormatted = "";

                if (valueType.numeric || valueType.integer) {
                    valueFormatted = this.formatLabel(
                        <number>value,
                        {
                            "format": this.tooltipData.values[index].format,
                            "value": displayUnit === 0 ? value : displayUnit,
                            "precision": precision,
                            "allowFormatBeautification": false,
                            "formatSingleValues": displayUnit === 0,
                            "displayUnitSystemType": DisplayUnitSystemType.DataLabels,
                            "cultureSelector": this.culture
                        });
                } else {
                    valueFormatted = this.formatLabel(
                        valueType.dateTime ? new Date(<string>value) : value,
                        {
                            "format": this.tooltipData.values[index].format,
                            "cultureSelector": this.culture
                        }
                    );
                }
                tooltipDataItems.push({
                    "displayName": this.tooltipData.values[index].displayName,
                    "value": valueFormatted
                });
            });
            return tooltipDataItems;
        } else {
            return undefined;
        }
    }

    public getQueryNameForTooltip() {
        return this.tableData.columns[0].queryName;
    }

    private formatLabel(data, properties: valueFormatter.ValueFormatterOptions) {
        const formatter = ValueFormatter.create(properties);
        return formatter.format(data);
    }

    private getPropertyValue<T>(objects: powerbiVisualsApi.DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
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
}

interface ISingleValueData {
    hasValue: boolean;
    value: any;
    type: ValueTypeDescriptor;
    displayName?: string;
    format?: string;
}

interface ITooltipData {
    hasValue: boolean;
    values: ISingleValueData[];
    columnMetadata: powerbiVisualsApi.DataViewMetadataColumn[];
}

