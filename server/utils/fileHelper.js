import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import os from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

const FILE_CATEGORIES = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.svg', '.webp', '.ico', '.tiff', '.tif'],
  video: ['.mp4', '.avi', '.mkv', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp'],
  audio: ['.mp3', '.wav', '.flac', '.aac', '.ogg', '.wma', '.m4a', '.opus'],
  document: ['.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.rtf', '.odt', '.csv'],
  code: ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.html', '.css', '.json', '.xml', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.sql', '.md', '.yml', '.yaml', '.sh', '.bat'],
  archive: ['.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.xz', '.iso'],
  executable: ['.exe', '.msi', '.app', '.dmg', '.deb', '.rpm'],
};

export function getFileCategory(filename) {
  const ext = path.extname(filename).toLowerCase();
  for (const [category, extensions] of Object.entries(FILE_CATEGORIES)) {
    if (extensions.includes(ext)) return category;
  }
  return 'other';
}

export function formatBytes(bytes) {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export async function getFileInfo(filePath) {
  try {
    const stats = await fs.stat(filePath);
    const name = path.basename(filePath);
    return {
      name,
      path: filePath,
      isDirectory: stats.isDirectory(),
      size: stats.size,
      sizeFormatted: formatBytes(stats.size),
      created: stats.birthtime,
      modified: stats.mtime,
      accessed: stats.atime,
      extension: stats.isDirectory() ? '' : path.extname(name).toLowerCase(),
      category: stats.isDirectory() ? 'folder' : getFileCategory(name),
    };
  } catch (err) {
    return null;
  }
}

export async function listDirectory(dirPath) {
  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const stats = await fs.stat(fullPath);
        files.push({
          name: entry.name,
          path: fullPath,
          isDirectory: entry.isDirectory(),
          size: stats.size,
          sizeFormatted: formatBytes(stats.size),
          created: stats.birthtime,
          modified: stats.mtime,
          extension: entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase(),
          category: entry.isDirectory() ? 'folder' : getFileCategory(entry.name),
        });
      } catch {
        // Skip files we can't access
      }
    }

    // Sort: folders first, then by name
    files.sort((a, b) => {
      if (a.isDirectory && !b.isDirectory) return -1;
      if (!a.isDirectory && b.isDirectory) return 1;
      return a.name.localeCompare(b.name, undefined, { sensitivity: 'base' });
    });

    return files;
  } catch (err) {
    throw new Error(`Cannot read directory: ${err.message}`);
  }
}

export async function getWindowsDrives() {
  try {
    const { stdout } = await execAsync('wmic logicaldisk get caption,freespace,size,volumename /format:csv', {
      windowsHide: true,
    });

    const lines = stdout.trim().split('\n').filter(l => l.trim());
    const drives = [];

    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].trim().split(',');
      if (parts.length >= 4) {
        const letter = parts[1];
        const freeSpace = parseInt(parts[2]) || 0;
        const totalSize = parseInt(parts[3]) || 0;
        const volumeName = parts[4] || '';

        if (letter && totalSize > 0) {
          drives.push({
            letter: letter,
            path: letter + '\\',
            name: volumeName || `Local Disk (${letter})`,
            totalSize,
            freeSpace,
            usedSpace: totalSize - freeSpace,
            totalFormatted: formatBytes(totalSize),
            freeFormatted: formatBytes(freeSpace),
            usedFormatted: formatBytes(totalSize - freeSpace),
            usagePercent: Math.round(((totalSize - freeSpace) / totalSize) * 100),
          });
        }
      }
    }

    return drives;
  } catch {
    // Fallback: just check common drive letters
    const drives = [];
    for (const letter of ['C', 'D', 'E', 'F', 'G']) {
      const drivePath = `${letter}:\\`;
      try {
        await fs.access(drivePath);
        drives.push({
          letter: `${letter}:`,
          path: drivePath,
          name: `Local Disk (${letter}:)`,
          totalSize: 0,
          freeSpace: 0,
          usedSpace: 0,
          totalFormatted: 'N/A',
          freeFormatted: 'N/A',
          usedFormatted: 'N/A',
          usagePercent: 0,
        });
      } catch { }
    }
    return drives;
  }
}

