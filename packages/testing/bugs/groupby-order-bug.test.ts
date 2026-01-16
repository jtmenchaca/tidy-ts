import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

Deno.test("groupBy preserves row order within groups - simple case", () => {
  const data = [
    { group: "A", value: 1, text: "first" },
    { group: "A", value: 2, text: "second" },
    { group: "A", value: 3, text: "third" },
  ];

  const df = createDataFrame(data);
  const result = df
    .groupBy("group")
    .summarize({
      concatenated: (g) => g.text.join("-"),
      values: (g) => g.value.join(","),
      firstValue: (g) => g.value[0],
      lastValue: (g) => g.value[g.value.length - 1],
    });

  console.log("Simple case result:");
  result.print();

  const row = result.toArray()[0];
  expect(row.concatenated).toBe("first-second-third");
  expect(row.values).toBe("1,2,3");
  expect(row.firstValue).toBe(1);
  expect(row.lastValue).toBe(3);
});

Deno.test("groupBy preserves row order within groups - multiple groups", () => {
  const data = [
    { group: "A", seq: 1 },
    { group: "B", seq: 10 },
    { group: "A", seq: 2 },
    { group: "B", seq: 20 },
    { group: "A", seq: 3 },
  ];

  const df = createDataFrame(data);
  const result = df
    .groupBy("group")
    .summarize({
      sequence: (g) => g.seq.join(","),
      count: (g) => g.seq.length,
    });

  console.log("Multiple groups result:");
  result.print();

  const resultArray = result.toArray();
  const groupA = resultArray.find((r) => r.group === "A");
  const groupB = resultArray.find((r) => r.group === "B");

  expect(groupA?.sequence).toBe("1,2,3");
  expect(groupA?.count).toBe(3);
  expect(groupB?.sequence).toBe("10,20");
  expect(groupB?.count).toBe(2);
});

Deno.test("groupBy with array index access", () => {
  const data = [
    { id: 1, group: "X", letter: "a" },
    { id: 2, group: "X", letter: "b" },
    { id: 3, group: "X", letter: "c" },
    { id: 4, group: "X", letter: "d" },
  ];

  const df = createDataFrame(data);
  const result = df
    .groupBy("group")
    .summarize({
      first_letter: (g) => g.letter[0],
      second_letter: (g) => g.letter[1],
      third_letter: (g) => g.letter[2],
      last_letter: (g) => g.letter[g.letter.length - 1],
      all_letters: (g) => g.letter.join(""),
    });

  console.log("Array index access result:");
  result.print();

  const row = result.toArray()[0];
  expect(row.first_letter).toBe("a");
  expect(row.second_letter).toBe("b");
  expect(row.third_letter).toBe("c");
  expect(row.last_letter).toBe("d");
  expect(row.all_letters).toBe("abcd");
});

Deno.test("groupBy order with filtering", () => {
  const data = [
    { category: "fruit", name: "apple", order: 1 },
    { category: "fruit", name: "banana", order: 2 },
    { category: "fruit", name: "cherry", order: 3 },
  ];

  const df = createDataFrame(data);
  const result = df
    .filter((row) => row.category === "fruit")
    .groupBy("category")
    .summarize({
      names: (g) => g.name.join(", "),
      orders: (g) => g.order.join("-"),
    });

  console.log("Filtered groupBy result:");
  result.print();

  const row = result.toArray()[0];
  expect(row.names).toBe("apple, banana, cherry");
  expect(row.orders).toBe("1-2-3");
});
