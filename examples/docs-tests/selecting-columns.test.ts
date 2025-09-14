import { describe, expect, it } from "bun:test";
import { createDataFrame, type DataFrame } from "@tidy-ts/dataframe";

describe("Selecting Columns", () => {
  it("should select specific columns", () => {
    const people = createDataFrame([
      { id: 1, name: "Alice", age: 25, city: "New York", salary: 50000 },
      { id: 2, name: "Bob", age: 30, city: "San Francisco", salary: 60000 },
      { id: 3, name: "Charlie", age: 35, city: "Chicago", salary: 70000 },
    ]);

    const selected = people.select("name", "age");

    // Type check: select preserves only the selected columns
    const _selectedTypeCheck: DataFrame<{
      name: string;
      age: number;
    }> = selected;
    void _selectedTypeCheck; // Suppress unused variable warning

    selected.print("Selected columns:");

    expect(selected.nrows()).toBe(3);
    expect(selected.columns()).toEqual(["name", "age"]);
    expect(selected.toArray()).toEqual([
      { name: "Alice", age: 25 },
      { name: "Bob", age: 30 },
      { name: "Charlie", age: 35 },
    ]);
  });

  it("should drop specific columns", () => {
    const people = createDataFrame([
      { id: 1, name: "Alice", age: 25, city: "New York", salary: 50000 },
      { id: 2, name: "Bob", age: 30, city: "San Francisco", salary: 60000 },
      { id: 3, name: "Charlie", age: 35, city: "Chicago", salary: 70000 },
    ]);

    const dropped = people.drop("id", "city");

    // Type check: drop removes specified columns
    const _droppedTypeCheck: DataFrame<{
      name: string;
      age: number;
      salary: number;
    }> = dropped;
    void _droppedTypeCheck; // Suppress unused variable warning

    dropped.print("After dropping columns:");

    expect(dropped.nrows()).toBe(3);
    expect(dropped.columns()).toEqual(["name", "age", "salary"]);
    expect(dropped.toArray()).toEqual([
      { name: "Alice", age: 25, salary: 50000 },
      { name: "Bob", age: 30, salary: 60000 },
      { name: "Charlie", age: 35, salary: 70000 },
    ]);
  });

  it("should access individual columns", () => {
    const people = createDataFrame([
      { id: 1, name: "Alice", age: 25, city: "New York", salary: 50000 },
      { id: 2, name: "Bob", age: 30, city: "San Francisco", salary: 60000 },
      { id: 3, name: "Charlie", age: 35, city: "Chicago", salary: 70000 },
    ]);

    const names = people.name;
    const ages = people.age;

    console.log("Names:", names);
    console.log("Ages:", ages);

    expect(names).toEqual(["Alice", "Bob", "Charlie"]);
    expect(ages).toEqual([25, 30, 35]);
  });

  it("should extract specific values", () => {
    const people = createDataFrame([
      { id: 1, name: "Alice", age: 25, city: "New York", salary: 50000 },
      { id: 2, name: "Bob", age: 30, city: "San Francisco", salary: 60000 },
      { id: 3, name: "Charlie", age: 35, city: "Chicago", salary: 70000 },
    ]);

    const firstPerson = people.extractHead("name", 1);
    const lastPerson = people.extractTail("name", 1);
    const allNames = people.extract("name");

    console.log("First person:", firstPerson);
    console.log("Last person:", lastPerson);
    console.log("All names:", allNames);

    expect(firstPerson).toBe("Alice");
    expect(lastPerson).toBe("Charlie");
    expect(allNames).toEqual(["Alice", "Bob", "Charlie"]);
  });
});
