
export function GetCeiledXYFromTranslate(translate: string) {
    let data = translate.slice(10, translate.length - 1).split(",");
    return {
        x: Math.ceil(+data[0]),
        y: Math.ceil(+data[1])
    };
}