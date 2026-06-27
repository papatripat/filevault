import { Router } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';
import {
  listDirectory,
  getWindowsDrives,
  calculateDirectoryStats,
  searchFiles,
  findRecentFiles,
  findLargeFiles,
  findDuplicates,
  getFavorites,
  addFavorite,
  removeFavorite,
  getFileInfo,
  isTextFile,
  isImageFile,
} from '../utils/fileHelper.js';

const execAsync = promisify(exec);
const router = Router();

// GET /api/files/drives — list available drives
router.get('/drives', async (req, res) => {
  try {
    const drives = await getWindowsDrives();
    res.json({ success: true, data: drives });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/list?path=... — list files in directory
router.get('/list', async (req, res) => {
  try {
    const dirPath = req.query.path || 'C:\\';
    const files = await listDirectory(dirPath);
    const parentPath = path.dirname(dirPath);
    res.json({
      success: true,
      data: {
        currentPath: dirPath,
        parentPath: parentPath !== dirPath ? parentPath : null,
        files,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/stats?path=... — get directory stats
router.get('/stats', async (req, res) => {
  try {
    const dirPath = req.query.path;
    const drives = await getWindowsDrives();

    let stats;
    if (dirPath) {
      stats = await calculateDirectoryStats(dirPath, 2);
    } else {
      // Aggregate stats from user profile folders
      const userHome = process.env.USERPROFILE || process.env.HOME;
      const scanDirs = ['Desktop', 'Documents', 'Downloads', 'Pictures', 'Videos', 'Music'];
      stats = {
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

      for (const dir of scanDirs) {
        const fullPath = path.join(userHome, dir);
        try {
          await fs.access(fullPath);
          const dirStats = await calculateDirectoryStats(fullPath, 2);
          stats.totalFiles += dirStats.totalFiles;
          stats.totalFolders += dirStats.totalFolders;
          stats.totalSize += dirStats.totalSize;
          for (const cat of Object.keys(stats.categories)) {
            stats.categories[cat].count += dirStats.categories[cat].count;
            stats.categories[cat].size += dirStats.categories[cat].size;
          }
        } catch { }
      }
    }

    res.json({ success: true, data: { stats, drives } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/search?query=...&path=... — search files
router.get('/search', async (req, res) => {
  try {
    const { query, path: searchPath } = req.query;
    if (!query) return res.status(400).json({ success: false, error: 'Query required' });

    const basePath = searchPath || process.env.USERPROFILE || 'C:\\';
    const results = await searchFiles(basePath, query, 50, 4);
    res.json({ success: true, data: results });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/recent?path=... — recent files
router.get('/recent', async (req, res) => {
  try {
    const basePath = req.query.path || process.env.USERPROFILE || 'C:\\';
    const files = await findRecentFiles(basePath, 60, 3);
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/large?minSize=100&path=... — find large files
router.get('/large', async (req, res) => {
  try {
    const basePath = req.query.path || process.env.USERPROFILE || 'C:\\';
    const minSizeMB = parseInt(req.query.minSize) || 100;
    const files = await findLargeFiles(basePath, minSizeMB, 50, 4);
    res.json({ success: true, data: files });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/duplicates?path=... — find duplicate files
router.get('/duplicates', async (req, res) => {
  try {
    const basePath = req.query.path || process.env.USERPROFILE || 'C:\\';
    const duplicates = await findDuplicates(basePath, 3);
    res.json({ success: true, data: duplicates });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/favorites — get favorites
router.get('/favorites', async (req, res) => {
  try {
    const favorites = await getFavorites();
    res.json({ success: true, data: favorites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/files/favorites — add favorite
router.post('/favorites', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ success: false, error: 'Path required' });
    const favorites = await addFavorite(filePath);
    res.json({ success: true, data: favorites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/files/favorites — remove favorite
router.delete('/favorites', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ success: false, error: 'Path required' });
    const favorites = await removeFavorite(filePath);
    res.json({ success: true, data: favorites });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT /api/files/rename — rename file/folder
router.put('/rename', async (req, res) => {
  try {
    const { oldPath, newName } = req.body;
    if (!oldPath || !newName) return res.status(400).json({ success: false, error: 'oldPath and newName required' });
    const dir = path.dirname(oldPath);
    const newPath = path.join(dir, newName);
    await fs.rename(oldPath, newPath);
    res.json({ success: true, data: { oldPath, newPath } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE /api/files/delete — delete file/folder
router.delete('/delete', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ success: false, error: 'Path required' });

    // Try to use recycle bin on Windows
    try {
      await execAsync(`powershell -Command "Add-Type -AssemblyName Microsoft.VisualBasic; [Microsoft.VisualBasic.FileIO.FileSystem]::DeleteFile('${filePath.replace(/'/g, "''")}', 'OnlyErrorDialogs', 'SendToRecycleBin')"`, { windowsHide: true });
    } catch {
      // Fallback to regular delete
      const stats = await fs.stat(filePath);
      if (stats.isDirectory()) {
        await fs.rm(filePath, { recursive: true });
      } else {
        await fs.unlink(filePath);
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/files/copy — copy file
router.post('/copy', async (req, res) => {
  try {
    const { source, destination } = req.body;
    if (!source || !destination) return res.status(400).json({ success: false, error: 'source and destination required' });

    const destPath = path.join(destination, path.basename(source));
    const stats = await fs.stat(source);

    if (stats.isDirectory()) {
      await fs.cp(source, destPath, { recursive: true });
    } else {
      await fs.copyFile(source, destPath);
    }

    res.json({ success: true, data: { source, destination: destPath } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/files/move — move file
router.post('/move', async (req, res) => {
  try {
    const { source, destination } = req.body;
    if (!source || !destination) return res.status(400).json({ success: false, error: 'source and destination required' });
    const destPath = path.join(destination, path.basename(source));
    await fs.rename(source, destPath);
    res.json({ success: true, data: { source, destination: destPath } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET /api/files/preview?path=... — get file preview
router.get('/preview', async (req, res) => {
  try {
    const filePath = req.query.path;
    if (!filePath) return res.status(400).json({ success: false, error: 'Path required' });

    const info = await getFileInfo(filePath);
    if (!info) return res.status(404).json({ success: false, error: 'File not found' });

    const ext = path.extname(filePath).toLowerCase();

    if (isImageFile(ext)) {
      // Serve image directly
      res.sendFile(filePath);
      return;
    }

    if (isTextFile(ext)) {
      const content = await fs.readFile(filePath, 'utf-8');
      const preview = content.substring(0, 10000); // Max 10KB preview
      res.json({ success: true, data: { type: 'text', content: preview, info } });
      return;
    }

    res.json({ success: true, data: { type: 'info', info } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/files/open — open file with default program
router.post('/open', async (req, res) => {
  try {
    const { path: filePath } = req.body;
    if (!filePath) return res.status(400).json({ success: false, error: 'Path required' });
    await execAsync(`start "" "${filePath}"`, { windowsHide: true, shell: true });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST /api/files/create-folder — create new folder
router.post('/create-folder', async (req, res) => {
  try {
    const { path: dirPath, name } = req.body;
    if (!dirPath || !name) return res.status(400).json({ success: false, error: 'path and name required' });
    const fullPath = path.join(dirPath, name);
    await fs.mkdir(fullPath, { recursive: true });
    const info = await getFileInfo(fullPath);
    res.json({ success: true, data: info });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

export { router as fileRoutes };
