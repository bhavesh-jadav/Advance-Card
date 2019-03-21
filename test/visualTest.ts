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
    let defaultVisualBuilder: AdvanceCardBuilder;
    let defaultDataView: powerbi.DataView;
    beforeEach(() => {
        defaultVisualSettings = new AdvanceCardVisualSettings();
        defaultVisualBuilder = new AdvanceCardBuilder(310, 200);
        defaultDataView = new AllData().getDataView();
        defaultDataView.metadata.objects = {};
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

    // only data label test
    describe("Data label", () => {
        let dataLabelDataViewBuilder = new OnlyDataLabelData();
        let visualBuilder: AdvanceCardBuilder;
        let dataView: powerbi.DataView;
        beforeEach(() => {
            visualBuilder = new AdvanceCardBuilder(310, 200);
            dataLabelDataViewBuilder.SetValue("01-01-2018 03:00:00 +05:30");
            dataLabelDataViewBuilder.SetType(ValueType.fromDescriptor({extendedType: ExtendedType.DateTimeZone}));
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

    describe("Stroke", () => {
        it("Is correct with default settings", (done) => {
            defaultDataView.metadata.objects["strokeSettings"] = {
                show: true
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let stroke = defaultVisualBuilder.stroke;
                expect(stroke.attr("d")).toEqual("M16,1h275h15v15v165v15h-15h-275h-15v-15v-165v-15h15z");
                done();
            });
        });

        it("Is correct when all corners are rounded", (done) => {
            defaultDataView.metadata.objects["strokeSettings"] = {
                show: true,
                topLeft: true,
                topRight: true,
                bottomLeft: true,
                bottomRight: true
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let stroke = defaultVisualBuilder.stroke;
                expect(stroke.attr("d")).toEqual("M16,1h275a15,15 0 0 1 15,15v165a15,15 0 0 1 -15,15h-275a15,15 0 0 1 -15,-15v-165a15,15 0 0 1 15,-15z");
                done();
            });
        });

        it("Is correct when all corners are rounded and radius is 18", (done) => {
            defaultDataView.metadata.objects["strokeSettings"] = {
                show: true,
                topLeft: true,
                topRight: true,
                bottomLeft: true,
                bottomRight: true,
                cornerRadius: 18
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let stroke = defaultVisualBuilder.stroke;
                expect(stroke.attr("d")).toEqual("M19,1h269a18,18 0 0 1 18,18v159a18,18 0 0 1 -18,18h-269a18,18 0 0 1 -18,-18v-159a18,18 0 0 1 18,-18z");
                done();
            });
        });

        it("Is correct when all corners are rounded inward", (done) => {
            defaultDataView.metadata.objects["strokeSettings"] = {
                show: true,
                topLeft: true,
                topRight: true,
                bottomLeft: true,
                bottomRight: true,
                topLeftInward: true,
                topRightInward: true,
                bottomLeftInward: true,
                bottomRightInward: true,
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let stroke = defaultVisualBuilder.stroke;
                expect(stroke.attr("d")).toEqual("M16,1h275a15,15 0 0 0 15,15v165a15,15 0 0 0 -15,15h-275a15,15 0 0 0 -15,-15v-165a15,15 0 0 0 15,-15z");
                done();
            });
        });

        it("Color is correctly applied", (done) => {
            defaultDataView.metadata.objects["strokeSettings"] = {
                show: true,
                strokeColor: "#f2c80f"
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let stroke = defaultVisualBuilder.stroke;
                expect(stroke.attr("stroke")).toEqual("#f2c80f");
                done();
            });
        });

        it("Width is correctly applied", (done) => {
            defaultDataView.metadata.objects["strokeSettings"] = {
                show: true,
                strokeWidth: 5
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let stroke = defaultVisualBuilder.stroke;
                expect(stroke.attr("d")).toEqual("M17.5,2.5h272h15v15v162v15h-15h-272h-15v-15v-162v-15h15z");
                done();
            });
        });

        it("Type is correctly applied", (done) => {
            defaultDataView.metadata.objects["strokeSettings"] = {
                show: true,
                strokeType: "1"
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let stroke = defaultVisualBuilder.stroke;
                expect(stroke.style("stroke-dasharray")).toEqual("6, 0.6");
                done();
            });
        });

        it("Array is correctly applied", (done) => {
            defaultDataView.metadata.objects["strokeSettings"] = {
                show: true,
                strokeArray: "10, 5, 10"
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let stroke = defaultVisualBuilder.stroke;
                expect(stroke.style("stroke-dasharray")).toEqual("10, 5, 10");
                done();
            });
        });
    });

    describe("Fill", () => {
        it("Is correct with default settings", (done) => {
            defaultDataView.metadata.objects["backgroundSettings"] = {
                show: true,
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let fillRect = defaultVisualBuilder.fill.select("rect");
                expect(fillRect).toBeDefined();
                expect(fillRect.attr("width")).toEqual("310");
                expect(fillRect.attr("height")).toEqual("200");
                done();
            });
        });

        it("Transparency is correctly applied", (done) => {
            defaultDataView.metadata.objects["backgroundSettings"] = {
                show: true,
                transparency: 30
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                expect(defaultVisualBuilder.fill.style("opacity")).toEqual("0.7");
                done();
            });
        });

        it("Image is shown correctly with padding", (done) => {
            defaultDataView.metadata.objects["backgroundSettings"] = {
                show: true,
                showImage: true,
                imageURL: "https://www.elastic.co/assets/bltada7771f270d08f6/enhanced-buzz-1492-1379411828-15.jpg",
                imagePadding: 8
            };
            defaultVisualBuilder.updateRenderTimeout(defaultDataView, () => {
                let image = defaultVisualBuilder.fill.select("image");
                expect(image.attr("href")).toEqual("https://www.elastic.co/assets/bltada7771f270d08f6/enhanced-buzz-1492-1379411828-15.jpg");
                expect(image.attr("width")).toEqual("302");
                expect(image.attr("height")).toEqual("192");
                expect(image.attr("x")).toEqual("4");
                expect(image.attr("y")).toEqual("4");
                done();
            });
        });
    });
});