export async function calculateDirectoryStats(dirPath, maxDepth = 2, currentDepth = 0) {
  const stats = {
    totalFiles: 0,
    totalFolders: 0,
    totalSize: 0,
    categories: {
      image: { count: 0, size: 0 },
      video: { count: 0, size: 0 },
      audio: { count: 0, size: 0 },
      document: { count: 0, size: 0 },
      code: { count: 0, size: 0 },
      archive: { count: 0, size: 0 },
      executable: { count: 0, size: 0 },
      other: { count: 0, size: 0 },
    },
  };

  if (currentDepth > maxDepth) return stats;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        if (entry.isDirectory()) {
          stats.totalFolders++;
          if (currentDepth < maxDepth) {
            const subStats = await calculateDirectoryStats(fullPath, maxDepth, currentDepth + 1);
            stats.totalFiles += subStats.totalFiles;
            stats.totalFolders += subStats.totalFolders;
            stats.totalSize += subStats.totalSize;
            for (const cat of Object.keys(stats.categories)) {
              stats.categories[cat].count += subStats.categories[cat].count;
              stats.categories[cat].size += subStats.categories[cat].size;
            }
          }
        } else {
          const fileStat = await fs.stat(fullPath);
          const category = getFileCategory(entry.name);
          stats.totalFiles++;
          stats.totalSize += fileStat.size;
          stats.categories[category].count += fileStat.size > 0 ? 1 : 0;
          stats.categories[category].size += fileStat.size;
        }
      } catch {
        // Skip inaccessible
      }
    }
  } catch {
    // Skip inaccessible directories
  }

  return stats;
}

export async function searchFiles(dirPath, query, maxResults = 50, maxDepth = 4, currentDepth = 0) {
  const results = [];
  if (currentDepth > maxDepth || results.length >= maxResults) return results;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      if (results.length >= maxResults) break;
      const fullPath = path.join(dirPath, entry.name);

      if (entry.name.toLowerCase().includes(query.toLowerCase())) {
        try {
          const fileStat = await fs.stat(fullPath);
          results.push({
            name: entry.name,
            path: fullPath,
            isDirectory: entry.isDirectory(),
            size: fileStat.size,
            sizeFormatted: formatBytes(fileStat.size),
            modified: fileStat.mtime,
            extension: entry.isDirectory() ? '' : path.extname(entry.name).toLowerCase(),
            category: entry.isDirectory() ? 'folder' : getFileCategory(entry.name),
          });
        } catch { }
      }

      if (entry.isDirectory() && currentDepth < maxDepth) {
        try {
          const subResults = await searchFiles(fullPath, query, maxResults - results.length, maxDepth, currentDepth + 1);
          results.push(...subResults);
        } catch { }
      }
    }
  } catch { }

  return results.slice(0, maxResults);
}

export async function findRecentFiles(dirPath, maxResults = 50, maxDepth = 3, currentDepth = 0) {
  const files = [];
  if (currentDepth > maxDepth) return files;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const fileStat = await fs.stat(fullPath);
        if (!entry.isDirectory()) {
          files.push({
            name: entry.name,
            path: fullPath,
            isDirectory: false,
            size: fileStat.size,
            sizeFormatted: formatBytes(fileStat.size),
            modified: fileStat.mtime,
            created: fileStat.birthtime,
            extension: path.extname(entry.name).toLowerCase(),
            category: getFileCategory(entry.name),
          });
        } else if (currentDepth < maxDepth) {
          const subFiles = await findRecentFiles(fullPath, maxResults, maxDepth, currentDepth + 1);
          files.push(...subFiles);
        }
      } catch { }
    }
  } catch { }

  files.sort((a, b) => new Date(b.modified) - new Date(a.modified));
  return files.slice(0, maxResults);
}

