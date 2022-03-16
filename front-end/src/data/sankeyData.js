import { modelData, originalData } from "./modelData";
const { axis_order: axisOrder, proportion_data: proportionData } = originalData;

// const data = {};
const nodes = [];
let index = 0;
Object.keys(proportionData).forEach((attr) => {
  proportionData[attr].forEach((obj, i) => {});
});

const linksNum = new Array(33);
originalData.forEach((obj) => {
  if (
    obj.bmi >= proportionData.bmi[0].minn &&
    obj.bmi < proportionData.bmi[0].maxx &&
    obj.children === proportionData.children[0].value
  )
    linksNum[0]++;
});

let a = [86, 85, 79, 102, 93, 78, 87, 89];
export const data = {
  nodes: [
    { node: 0, name: "node0" },
    // { node: 1, name: "node1" },
    { node: 2, name: "node2" },
    // { node: 3, name: "node3" },
    { node: 4, name: "node4" },
  ],
  links: [
    { source: 0, target: 2, value: 2 },
    // { source: 1, target: 2, value: 2 },
    // { source: 1, target: 3, value: 2 },
    // { source: 0, target: 4, value: 2 },
    // { source: 2, target: 3, value: 2 },
    { source: 2, target: 4, value: 2 },
    // { source: 3, target: 4, value: 4 },
  ],
};
