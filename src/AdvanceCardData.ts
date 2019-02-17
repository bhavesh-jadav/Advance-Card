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
import ValueTypeDescriptor = powerbi.ValueTypeDescriptor;
import ValueFormatter = valueFormatter.valueFormatter;
import TextMeasurementService = textMeasurementService.textMeasurementService;
import TextProperties = textMeasurementService.TextProperties;
import DisplayUnitSystemType = displayUnitSystemType.DisplayUnitSystemType;

export class AdvanceCardData {

    private mainData: SingleValueData = {
        "hasValue": false,
        "value": undefined,
        "type": undefined,
    };
    private prefixData: SingleValueData = {
        "hasValue": false,
        "value": undefined,
        "type": undefined,
    };
    private postfixData: SingleValueData = {
        "hasValue": false,
        "value": undefined,
        "type": undefined,
    };
    private conditionData: SingleValueData = {
        "hasValue": false,
        "value": undefined,
        "type": undefined,
    };
    private tooltipData: TooltipData = {
        "hasValue": false,
        "values": [],
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

                if (
                    column.roles.conditionMeasure === true &&
                    (column.type.numeric === true || column.type.integer === true)
                ) {
                    this.conditionData = {
                        "hasValue": true,
                        "value": this.tableData.rows[0][index] as number,
                        "type": column.type,
                    };

                } else if (this.mainData.hasValue !== true) {
                    this.conditionData.value = this.mainData.value as number;
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

                // TODO: Format numbers and then show
                if (column.roles.tooltipMeasures) {
                    this.tooltipData.hasValue = true;
                    this.tooltipData.values.push({
                        "displayName": column.displayName,
                        "value": this.tableData.rows[0][index] as string,
                    });
                }
            });
        } catch (error) {
            console.log(error);
        }
    }

    public GetDataLabelValue() {
        let dataLabelValueFormatted;
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
            return undefined;
        }
    }

    private _format(data, properties: valueFormatter.ValueFormatterOptions) {
        const formatter = ValueFormatter.create(properties);
        return formatter.format(data);
    }
}

interface SingleValueData {
    hasValue: boolean;
    value: any;
    type: ValueTypeDescriptor;
    displayName?: string;
    format?: string;
}

interface TooltipData {
    hasValue: boolean;
    values: powerbi.extensibility.VisualTooltipDataItem[];
}