export async function findLargeFiles(dirPath, minSizeMB = 100, maxResults = 50, maxDepth = 4, currentDepth = 0) {
  const files = [];
  const minSize = minSizeMB * 1024 * 1024;
  if (currentDepth > maxDepth) return files;

  try {
    const entries = await fs.readdir(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        const fileStat = await fs.stat(fullPath);
        if (!entry.isDirectory() && fileStat.size >= minSize) {
          files.push({
            name: entry.name,
            path: fullPath,
            isDirectory: false,
            size: fileStat.size,
            sizeFormatted: formatBytes(fileStat.size),
            modified: fileStat.mtime,
            extension: path.extname(entry.name).toLowerCase(),
            category: getFileCategory(entry.name),
          });
        } else if (entry.isDirectory() && currentDepth < maxDepth) {
          const subFiles = await findLargeFiles(fullPath, minSizeMB, maxResults, maxDepth, currentDepth + 1);
          files.push(...subFiles);
        }
      } catch { }
    }
  } catch { }

  files.sort((a, b) => b.size - a.size);
  return files.slice(0, maxResults);
}

export async function findDuplicates(dirPath, maxDepth = 3, currentDepth = 0) {
  const fileMap = new Map(); // key: "name|size" → array of paths

  async function scan(dir, depth) {
    if (depth > maxDepth) return;
    try {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        try {
          if (entry.isDirectory()) {
            await scan(fullPath, depth + 1);
          } else {
            const stats = await fs.stat(fullPath);
            const key = `${entry.name.toLowerCase()}|${stats.size}`;
            if (!fileMap.has(key)) {
              fileMap.set(key, []);
            }
            fileMap.get(key).push({
              name: entry.name,
              path: fullPath,
              size: stats.size,
              sizeFormatted: formatBytes(stats.size),
              modified: stats.mtime,
              extension: path.extname(entry.name).toLowerCase(),
              category: getFileCategory(entry.name),
            });
          }
        } catch { }
      }
    } catch { }
  }

  await scan(dirPath, currentDepth);

  const duplicates = [];
  for (const [key, files] of fileMap) {
    if (files.length > 1) {
      duplicates.push({
        key,
        name: files[0].name,
        size: files[0].size,
        sizeFormatted: files[0].sizeFormatted,
        count: files.length,
        files,
      });
    }
  }

  duplicates.sort((a, b) => (b.size * b.count) - (a.size * a.count));
  return duplicates.slice(0, 50);
}

// Favorites stored in a JSON file
const FAVORITES_PATH = path.join(os.homedir(), '.filevault_favorites.json');

export async function getFavorites() {
  try {
    const data = await fs.readFile(FAVORITES_PATH, 'utf-8');
    return JSON.parse(data);
  } catch {
    return [];
  }
}

export async function addFavorite(filePath) {
  const favorites = await getFavorites();
  if (favorites.find(f => f.path === filePath)) return favorites;
  const info = await getFileInfo(filePath);
  if (info) {
    favorites.push({ ...info, favoritedAt: new Date().toISOString() });
    await fs.writeFile(FAVORITES_PATH, JSON.stringify(favorites, null, 2));
  }
  return favorites;
}

export async function removeFavorite(filePath) {
  let favorites = await getFavorites();
  favorites = favorites.filter(f => f.path !== filePath);
  await fs.writeFile(FAVORITES_PATH, JSON.stringify(favorites, null, 2));
  return favorites;
}

export function isTextFile(ext) {
  const textExts = ['.txt', '.md', '.json', '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c', '.cs', '.html', '.css', '.xml', '.php', '.rb', '.go', '.rs', '.swift', '.kt', '.sql', '.yml', '.yaml', '.sh', '.bat', '.ini', '.cfg', '.conf', '.log', '.env', '.gitignore', '.csv'];
  return textExts.includes(ext.toLowerCase());
}

export function isImageFile(ext) {
  return FILE_CATEGORIES.image.includes(ext.toLowerCase());
}
