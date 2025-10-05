// Type inference tests for readJSON
import { z } from "zod";
import { type DataFrame, readJSON } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Define a Zod schema for JSON user data
const UserSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  age: z.number().optional(),
  active: z.boolean(),
  tags: z.array(z.string()).optional(),
});

Deno.test("readJSON type inference for single object", async () => {
  const userJson = {
    id: 1,
    name: "Alice",
    email: "alice@example.com",
    age: 30,
    active: true,
    tags: ["admin", "developer"],
  };

  const tempFile = "./temp_user_single.json";
  await Deno.writeTextFile(tempFile, JSON.stringify(userJson));

  try {
    const user = await readJSON(tempFile, UserSchema);

    // Type check: Should be the exact schema type
    const _userTypeCheck: {
      id: number;
      name: string;
      email: string;
      age?: number;
      active: boolean;
      tags?: string[];
    } = user;

    expect(user.id).toBe(1);
    expect(user.name).toBe("Alice");
    expect(user.active).toBe(true);
  } finally {
    await Deno.remove(tempFile).catch(() => {});
  }
});

Deno.test("readJSON type inference for array returns DataFrame", async () => {
  const UsersArraySchema = z.array(UserSchema);

  const usersJson = [
    {
      id: 1,
      name: "Alice",
      email: "alice@example.com",
      age: 30,
      active: true,
    },
    {
      id: 2,
      name: "Bob",
      email: "bob@example.com",
      active: false,
      tags: ["user"],
    },
  ];

  const tempFile = "./temp_users_array.json";
  await Deno.writeTextFile(tempFile, JSON.stringify(usersJson));

  try {
    const users = await readJSON(tempFile, UsersArraySchema);

    // Type check: Should be a DataFrame with the schema type
    const _usersTypeCheck: DataFrame<{
      id: number;
      name: string;
      email: string;
      age?: number;
      active: boolean;
      tags?: string[];
    }> = users;

    expect(users.nrows()).toBe(2);
    expect(users[0].name).toBe("Alice");
    expect(users[1].name).toBe("Bob");
  } finally {
    await Deno.remove(tempFile).catch(() => {});
  }
});

Deno.test("readJSON type inference with nullable fields", async () => {
  const ProductSchema = z.object({
    id: z.number(),
    name: z.string(),
    price: z.number(),
    discount: z.number().nullable(),
    inStock: z.boolean(),
  });

  const product = {
    id: 100,
    name: "Widget",
    price: 29.99,
    discount: null,
    inStock: true,
  };

  const tempFile = "./temp_product.json";
  await Deno.writeTextFile(tempFile, JSON.stringify(product));

  try {
    const result = await readJSON(tempFile, ProductSchema);

    // Type check: discount should be number | null
    const _productTypeCheck: {
      id: number;
      name: string;
      price: number;
      discount: number | null;
      inStock: boolean;
    } = result;

    expect(result.discount).toBe(null);
  } finally {
    await Deno.remove(tempFile).catch(() => {});
  }
});

Deno.test("readJSON type inference with nested objects", async () => {
  const OrderSchema = z.object({
    orderId: z.string(),
    customer: z.object({
      name: z.string(),
      email: z.string().email(),
    }),
    items: z.array(z.object({
      productId: z.number(),
      quantity: z.number(),
    })),
    total: z.number(),
  });

  const order = {
    orderId: "ORD-123",
    customer: {
      name: "Alice",
      email: "alice@example.com",
    },
    items: [
      { productId: 1, quantity: 2 },
      { productId: 2, quantity: 1 },
    ],
    total: 59.98,
  };

  const tempFile = "./temp_order.json";
  await Deno.writeTextFile(tempFile, JSON.stringify(order));

  try {
    const result = await readJSON(tempFile, OrderSchema);

    // Type check: nested objects should be properly typed
    const _orderTypeCheck: {
      orderId: string;
      customer: {
        name: string;
        email: string;
      };
      items: Array<{
        productId: number;
        quantity: number;
      }>;
      total: number;
    } = result;

    expect(result.customer.name).toBe("Alice");
    expect(result.items.length).toBe(2);
  } finally {
    await Deno.remove(tempFile).catch(() => {});
  }
});
