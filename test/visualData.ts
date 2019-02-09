import powerbi from "powerbi-visuals-api";
import { testDataViewBuilder } from "powerbi-visuals-utils-testutils";
// powerbi.extensibility.utils.test
import TestDataViewBuilder = testDataViewBuilder.TestDataViewBuilder;
import { DataViewBuilderValuesColumnOptions } from "powerbi-visuals-utils-testutils/lib/dataViewBuilder/dataViewBuilder";
import { valueType } from "powerbi-visuals-utils-typeutils";
import ValueType = valueType.ValueType;
import ExtendedType = valueType.ExtendedType

export class AdvanceCardData extends TestDataViewBuilder {

    public columnNames: string[];
    public columnValues: any[][];
    public columnRoles: string[];
    public columnTypes: ValueType[];
    public columnFormat: any[];

    // name, value, role, type, format
    public tableData = [[], [], [], [], []]

    getDataView(columnNames?: string[]): powerbi.DataView {
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

        const dataView: powerbi.DataView = {
            table: {
                columns: columns,
                rows: rows
            },
            metadata: {
                columns: columns
            }
        }
        return dataView;
    }
}

export class AdvanceCardData1 extends AdvanceCardData {
    public columnNames: string[] = ["DataLabelValue"];
    public columnValues: any[][] = [["Hello"]];
    public columnRoles: string[] = ["mainMeasure"]
    public columnTypes: ValueType[] = [
        ValueType.fromDescriptor({extendedType: ExtendedType.Text})
    ]
    public columnFormat: any[] = [undefined]
}