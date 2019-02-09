import powerbi from "powerbi-visuals-api";
import VisualConstructorOptions = powerbi.extensibility.visual.VisualConstructorOptions;
// powerbi.extensibility.utils.test
import { VisualBuilderBase } from "powerbi-visuals-utils-testutils";
import { AdvanceCardVisual } from './../src/visual';

export class AdvanceCardBuilder extends VisualBuilderBase<AdvanceCardVisual> {

    constructor(width: number, height: number) {
        super(width, height, "advanceCardE03760C5AB684758B56AA29F9E6C257B");
    }

    protected build(options: VisualConstructorOptions): AdvanceCardVisual {
        return new AdvanceCardVisual(options)
    }

    public get mainElement() {
        return this.element.find("svg.root");
    }

    public get dataLabel() {
        return this.mainElement.find("tspan.dataLabel");
    }

    public get categoryLabel() {
        return this.mainElement.find(".categoryLabel");
    }

    public get prefixLabel() {
        return this.mainElement.find("tspan.prefixLabel");
    }

    public get postfixLabel() {
        return this.mainElement.find("tspan.postfixLabel");
    }
}