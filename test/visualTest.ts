import powerbi from "powerbi-visuals-api";
import { AdvanceCardData1 } from './visualData';
import { AdvanceCardBuilder } from './visualBuilder';

describe("Advance Card", () =>{
    let visualBuilder: AdvanceCardBuilder;
        let dataViewBuilder: AdvanceCardData1 = new AdvanceCardData1();
        let dataView: powerbi.DataView;
        beforeEach(() => {
            visualBuilder = new AdvanceCardBuilder(500, 500);
            dataView = dataViewBuilder.getDataView();
        });

        it("root DOM element is created", () => {
            visualBuilder.updateRenderTimeout(dataView, () => {
                expect(visualBuilder.mainElement).toBeInDOM();
            })
        });
})