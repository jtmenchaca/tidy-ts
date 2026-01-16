/**
 * Tests for new file system functions: listDir, copyFile, rename, exists
 */

import { expect } from "@std/expect";
import {
  copyFile,
  exists,
  listDir,
  mkdir,
  readTextFile,
  remove,
  rename,
  test,
  writeTextFile,
} from "./mod.ts";

test("listDir() lists directory contents", async () => {
  const testDir = "./test-listdir";

  try {
    // Create test directory and files
    await mkdir(testDir, { recursive: true });
    await writeTextFile(`${testDir}/file1.txt`, "content 1");
    await writeTextFile(`${testDir}/file2.txt`, "content 2");
    await mkdir(`${testDir}/subdir`, { recursive: true });

    // List directory contents
    const entries = await listDir(testDir);

    expect(entries.length).toBe(3);

    // Check that we have the expected entries
    const names = entries.map((e) => e.name).sort();
    expect(names).toEqual(["file1.txt", "file2.txt", "subdir"]);

    // Check file types
    const file1 = entries.find((e) => e.name === "file1.txt");
    expect(file1?.isFile).toBe(true);
    expect(file1?.isDirectory).toBe(false);

    const subdir = entries.find((e) => e.name === "subdir");
    expect(subdir?.isDirectory).toBe(true);
    expect(subdir?.isFile).toBe(false);
  } finally {
    // Cleanup
    await remove(testDir, { recursive: true });
  }
});

test("copyFile() copies a file", async () => {
  const src = "./test-copy-src.txt";
  const dest = "./test-copy-dest.txt";

  try {
    // Create source file
    await writeTextFile(src, "test content for copy");

    // Copy the file
    await copyFile(src, dest);

    // Verify destination exists and has same content
    const destContent = await readTextFile(dest);
    expect(destContent).toBe("test content for copy");
  } finally {
    // Cleanup
    await remove(src);
    await remove(dest);
  }
});

test("copyFile() with overwrite=false fails if destination exists", async () => {
  const src = "./test-copy-no-overwrite-src.txt";
  const dest = "./test-copy-no-overwrite-dest.txt";

  try {
    // Create source and destination files
    await writeTextFile(src, "source content");
    await writeTextFile(dest, "destination content");

    // Try to copy without overwrite - should fail
    let didThrow = false;
    try {
      await copyFile(src, dest, { overwrite: false });
    } catch {
      didThrow = true;
    }
    expect(didThrow).toBe(true);

    // Verify destination was not overwritten
    const destContent = await readTextFile(dest);
    expect(destContent).toBe("destination content");
  } finally {
    // Cleanup
    await remove(src);
    await remove(dest);
  }
});

test("copyFile() with overwrite=true replaces existing file", async () => {
  const src = "./test-copy-overwrite-src.txt";
  const dest = "./test-copy-overwrite-dest.txt";

  try {
    // Create source and destination files with different content
    await writeTextFile(src, "new content");
    await writeTextFile(dest, "old content");

    // Copy with overwrite (default behavior)
    await copyFile(src, dest, { overwrite: true });

    // Verify destination was overwritten
    const destContent = await readTextFile(dest);
    expect(destContent).toBe("new content");
  } finally {
    // Cleanup
    await remove(src);
    await remove(dest);
  }
});

test("rename() renames a file", async () => {
  const oldPath = "./test-rename-old.txt";
  const newPath = "./test-rename-new.txt";

  try {
    // Create file
    await writeTextFile(oldPath, "content to rename");

    // Rename the file
    await rename(oldPath, newPath);

    // Verify old path no longer exists
    expect(await exists(oldPath)).toBe(false);

    // Verify new path exists with same content
    expect(await exists(newPath)).toBe(true);
    const content = await readTextFile(newPath);
    expect(content).toBe("content to rename");
  } finally {
    // Cleanup (only remove newPath since oldPath was renamed)
    if (await exists(oldPath)) await remove(oldPath);
    if (await exists(newPath)) await remove(newPath);
  }
});

test("rename() moves a file to different directory", async () => {
  const srcDir = "./test-rename-dir1";
  const destDir = "./test-rename-dir2";
  const oldPath = `${srcDir}/file.txt`;
  const newPath = `${destDir}/file.txt`;

  try {
    // Create directories and file
    await mkdir(srcDir, { recursive: true });
    await mkdir(destDir, { recursive: true });
    await writeTextFile(oldPath, "move me");

    // Move file to different directory
    await rename(oldPath, newPath);

    // Verify old location no longer exists
    expect(await exists(oldPath)).toBe(false);

    // Verify new location exists
    expect(await exists(newPath)).toBe(true);
    const content = await readTextFile(newPath);
    expect(content).toBe("move me");
  } finally {
    // Cleanup
    await remove(srcDir, { recursive: true });
    await remove(destDir, { recursive: true });
  }
});

test("rename() renames a directory", async () => {
  const oldDir = "./test-rename-dir-old-unique";
  const newDir = "./test-rename-dir-new-unique";

  try {
    // Clean up any existing directories first
    if (await exists(oldDir)) await remove(oldDir, { recursive: true });
    if (await exists(newDir)) await remove(newDir, { recursive: true });

    // Create directory with a file
    await mkdir(oldDir, { recursive: true });
    await writeTextFile(`${oldDir}/file.txt`, "inside dir");

    // Rename directory
    await rename(oldDir, newDir);

    // Verify old path no longer exists
    expect(await exists(oldDir)).toBe(false);

    // Verify new path exists with file inside
    expect(await exists(newDir)).toBe(true);
    expect(await exists(`${newDir}/file.txt`)).toBe(true);
  } finally {
    // Cleanup (only remove newDir since oldDir was renamed)
    if (await exists(oldDir)) await remove(oldDir, { recursive: true });
    if (await exists(newDir)) await remove(newDir, { recursive: true });
  }
});

test("exists() returns true for existing file", async () => {
  const testFile = "./test-exists-file.txt";

  try {
    await writeTextFile(testFile, "I exist");
    expect(await exists(testFile)).toBe(true);
  } finally {
    await remove(testFile);
  }
});

test("exists() returns true for existing directory", async () => {
  const testDir = "./test-exists-dir";

  try {
    await mkdir(testDir, { recursive: true });
    expect(await exists(testDir)).toBe(true);
  } finally {
    await remove(testDir, { recursive: true });
  }
});

test("exists() returns false for non-existent path", async () => {
  expect(await exists("./this-does-not-exist-12345.txt")).toBe(false);
  expect(await exists("./non-existent-dir-67890")).toBe(false);
});

test("listDir() on empty directory returns empty array", async () => {
  const testDir = "./test-empty-dir";

  try {
    await mkdir(testDir, { recursive: true });
    const entries = await listDir(testDir);
    expect(entries).toEqual([]);
  } finally {
    await remove(testDir, { recursive: true });
  }
});
