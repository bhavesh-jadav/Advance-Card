import powerbi from "powerbi-visuals-api";
import { DataLabelData, AllData } from "./visualData";
import { AdvanceCardBuilder } from "./visualBuilder";
import { AdvanceCardVisualSettings } from "../src/settings";

describe("Advance Card", () => {

    let defaultVisualSettings: AdvanceCardVisualSettings;
    beforeEach(() => {
        defaultVisualSettings = new AdvanceCardVisualSettings();
    });

    // DOM test
    // Make sure all the elements exists in DOM with default properties
    // describe("DOM Test", () => {
    //     let allDataViewBuilder: AllData = new AllData();
    //     let visualBuilder: AdvanceCardBuilder;
    //     let dataView: powerbi.DataView;
    //     beforeEach(() => {
    //         visualBuilder = new AdvanceCardBuilder(500, 500);
    //         dataView = allDataViewBuilder.getDataView();
    //     });

    //     it("root DOM element is created", () => {
    //         visualBuilder.updateRenderTimeout(dataView, () => {
    //             expect(visualBuilder.mainElement[0]).toBeInDOM();
    //         });
    //     });

    //     it("data label element is created", (done) => {
    //         visualBuilder.updateRenderTimeout(dataView, () => {
    //             expect(visualBuilder.dataLabel[0]).toBeInDOM();
    //             done();
    //         });
    //     });

    //     it("category label element is created", (done) => {
    //         visualBuilder.updateRenderTimeout(dataView, () => {
    //             expect(visualBuilder.categoryLabel[0]).toBeInDOM();
    //             done();
    //         });
    //     });

    //     it("prefix label element is created", (done) => {
    //         dataView.metadata.objects = {
    //             prefixSettings: {
    //                 show: true
    //             }
    //         };
    //         visualBuilder.updateRenderTimeout(dataView, () => {
    //             expect(visualBuilder.prefixLabel[0]).toBeInDOM();
    //             done();
    //         });
    //     });

    //     it("postfix label element is created", (done) => {
    //         dataView.metadata.objects = {
    //             postfixSettings: {
    //                 show: true
    //             }
    //         };
    //         visualBuilder.updateRenderTimeout(dataView, () => {
    //             expect(visualBuilder.postfixLabel[0]).toBeInDOM();
    //             done();
    //         });
    //     });
    // });

    describe("Data Label", () => {
        let dataLabelDataViewBuilder: DataLabelData = new DataLabelData();
        let visualBuilder: AdvanceCardBuilder;
        let dataView: powerbi.DataView;
        let dataLabel = "";
        beforeEach(() => {
            visualBuilder = new AdvanceCardBuilder(510, 310);
            dataView = dataLabelDataViewBuilder.getDataView();
        });

        describe("Truncation", () => {
            beforeEach(() => {
                dataLabel = "1/1/2018 3:00:00 AM";
                dataLabelDataViewBuilder.SetDataLabelValue("1/1/2018 3:00:00 AM");
                dataView = dataLabelDataViewBuilder.getDataView();
            });

            it("should truncate when label is longer than visual container width", (done) => {
                visualBuilder = new AdvanceCardBuilder(140, 140);
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.dataLabel[0].innerHTML.length).toEqual(10);
                    done();
                });
            });
    
            it("should NOT truncate when visual container width is enough for data label", (done) => {
                visualBuilder.updateRenderTimeout(dataView, () => {
                    expect(visualBuilder.dataLabel[0].innerHTML.length).toEqual(dataLabel.length);
                    done();
                });
            });
        });
        
        it("should have proper default spacing with prefix and postfix label", (done) => {
            dataView.metadata.objects = {
                prefixSettings: {
                    show: true,
                    text: "Hello"
                },
                postfixSettings: {
                    show:true,
                    text: "Hello"
                }
            };
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(+visualBuilder.mainElement.find("tspan.dataLabel").attr("dx")).toEqual(defaultVisualSettings.prefixSettings.spacing);
                expect(+visualBuilder.mainElement.find("tspan.postfixLabel").attr("dx")).toEqual(defaultVisualSettings.postfixSettings.spacing);
                done();
            });
        });
    });
});