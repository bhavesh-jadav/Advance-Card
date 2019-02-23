/**
 *
 * Analyze and prepare data for Advance Card
 *
 */

"use strict";

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
import ValueTypeDescriptor = powerbi.ValueTypeDescriptor;
import ValueFormatter = valueFormatter.valueFormatter;
import TextMeasurementService = textMeasurementService.textMeasurementService;
import TextProperties = textMeasurementService.TextProperties;
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

    constructor (private tableData: powerbi.DataViewTable, private settings: AdvanceCardVisualSettings, private culture: string) {
        this._createAdvanceCardData();
    }

    private _createAdvanceCardData() {
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
                        "value": this.tableData.rows[0][index] as number,
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
                    this.prefixData = {
                        "hasValue": true,
                        "value": this.tableData.rows[0][index],
                        "type": column.type,
                        "format": column.format,
                    };
                } else if (
                    this.prefixData.hasValue !== true &&
                    !StringExtensions.isNullOrUndefinedOrWhiteSpaceString(this.settings.postfixSettings.text)
                ) {
                    this.prefixData = {
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

    public GetDataLabelValue() {
        let dataLabelValueFormatted: string;
        if (this.mainData.hasValue) {
            if (this.mainData.type.numeric || this.mainData.type.integer) {
                dataLabelValueFormatted = this._format(this.mainData.value as number,
                {
                    "format": this.mainData.format,
                    "value": (
                        this.settings.dataLabelSettings.displayUnit === 0 ?
                        this.mainData.value as number :
                        this.settings.dataLabelSettings.displayUnit
                    ),
                    "precision": this.settings.dataLabelSettings.decimalPlaces,
                    "allowFormatBeautification": false,
                    "formatSingleValues": this.settings.dataLabelSettings.displayUnit === 0,
                    "displayUnitSystemType": DisplayUnitSystemType.DataLabels,
                    "cultureSelector": this.culture
                });
            } else {
                dataLabelValueFormatted = this._format(
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

    public GetDataLabelDisplayName() {
        if (this.mainData.hasValue) {
            return this.mainData.displayName;
        }
    }

    public GetPrefixLabelValue() {
        // TODO Format Prefix data
        return this.prefixData.value;
    }

    public GetPostfixLabelValue() {
        // TODO Format Postfix data
        return this.postfixData.value;
    }

    public GetConditionValue() {
        if (this.conditionData.hasValue) {
            return this.conditionData.value;
        } else if (this.mainData.hasValue && (this.mainData.type.integer || this.mainData.type.numeric)) {
            return this.mainData.value;
        } else {
            return undefined;
        }
    }

    public GetTooltipData() {
        if (this.tooltipData.hasValue) {
            let tooltipDataItems: powerbi.extensibility.VisualTooltipDataItem[] = [];

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
                const displayUnit = this._getPropertyValue<number>(column.objects, "tootlipSettings", "measureFormat", 0);
                const precision = this._getPropertyValue<number>(column.objects, "tootlipSettings", "measurePrecision", 0);
                const value = this.tooltipData.values[index].value;
                const valueType = this.tooltipData.values[index].type;
                let valueFormatted = "";

                if (valueType.numeric || valueType.integer) {
                    valueFormatted = this._format(
                        value as number,
                        {
                            "format": this.tooltipData.values[index].format,
                            "value": displayUnit === 0 ? value as number : displayUnit,
                            "precision": precision,
                            "allowFormatBeautification": false,
                            "formatSingleValues": displayUnit === 0,
                            "displayUnitSystemType": DisplayUnitSystemType.DataLabels,
                            "cultureSelector": this.culture
                        });
                } else {
                    valueFormatted = this._format(
                        valueType.dateTime ? new Date(value as string) : value,
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

    private _format(data, properties: valueFormatter.ValueFormatterOptions) {
        const formatter = ValueFormatter.create(properties);
        return formatter.format(data);
    }

    private _getPropertyValue<T>(objects: powerbi.DataViewObjects, objectName: string, propertyName: string, defaultValue: T): T {
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
    columnMetadata: powerbi.DataViewMetadataColumn[];
}

