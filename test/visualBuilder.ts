import powerbi from "powerbi-visuals-api";
import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";

import { AdvanceCardClassNames } from "../src/AdvanceCard";
import { GetClassSelector } from "../src/AdvanceCardUtils";
import { AdvanceCardVisual } from "./../src/visual";
import { select } from "d3-selection";

import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
export class AdvanceCardBuilder extends VisualBuilderBase<AdvanceCardVisual> {

    constructor(width: number, height: number) {
        super(width, height, "advanceCardE03760C5AB684758B56AA29F9E6C257B");
    }

    protected build(options: VisualConstructorOptions): AdvanceCardVisual {
        return new AdvanceCardVisual(options);
    }

    public get rootSVGElement() {
        // return this.element.find(GetClassSelector(AdvanceCardClassNames.RootSVGClass, "svg"));
        return select(GetClassSelector(AdvanceCardClassNames.RootSVGClass, "svg"));
    }

    public get dataLabel() {
        return this.rootSVGElement.select(GetClassSelector(AdvanceCardClassNames.DataLabelClass, "g"));
    }

    // public get categoryLabel() {
    //     return this.rootSVGElement.find(GetClassSelector(AdvanceCardClassNames.CategoryLabelClass, "g"));
    // }

    // public get prefixLabel() {
    //     return this.rootSVGElement.find(GetClassSelector(AdvanceCardClassNames.PrefixLabelClass, "g"));
    // }

    // public get postfixLabel() {
    //     return this.rootSVGElement.find(GetClassSelector(AdvanceCardClassNames.PostfixLabelClass, "g"));
    // }
}