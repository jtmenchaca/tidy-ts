// import { hc } from "@hono/hono/client";
// // Need to use relative import because we're using both bun and deno
// import type { AppType } from "@orderly/backend";

// export const backend = hc<AppType>("/api");

// // User Count API functions
// export interface UserCount {
//   userId: string;
//   count: number;
//   lastUpdated: string;
// }

// export const userCountApi = {
//   // Get user count by ID
//   getUserCount: async (userId: string): Promise<UserCount | null> => {
//     try {
//       const response = await backend.userCount[":userId"].$get({
//         param: { userId },
//       });
//       if (response.ok) {
//         return await response.json();
//       }
//       return null;
//     } catch (error) {
//       console.error("Error getting user count:", error);
//       return null;
//     }
//   },

//   // Get all user counts
//   getAllUserCounts: async (): Promise<UserCount[]> => {
//     try {
//       const response = await backend.userCount.$get();
//       if (response.ok) {
//         return await response.json();
//       }
//       return [];
//     } catch (error) {
//       console.error("Error getting all user counts:", error);
//       return [];
//     }
//   },

//   // Create or update user count
//   upsertUserCount: async (
//     userId: string,
//     count: number,
//   ): Promise<UserCount | null> => {
//     try {
//       const response = await backend.userCount.$post({
//         json: { userId, count },
//       });
//       if (response.ok) {
//         return await response.json();
//       }
//       return null;
//     } catch (error) {
//       console.error("Error upserting user count:", error);
//       return null;
//     }
//   },

//   // Increment user count
//   incrementUserCount: async (userId: string): Promise<UserCount | null> => {
//     try {
//       const response = await backend.userCount[":userId"].increment.$post({
//         param: { userId },
//       });
//       if (response.ok) {
//         return await response.json();
//       }
//       return null;
//     } catch (error) {
//       console.error("Error incrementing user count:", error);
//       return null;
//     }
//   },

//   // Delete user count
//   deleteUserCount: async (userId: string): Promise<boolean> => {
//     try {
//       const response = await backend.userCount[":userId"].$delete({
//         param: { userId },
//       });
//       return response.ok;
//     } catch (error) {
//       console.error("Error deleting user count:", error);
//       return false;
//     }
//   },
// };
