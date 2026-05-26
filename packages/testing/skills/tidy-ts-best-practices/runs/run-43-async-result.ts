import { createDataFrame } from "@tidy-ts/dataframe";
import {
  type AppError,
  defineError,
  err,
  ok,
  type Result,
} from "@tidy-ts/shims";

// ---- Setup ----

async function lookupRiskScore(id: number): Promise<number> {
  await new Promise((resolve) => setTimeout(resolve, 50));
  return id * 1.5;
}

const users = createDataFrame([
  { id: 1, name: "Alice", email: "alice@example.com" },
  { id: 2, name: "Bob", email: "bob@example.com" },
  { id: 3, name: "Carol", email: "carol@example.com" },
  { id: 4, name: "Dan", email: "dan@example.com" },
  { id: 5, name: "Eve", email: "eve@example.com" },
  { id: 6, name: "Frank", email: "frank@example.com" },
]);

// ---- Task 1: attach risk_score with at most 2 concurrent calls ----

console.log("--- Task 1: DataFrame with risk_score (concurrency=2) ---");
const withScores = await users.mutateAsync(
  { risk_score: async (r) => await lookupRiskScore(r.id) },
  { concurrency: 2 },
);
withScores.print();

// ---- Task 2: filter risk_score > 5 ----

console.log("\n--- Task 2: filtered (risk_score > 5) ---");
const filtered = withScores.filter((r) => r.risk_score > 5);
filtered.print();

// ---- Task 3: loadUser returning a typed Result ----

const NotFoundError = defineError(
  "NotFoundError",
  ({ resource, id }: { resource: string; id: number }) =>
    `${resource} with id ${id} not found`,
);
type NotFoundError = AppError<
  "NotFoundError",
  { resource: string; id: number }
>;

type User = { id: number; name: string };

function loadUser(id: number): Result<User, NotFoundError> {
  if (id === 999) {
    return err(new NotFoundError({ resource: "User", id }));
  }
  return ok({ id, name: "User-" + id });
}

console.log("\n--- Task 3: loadUser branching without try/catch ---");
for (const id of [1, 999]) {
  const r = loadUser(id);
  if (r.ok) {
    console.log(`loadUser(${id}) -> success:`, r.value);
  } else {
    console.log(
      `loadUser(${id}) -> failure: ${r.error.name} (${r.error.message})`,
    );
  }
}

// ---- Task 4: compose loadUserAndScore ----

async function loadUserAndScore(
  id: number,
): Promise<Result<{ user: User; score: number }, NotFoundError>> {
  const userResult = loadUser(id);
  if (!userResult.ok) {
    return userResult; // propagate the typed error
  }
  const score = await lookupRiskScore(id);
  return ok({ user: userResult.value, score });
}

console.log("\n--- Task 4: loadUserAndScore composition ---");
for (const id of [1, 999]) {
  const r = await loadUserAndScore(id);
  if (r.ok) {
    console.log(`loadUserAndScore(${id}) -> success:`, r.value);
  } else {
    console.log(
      `loadUserAndScore(${id}) -> failure: ${r.error.name} (${r.error.message})`,
    );
  }
}
