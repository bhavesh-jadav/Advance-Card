import powerbiVisualsApi from "powerbi-visuals-api";
import { testDataViewBuilder } from "powerbi-visuals-utils-testutils";
import { valueType } from "powerbi-visuals-utils-typeutils";
import { AdvanceCardData } from "../src/AdvanceCardData";

import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;
import ValueType = valueType.ValueType;
import ExtendedType = valueType.ExtendedType;

class AdvanceCardDataView extends TestDataViewBuilder {

    public columnNames: string[];
    public columnValues: any[][];
    public columnRoles: string[];
    public columnTypes: ValueType[];
    public columnFormat: any[];

    getDataView(columnNames?: string[]): powerbiVisualsApi.DataView {
        const columns = this.columnNames.map((field, index) => {
            return {
                displayName: field,
                roles: { [this.columnRoles[index]] : true },
                type: this.columnTypes[index],
                format: this.columnFormat[index],
                index: index,
                identityExprs: undefined
            };
        });

        const rows = this.columnValues.map((row: any[]) => {
            return row;
        });

        return {
            table: {
                columns: columns,
                rows: rows
            },
            metadata: {
                columns: columns
            }
        };
    }
}

class OnlySingleData extends AdvanceCardDataView {
    public setValue(value: any) {
        this.columnValues[0][0] = value;
    }

    public setType(type: ValueType) {
        this.columnTypes[0] = type;
    }

    public setFormat(format: string) {
        this.columnFormat[0] = format;
    }
}

export class OnlyDataLabelData extends OnlySingleData {
    public columnNames: string[] = ["DataLabelValue"];
    public columnValues: any[][] = [["Hello"]];
    public columnRoles: string[] = ["mainMeasure"];
    public columnTypes: ValueType[] = [
        ValueType.fromDescriptor({extendedType: ExtendedType.Text})
    ];
    public columnFormat: any[] = [undefined];
}

export class OnlyPrefixLabelData extends OnlySingleData {
    public columnNames: string[] = ["PrefixLabelValue"];
    public columnValues: any[][] = [["Prefix"]];
    public columnRoles: string[] = ["prefixMeasure"];
    public columnTypes: ValueType[] = [
        ValueType.fromDescriptor({extendedType: ExtendedType.Text})
    ];
    public columnFormat: any[] = [undefined];
}

export class OnlyPostfixLabelData extends OnlySingleData {
    public columnNames: string[] = ["PostfixLabelValue"];
    public columnValues: any[][] = [["Postfix Data"]];
    public columnRoles: string[] = ["postfixMeasure"];
    public columnTypes: ValueType[] = [
        ValueType.fromDescriptor({extendedType: ExtendedType.Text})
    ];
    public columnFormat: any[] = [undefined];
}

export class OnlyConditionData extends OnlySingleData {
    public columnNames: string[] = ["ConditionValue"];
    public columnValues: any[][] = [[3]];
    public columnRoles: string[] = ["conditionMeasure"];
    public columnTypes: ValueType[] = [
        ValueType.fromDescriptor({extendedType: ExtendedType.Numeric})
    ];
    public columnFormat: any[] = [undefined];
}


export class AllData extends AdvanceCardDataView {
    public columnNames: string[] = ["DataLabelValue", "TooltipValue", "ConditionValue", "PrefixValue", "PostfixValue"];
    public columnValues: any[][] = [["Hello", "Some random text", 0.2, "Greetings", "There"]];
    public columnRoles: string[] = ["mainMeasure", "tooltipMeasures", "conditionMeasure", "prefixMeasure", "postfixMeasure"];
    public columnTypes: ValueType[] = [
        ValueType.fromDescriptor({extendedType: ExtendedType.Text}),
        ValueType.fromDescriptor({extendedType: ExtendedType.Text}),
        ValueType.fromDescriptor({extendedType: ExtendedType.Decimal}),
        ValueType.fromDescriptor({extendedType: ExtendedType.Text}),
        ValueType.fromDescriptor({extendedType: ExtendedType.Text}),
    ];
    public columnFormat: any[] = [undefined, undefined, undefined, undefined, undefined];
}