// import { useCallback, useEffect, useState } from "react";
// import { type UserCount, userCountApi } from "../lib/api.ts";
// import { Button } from "./ui/button.tsx";
// import { Input } from "./ui/input.tsx";
// import {
//   Card,
//   CardContent,
//   CardDescription,
//   CardHeader,
//   CardTitle,
// } from "./ui/card.tsx";
// import { Label } from "./ui/label.tsx";
// import { Badge } from "./ui/badge.tsx";
// import { Separator } from "./ui/separator.tsx";

// export function UserCountDemo() {
//   const [userId, setUserId] = useState("");
//   const [count, setCount] = useState("");
//   const [currentUserCount, setCurrentUserCount] = useState<UserCount | null>(
//     null,
//   );
//   const [allUserCounts, setAllUserCounts] = useState<UserCount[]>([]);
//   const [message, setMessage] = useState("");

//   // Load all user counts on component mount
//   useEffect(() => {
//     loadAllUserCounts();
//   }, []);

//   const loadAllUserCounts = useCallback(async () => {
//     try {
//       const counts = await userCountApi.getAllUserCounts();
//       setAllUserCounts(counts);
//     } catch (error) {
//       setMessage("Error loading user counts");
//     }
//   }, []);

//   const handleGetUserCount = useCallback(async () => {
//     if (!userId.trim()) {
//       setMessage("Please enter a user ID");
//       return;
//     }

//     try {
//       const userCount = await userCountApi.getUserCount(userId);
//       setCurrentUserCount(userCount);
//       setMessage(userCount ? "User count found!" : "User count not found");
//     } catch (error) {
//       setMessage("Error getting user count");
//     }
//   }, [userId]);

//   const handleUpsertUserCount = useCallback(async () => {
//     if (!userId.trim()) {
//       setMessage("Please enter a user ID");
//       return;
//     }

//     const countValue = parseInt(count) || 0;
//     try {
//       const result = await userCountApi.upsertUserCount(userId, countValue);
//       if (result) {
//         setCurrentUserCount(result);
//         setMessage("User count updated successfully!");
//         loadAllUserCounts(); // Refresh the list
//       } else {
//         setMessage("Failed to update user count");
//       }
//     } catch (error) {
//       setMessage("Error updating user count");
//     }
//   }, [userId, count, loadAllUserCounts]);

//   const handleIncrementUserCount = useCallback(async () => {
//     if (!userId.trim()) {
//       setMessage("Please enter a user ID");
//       return;
//     }

//     try {
//       const result = await userCountApi.incrementUserCount(userId);
//       if (result) {
//         setCurrentUserCount(result);
//         setCount(result.count.toString());
//         setMessage("User count incremented successfully!");
//         loadAllUserCounts(); // Refresh the list
//       } else {
//         setMessage("Failed to increment user count");
//       }
//     } catch (error) {
//       setMessage("Error incrementing user count");
//     }
//   }, [userId, loadAllUserCounts]);

//   const handleDeleteUserCount = useCallback(async () => {
//     if (!userId.trim()) {
//       setMessage("Please enter a user ID");
//       return;
//     }

//     try {
//       const success = await userCountApi.deleteUserCount(userId);
//       if (success) {
//         setCurrentUserCount(null);
//         setMessage("User count deleted successfully!");
//         loadAllUserCounts(); // Refresh the list
//       } else {
//         setMessage("Failed to delete user count");
//       }
//     } catch (error) {
//       setMessage("Error deleting user count");
//     }
//   }, [userId, loadAllUserCounts]);

