export const attributeData = {
  Dimensions: ["sex", "smoker", "region", "children"],
  Measures: ["age", "bmi", "charges"],
  Computation: ["count", "average"],
};

export const attributeType = ["Dimensions", "Measures", "Computation"];

//  Dimensions-0, Measures-1
export const attributeCharacter = {
  sex: {
    attributeType: "0",
    value: ["male", "female"],
  },
  smoker: {
    attributeType: "0",
    value: ["yes", "no"],
  },
  region: {
    attributeType: "0",
    value: ["southwest", "southeast", "northwest", "northeast"],
  },
  children: {
    attributeType: "0",
    value: [0, 1, 2, 3, 4, 5],
  },
  age: {
    attributeType: "1",
    min: 18,
    max: 64,
  },
  bmi: {
    attributeType: "1",
    min: 15.96, // 四舍五入？
    max: 53.13,
  },
  charges: {
    attributeType: "1",
    min: 1121,
    max: 63770,
  },
};
