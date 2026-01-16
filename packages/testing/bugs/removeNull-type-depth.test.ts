import { createDataFrame } from "@tidy-ts/dataframe";
import { expect } from "@std/expect";

// Reproduce the type instantiation depth issue
// Based on user's code:
// const roleStats = messagesWithUsers
//   .removeNull("from_user_role")
//   .groupBy("from_user_role")
//   .summarize({
//     message_count: (g) => g.nrows(),
//   })
//   .arrange("message_count", "desc");

Deno.test("removeNull type depth issue - simple case", () => {
  const messagesWithUsers = createDataFrame([
    { id: 1, from_user_role: "admin", content: "Hello" },
    { id: 2, from_user_role: null, content: "Hi" },
    { id: 3, from_user_role: "user", content: "Hey" },
  ]);

  const roleStats = messagesWithUsers
    .removeNull("from_user_role")
    .groupBy("from_user_role")
    .summarize({
      message_count: (g) => g.nrows(),
    })
    .arrange("message_count", "desc");

  expect(roleStats.nrows()).toBe(2);
});

Deno.test("removeNull type depth issue - larger row type", () => {
  // Simulate a real-world case with many columns (like a messages table with users joined)
  const messagesWithUsers = createDataFrame([
    {
      id: 1,
      from_user_id: "user1",
      from_user_role: "admin",
      from_user_name: "Alice",
      from_user_email: "alice@example.com",
      from_user_created_at: "2024-01-01",
      content: "Hello",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      thread_id: "thread1",
      channel_id: "channel1",
    },
    {
      id: 2,
      from_user_id: "user2",
      from_user_role: null,
      from_user_name: "Bob",
      from_user_email: "bob@example.com",
      from_user_created_at: "2024-01-02",
      content: "Hi",
      created_at: "2024-01-02",
      updated_at: "2024-01-02",
      thread_id: "thread2",
      channel_id: "channel1",
    },
    {
      id: 3,
      from_user_id: "user3",
      from_user_role: "user",
      from_user_name: "Charlie",
      from_user_email: "charlie@example.com",
      from_user_created_at: "2024-01-03",
      content: "Hey",
      created_at: "2024-01-03",
      updated_at: "2024-01-03",
      thread_id: "thread1",
      channel_id: "channel2",
    },
  ]);

  const roleStats = messagesWithUsers
    .removeNull("from_user_role")
    .groupBy("from_user_role")
    .summarize({
      message_count: (g) => g.nrows(),
    })
    .arrange("message_count", "desc");

  expect(roleStats.nrows()).toBe(2);
});

Deno.test("removeNull type depth - even larger row type (stress test)", () => {
  // Even more columns to trigger type depth issues
  const messagesWithUsers = createDataFrame([
    {
      id: 1,
      from_user_id: "user1",
      from_user_role: "admin",
      from_user_name: "Alice",
      from_user_email: "alice@example.com",
      from_user_created_at: "2024-01-01",
      from_user_updated_at: "2024-01-01",
      from_user_avatar: "avatar1.jpg",
      from_user_bio: "Admin user",
      from_user_status: "active",
      content: "Hello",
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      thread_id: "thread1",
      channel_id: "channel1",
      channel_name: "general",
      workspace_id: "workspace1",
      workspace_name: "Company",
      is_edited: false,
      is_deleted: false,
      reaction_count: 0,
    },
    {
      id: 2,
      from_user_id: "user2",
      from_user_role: null,
      from_user_name: "Bob",
      from_user_email: "bob@example.com",
      from_user_created_at: "2024-01-02",
      from_user_updated_at: "2024-01-02",
      from_user_avatar: "avatar2.jpg",
      from_user_bio: "Regular user",
      from_user_status: "active",
      content: "Hi",
      created_at: "2024-01-02",
      updated_at: "2024-01-02",
      thread_id: "thread2",
      channel_id: "channel1",
      channel_name: "general",
      workspace_id: "workspace1",
      workspace_name: "Company",
      is_edited: false,
      is_deleted: false,
      reaction_count: 5,
    },
  ]);

  const roleStats = messagesWithUsers
    .removeNull("from_user_role")
    .groupBy("from_user_role")
    .summarize({
      message_count: (g) => g.nrows(),
    })
    .arrange("message_count", "desc");

  expect(roleStats.nrows()).toBe(1);
});