//   return (
//     <div className="space-y-6 p-6">
//       <Card>
//         <CardHeader>
//           <CardTitle>User Count Demo</CardTitle>
//           <CardDescription>
//             Test the user count functionality with the database
//           </CardDescription>
//         </CardHeader>
//         <CardContent className="space-y-4">
//           {/* Input Form */}
//           <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
//             <div>
//               <Label htmlFor="userId">User ID</Label>
//               <Input
//                 id="userId"
//                 value={userId}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   setUserId(e.target.value)}
//                 placeholder="Enter user ID"
//               />
//             </div>
//             <div>
//               <Label htmlFor="count">Count</Label>
//               <Input
//                 id="count"
//                 type="number"
//                 value={count}
//                 onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
//                   setCount(e.target.value)}
//                 placeholder="Enter count"
//               />
//             </div>
//             <div className="flex items-end">
//               <Button
//                 onClick={handleGetUserCount}
//                 className="w-full"
//               >
//                 Get Count
//               </Button>
//             </div>
//           </div>

//           {/* Action Buttons */}
//           <div className="flex flex-wrap gap-2">
//             <Button
//               onClick={handleUpsertUserCount}
//               variant="default"
//             >
//               Create/Update Count
//             </Button>
//             <Button
//               onClick={handleIncrementUserCount}
//               variant="secondary"
//             >
//               Increment Count
//             </Button>
//             <Button
//               onClick={handleDeleteUserCount}
//               variant="destructive"
//             >
//               Delete Count
//             </Button>
//             <Button
//               onClick={loadAllUserCounts}
//               variant="outline"
//             >
//               Refresh All
//             </Button>
//           </div>

//           {/* Message Display */}
//           <div
//             className={`p-3 bg-blue-50 border border-blue-200 rounded-md transition-opacity duration-300 ${
//               message ? "opacity-100 h-auto" : "opacity-0 h-0 overflow-hidden"
//             }`}
//           >
//             <p className="text-blue-800">{message}</p>
//           </div>

//           {/* Current User Count Display */}
//           <Card
//             className={`transition-opacity duration-300 ${
//               currentUserCount
//                 ? "opacity-100 max-h-96 p-6"
//                 : "opacity-0 max-h-0 overflow-hidden p-0"
//             }`}
//           >
//             {currentUserCount && (
//               <>
//                 <CardHeader className="p-0 mb-4">
//                   <CardTitle className="text-lg">Current User Count</CardTitle>
//                 </CardHeader>
//                 <CardContent className="p-0">
//                   <div className="space-y-2">
//                     <div className="flex justify-between">
//                       <span className="font-medium">User ID:</span>
//                       <Badge variant="outline">{currentUserCount.userId}</Badge>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="font-medium">Count:</span>
//                       <Badge variant="default">{currentUserCount.count}</Badge>
//                     </div>
//                     <div className="flex justify-between">
//                       <span className="font-medium">Last Updated:</span>
//                       <span className="text-sm text-gray-600">
//                         {new Date(currentUserCount.lastUpdated)
//                           .toLocaleString()}
//                       </span>
//                     </div>
//                   </div>
//                 </CardContent>
//               </>
//             )}
//           </Card>

//           <Separator />

//           {/* All User Counts Display */}
//           <div>
//             <h3 className="text-lg font-semibold mb-3">All User Counts</h3>
//             {allUserCounts.length === 0
//               ? <p className="text-gray-500">No user counts found</p>
//               : (
//                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
//                   {allUserCounts.map((userCount) => (
//                     <Card key={userCount.userId}>
//                       <CardContent className="pt-4">
//                         <div className="space-y-2">
//                           <div className="flex justify-between items-center">
//                             <span className="font-medium">User ID:</span>
//                             <Badge variant="outline">{userCount.userId}</Badge>
//                           </div>
//                           <div className="flex justify-between items-center">
//                             <span className="font-medium">Count:</span>
//                             <Badge variant="default">{userCount.count}</Badge>
//                           </div>
//                           <div className="text-xs text-gray-600">
//                             Updated:{" "}
//                             {new Date(userCount.lastUpdated).toLocaleString()}
//                           </div>
//                         </div>
//                       </CardContent>
//                     </Card>
//                   ))}
//                 </div>
//               )}
//           </div>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
