import Mocker, {
  AttributeType,
  DataMode,
  Distribution,
  DistributionType,
} from "random-mock";
const getScatter = () => {
  const attributes = [
    {
      name: "Region",
      type: "primary",
      distribution: {
        type: "disposable",
        dataset: ["USA", "UK", "CHN", "RUS", "FRA"],
      },
      count: 5,
    },
    {
      name: "Age",
      type: "primary",
      distribution: {
        type: "disposable",
        dataset: (function () {
          const ages = [];
          for (let i = 1; i < 100; i++) ages.push(i);
          return ages;
        })(),
      },
      count: 99,
    },
    {
      name: "Bmi",
      type: "continuous",
      distribution: {
        type: "normal",
        u: 22,
        sigma: 3,
      },
    },
    {
      name: "Charges",
      type: "continuous",
      distribution: {
        type: "exponential",
        offset: 5,
        lambda: 5,
      },
    },
    {
      name: "Sex",
      type: "category",
      distribution: {
        type: "standard",
        range: ["male", "female"],
        p: [0.55, 0.45],
      },
    },
    {
      name: "Smoker",
      type: "category",
      distribution: {
        type: "standard",
        range: ["smoker", "non-smoker"],
        p: [0.3, 0.7],
      },
    },
  ];
  const mocker = new Mocker({
    attributes,
    rules: [
      {
        target: "Smoker",
        source: ["Sex"],
        type: "mappingtable",
        conditions: [
          {
            Sex: ["male"],
            value: new Distribution.Standard(
              ["smoker", "non-smoker"],
              [0.4, 0.6]
            ),
          },
          {
            Sex: ["female"],
            value: new Distribution.Standard(
              ["smoker", "non-smoker"],
              [0.2, 0.8]
            ),
          },
        ],
        confidence: 0.95,
      },
      {
        target: "Bmi",
        source: ["Age", "Sex", "Charges"],
        type: "mappingtable",
        conditions: [
          {
            Sex: ["male"],
            value: {
              type: "expression",
              expression: (item) => 16 + item.Age * 0.12,
              distribution: "normal",
              sigma: 2,
            },
          },
          {
            Sex: ["female"],
            value: {
              type: "expression",
              expression: (item) => 12 + item.Age * 0.1,
              distribution: "normal",
              sigma: 2,
            },
          },
        ],
        confidence: 0.95,
      },
    ],
  });
  const dataset = mocker.create({
    mode: DataMode.Object,
  });
  console.log(dataset);
  return {
    attributes: mocker.attributes,
    dataset,
    avaliable: ["scatter", "line", "bar"],
  };
};
const getDatasets = () => [getScatter()];
export default getDatasets;
