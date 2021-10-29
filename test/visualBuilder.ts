import powerbiVisualsApi from "powerbi-visuals-api";
import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";

import { AdvanceCardClassNames, AdvanceCardIdNames } from "../src/AdvanceCard";
import { getClassSelector, getIDSelector } from "../src/AdvanceCardUtils";
import { visual } from "./../src/visual";
import { select } from "d3-selection";

import VisualConstructorOptions = powerbiVisualsApi.extensibility.visual.VisualConstructorOptions;
export class visualBuilder extends VisualBuilderBase<visual> {

    constructor(width: number, height: number) {
        super(width, height, "advanceCardWithLocaleE03760C5AB684758B56AA29F9E6C257B");
    }

    protected build(options: VisualConstructorOptions): visual {
        return new visual(options);
    }

    public get rootSVGElement() {
        // return this.element.find(getClassSelector(AdvanceCardClassNames.RootSVGClass, "svg"));
        return select(getClassSelector(AdvanceCardClassNames.RootSVGClass, "svg"));
    }

    public get dataLabel() {
        return this.rootSVGElement.select(getClassSelector(AdvanceCardClassNames.DataLabelClass, "g"));
    }

    public get categoryLabel() {
        return this.rootSVGElement.select(getClassSelector(AdvanceCardClassNames.CategoryLabelClass, "g"));
    }

    public get prefixLabel() {
        return this.rootSVGElement.select(getClassSelector(AdvanceCardClassNames.PrefixLabelClass, "g"));
    }

    public get postfixLabel() {
        return this.rootSVGElement.select(getClassSelector(AdvanceCardClassNames.PostfixLabelClass, "g"));
    }

    public get stroke() {
        return this.rootSVGElement.select(getIDSelector(AdvanceCardIdNames.StrokePathId, "path"));
    }

    public get fill() {
        return this.rootSVGElement.select(getClassSelector(AdvanceCardClassNames.FillClass, "g"));
    }
}