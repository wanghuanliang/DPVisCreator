export const attributeData = {
  Dimensions: ["sex", "children", "smoker", "region"],
  Measures: ["age", "bmi", "charges"],
  Computations: [],
};

export const attributeType = ["Dimensions", "Measures", "Computation"];

//  Dimensions-0, Measures-1
export const attributeCharacter = {
  age: {
    attribute_type: "Measures",
    min: 18,
    max: 64,
    average: 39.20702541106129,
  },
  sex: {
    attribute_type: "Dimensions",
    values: ["female", "male"],
  },
  bmi: {
    attribute_type: "Measures",
    min: 15.96,
    max: 53.13,
    average: 30.663396860986538,
  },
  children: {
    attribute_type: "Dimensions",
    values: [0, 1, 2, 3, 4, 5],
  },
  smoker: {
    attribute_type: "Dimensions",
    values: ["no", "yes"],
  },
  region: {
    attribute_type: "Dimensions",
    values: ["northeast", "northwest", "southeast", "southwest"],
  },
  charges: {
    attribute_type: "Measures",
    min: 1121.8739,
    max: 63770.42801,
    average: 13270.422265141257,
  },
};
