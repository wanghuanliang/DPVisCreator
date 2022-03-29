export const networkData = {
  nodeData: [
    ["charges"],
    ["age"],
    ["smoker", "bmi", "children", "sex"],
    ["region"],
  ],
  linkData: [
    ["charges", "age"],
    ["age", "smoker"],
    ["charges", "smoker"],
    ["age", "bmi"],
    ["charges", "bmi"],
    ["age", "children"],
    ["charges", "children"],
    ["bmi", "region"],
    ["age", "region"],
    ["age", "sex"],
    ["charges", "sex"],
  ],
};
