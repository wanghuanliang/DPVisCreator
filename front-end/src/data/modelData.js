export const modelData = {
  total_num: 100,
  axis_order: ["charges", "bmi", "age", "children"],
  proportion_data: {
    charges: [
      {
        minn: 15,
        maxx: 16,
        num: 40,
      },
      {
        num: 30,
      },
      {
        num: 15,
      },
      {
        num: 15,
      },
    ],
    bmi: [
      {
        num: 20,
      },
      {
        num: 80,
      },
    ],
    age: [
      {
        num: 90,
      },
      {
        num: 10,
      },
    ],
    children: [
      {
        num: 30,
      },
      {
        num: 70,
      },
    ],
  },
  flow_data: [
    {
      flow_index: 0,
      constraint_id: "C0",
      pos: {
        charges: 0,
        bmi: 0,
        age: 0,
        children: 0,
      },
      num: 10,
    },
    {
      flow_index: 1,
      constraint_id: "C0",
      pos: {
        charges: 0,
        bmi: 0,
        age: 0,
        children: 1,
      },
      num: 5,
    },
    {
      flow_index: 2,
      constraint_id: "C1",
      pos: {
        charges: 1,
        bmi: 0,
        age: 0,
        children: 0,
      },
      num: 3,
    },
    {
      flow_index: 3,
      constraint_id: "C2",
      pos: {
        charges: 0,
        bmi: 1,
        age: 0,
        children: 1,
      },
      num: 5,
    },
  ],
  matrix_data: [
    [0.5, 0.2, 0.3],
    [0.8, 0.6, 0.5],
    [0.9, 0.1, 0.7],
  ],
};
