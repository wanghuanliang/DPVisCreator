export const attributesData = {
  Dimensions: ["sex", "smoker", "region", "children"],
  Measures: ["age", "bmi", "charges"],
  Computation: ["count", "average"],
};

export const attributeType = ["Dimensions", "Measures", "Computation"];

//  Dimensions-0, Measures-1
export const attributeCharacter = {
  sex: {
    character: "0",
    range: ["male", "female"],
  },
  smoker: {
    character: "0",
    range: ["yes", "no"],
  },
  region: {
    character: "0",
    range: ["southwest", "southeast", "northwest", "northeast"],
  },
  children: {
    character: "0",
    range: [0, 1, 2, 3, 4, 5],
  },
  age: {
    character: "1",
    range: [18, 64],
  },
  bmi: {
    character: "1",
    range: [15.96, 53.13],
  },
  charges: {
    character: "1",
    range: [1121, 63770],
  },
};
