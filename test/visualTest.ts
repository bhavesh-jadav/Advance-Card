import powerbi from "powerbi-visuals-api";
import { OnlyDataLabelData, OnlyPrefixLabelData, OnlyPostfixLabelData, AllData } from "./visualData";
import { AdvanceCardBuilder } from "./visualBuilder";
import { AdvanceCardVisualSettings } from "../src/settings";
import { valueType } from "powerbi-visuals-utils-typeutils";
import { GetCeiledXYFromTranslate } from "./testUtils";

import ValueType = valueType.ValueType;
import ExtendedType = valueType.ExtendedType;

describe("Advance card", () => {

    let defaultVisualSettings: AdvanceCardVisualSettings;
    beforeEach(() => {
        defaultVisualSettings = new AdvanceCardVisualSettings();
    });

    // Make sure all the elements exists in DOM with default properties
    describe("DOM Elements", () => {
        let allDataViewBuilder = new AllData();
        let visualBuilder: AdvanceCardBuilder;
        let dataView: powerbi.DataView;
        beforeEach(() => {
            visualBuilder = new AdvanceCardBuilder(500, 500);
            dataView = allDataViewBuilder.getDataView();
        });

        it("root SVG element is created", () => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.rootSVGElement.node()).toBeInDOM();
            });
        });

        it("data label element is created", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.dataLabel.node()).toBeInDOM();
                done();
            });
        });

        it("category label element is created", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.categoryLabel.node()).toBeInDOM();
                done();
            });
        });

        it("prefix label element is created", (done) => {
            dataView.metadata.objects = {
                prefixSettings: {
                    show: true
                }
            };
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.prefixLabel.node()).toBeInDOM();
                done();
            });
        });

        it("postfix label element is created", (done) => {
            dataView.metadata.objects = {
                postfixSettings: {
                    show: true
                }
            };
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.postfixLabel.node()).toBeInDOM();
                done();
            });
        });
    });

    // data label only test
    describe("Data label", () => {
        let dataLabelDataViewBuilder = new OnlyDataLabelData();
        let visualBuilder: AdvanceCardBuilder;
        let dataView: powerbi.DataView;
        beforeEach(() => {
            visualBuilder = new AdvanceCardBuilder(310, 200);
            dataLabelDataViewBuilder.SetValue("01-01-2018 03:00:00 +05:30");
            dataLabelDataViewBuilder.SetType(ValueType.fromDescriptor({extendedType: ExtendedType.DateTime}));
            dataLabelDataViewBuilder.SetFormat("G");
            dataView = dataLabelDataViewBuilder.getDataView();
            dataView.metadata.objects = {};
        });

        // Testing correct position of data label in DOM
        describe("translate y", () => {
            it("is correct with category label", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    let xy = GetCeiledXYFromTranslate(visualBuilder.dataLabel.attr("transform"));
                    expect(xy.x).toEqual(155);
                    expect(xy.y).toEqual(101);
                    done();
                });
            });

            it("is correct without category label", (done) => {
                dataView.metadata.objects["categoryLabelSettings"] = {
                    show: false
                };
                visualBuilder.updateRenderTimeout(dataView, () => {
                    let xy = GetCeiledXYFromTranslate(visualBuilder.dataLabel.attr("transform"));
                    expect(xy.x).toEqual(155);
                    expect(xy.y).toEqual(112);
                    done();
                });
            });
        });

        describe("translate x", () => {
            let alignments = ["center", "left", "right"];
            let alignmentSpacings = [0, 10, -10];
            let baseX = [155, 0, 310];
            let baseY = 101;

            alignments.forEach((alignment, i) => {
                alignmentSpacings.forEach(alignmentSpacing => {
                    it("is correct with " + alignment + " with alignment spacing of " + alignmentSpacing, (done) => {
                        dataView.metadata.objects["general"] = {
                            alignment: alignment,
                            alignmentSpacing: alignmentSpacing
                        };
                        visualBuilder.updateRenderTimeout(dataView, () => {
                            let xy = GetCeiledXYFromTranslate(visualBuilder.dataLabel.attr("transform"));
                            if (alignment === "right") {
                                expect(xy.x).toEqual(baseX[i] - alignmentSpacing);
                            } else {
                                expect(xy.x).toEqual(baseX[i] + alignmentSpacing);
                            }
                            expect(xy.y).toEqual(baseY);
                            done();
                        });
                    });
                });
            });
        });
    });

    // only prefix label test
    describe("Prefix label", () => {
        let prefixLabelDataViewBuilder = new OnlyPrefixLabelData();
        let visualBuilder: AdvanceCardBuilder;
        let prefixDataView: powerbi.DataView;
        beforeEach(() => {
            visualBuilder = new AdvanceCardBuilder(310, 200);
            prefixDataView = prefixLabelDataViewBuilder.getDataView();
            prefixDataView.metadata.objects = {};
            prefixDataView.metadata.objects["prefixSettings"] = {
                show: true
            };
        });

        // Testing correct position of prefix label in DOM
        describe("translate xy", () => {
            let alignments = ["center", "left", "right"];
            let alignmentSpacings = [0, 10, -10];
            let baseX = [127, 0, 306];
            let baseY = 100;

            alignments.forEach((alignment, i) => {
                alignmentSpacings.forEach(alignmentSpacing => {
                    it("is correct with " + alignment + " with alignment spacing of " + alignmentSpacing, (done) => {
                        prefixDataView.metadata.objects["general"] = {
                            alignment: alignment,
                            alignmentSpacing: alignmentSpacing
                        };
                        visualBuilder.updateRenderTimeout(prefixDataView, () => {
                            let xy = GetCeiledXYFromTranslate(visualBuilder.prefixLabel.attr("transform"));
                            if (alignment === "right") {
                                expect(xy.x).toEqual(baseX[i] - alignmentSpacing);
                            } else {
                                expect(xy.x).toEqual(baseX[i] + alignmentSpacing);
                            }
                            expect(xy.y).toEqual(baseY);
                            done();
                        });
                    });
                });
            });
        });
    });

    // only postfix label test
    describe("Postfix label", () => {
        let postfixLabelDataViewBuilder = new OnlyPostfixLabelData();
        let visualBuilder: AdvanceCardBuilder;
        let postfixDataView: powerbi.DataView;
        beforeEach(() => {
            visualBuilder = new AdvanceCardBuilder(310, 200);
            postfixDataView = postfixLabelDataViewBuilder.getDataView();
            postfixDataView.metadata.objects = {};
            postfixDataView.metadata.objects["postfixSettings"] = {
                show: true
            };
        });

        // Testing correct position of postfix label in DOM
        describe("translate xy", () => {
            let alignments = ["center", "left", "right"];
            let alignmentSpacings = [0, 10, -10];
            let baseX = [102, 4, 310];
            let baseY = 100;

            alignments.forEach((alignment, i) => {
                alignmentSpacings.forEach(alignmentSpacing => {
                    it("is correct with " + alignment + " with alignment spacing of " + alignmentSpacing, (done) => {
                        postfixDataView.metadata.objects["general"] = {
                            alignment: alignment,
                            alignmentSpacing: alignmentSpacing
                        };
                        visualBuilder.updateRenderTimeout(postfixDataView, () => {
                            let xy = GetCeiledXYFromTranslate(visualBuilder.postfixLabel.attr("transform"));
                            if (alignment === "right") {
                                expect(xy.x).toEqual(baseX[i] - alignmentSpacing);
                            } else {
                                expect(xy.x).toEqual(baseX[i] + alignmentSpacing);
                            }
                            expect(xy.y).toEqual(baseY);
                            done();
                        });
                    });
                });
            });
        });
    });
});