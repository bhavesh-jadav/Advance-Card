import powerbi from "powerbi-visuals-api";
import { DataLabelData, AllData } from './visualData';
import { AdvanceCardBuilder } from './visualBuilder';

// DOM test
// Make sure all the elements exists in dom with default properties
describe("Advance Card", () =>{
    let visualBuilder: AdvanceCardBuilder;
    let dataViewBuilder: AllData = new AllData();
    let dataView: powerbi.DataView;
    beforeEach(() => {
        visualBuilder = new AdvanceCardBuilder(500, 500);
        dataView = dataViewBuilder.getDataView();
    });
    describe("DOM Test", () => { 

        it("root DOM element is created", () => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.mainElement[0]).toBeInDOM();
            })
        });
    
        it("data label element is created", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.dataLabel[0]).toBeInDOM();
                done();
            });
        });

        it("category label element is created", (done) => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.categoryLabel[0]).toBeInDOM();
                done();
            });
        });

        it("prefix label element is created", (done) => {
            dataView.metadata.objects = {
                prefixSettings: {
                    show: true
                }
            }
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.prefixLabel[0]).toBeInDOM();
                done();
            });
        });

        it("postfix label element is created", (done) => {
            dataView.metadata.objects = {
                postfixSettings: {
                    show: true
                }
            }
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.postfixLabel[0]).toBeInDOM();
                done();
            });
        });
    });
})