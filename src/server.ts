import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import path from 'path';
import cors from 'cors';
import multer from 'multer';
import { SessionManager } from './services/sessionManager';
import { ConversationManager } from './services/conversationManager';
import { ExportService, ExportFormat } from './services/exportService';
import { ImportService, ImportFormat } from './services/importService';
import { ShippingCalculator } from './utils/shippingCalculator';
import { Package } from './models/types';

const app = express();
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: process.env.NODE_ENV === 'production' ? false : ['http://localhost:3000', 'http://localhost:5000'],
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
// Serve static files from public directory (works in both dev and production)
const publicPath = path.join(__dirname, process.env.NODE_ENV === 'production' ? 'public' : '../public');
app.use(express.static(publicPath));

// Multer configuration for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  },
    fileFilter: (req, file, cb) => {
      // Accept common CSV/JSON/PDF mime types and fallback to extension check
      const allowedTypes = ['text/csv', 'application/csv', 'application/json', 'application/pdf', 'text/plain', 'application/octet-stream', 'application/vnd.ms-excel'];
      const allowedExtensions = ['.csv', '.json', '.pdf', '.txt'];

      const ext = path.extname(file.originalname || '').toLowerCase();
      const mimeType = (file.mimetype || '').toLowerCase();

      if (allowedTypes.includes(mimeType) || allowedExtensions.includes(ext) || mimeType.includes('csv') || mimeType.includes('pdf') || mimeType.includes('json')) {
        cb(null, true);
      } else {
        cb(new Error('Invalid file type. Only CSV, JSON, and PDF files are allowed.'));
      }
    }
});

// Store active sessions
const activeSessions = new Map<string, { sessionManager: SessionManager; conversationManager: ConversationManager }>();

// Store incomplete packages temporarily
const incompletePackagesStore = new Map<string, { sessionId: string; incompletePackage: any }>();

// Socket.IO connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`);
  
  let sessionManager: SessionManager;
  let conversationManager: ConversationManager;

  // Initialize new session
  socket.on('init-session', (sessionId?: string) => {
    if (sessionId && activeSessions.has(sessionId)) {
      // Resume existing session
      const session = activeSessions.get(sessionId)!;
      sessionManager = session.sessionManager;
      conversationManager = session.conversationManager;
    } else {
      // Create new session
      sessionManager = new SessionManager();
      conversationManager = new ConversationManager(sessionManager);
      activeSessions.set(sessionManager.getSessionId(), { sessionManager, conversationManager });
    }

    // Send welcome message
    const welcome = conversationManager.getWelcomeMessage();
    socket.emit('bot-response', {
      ...welcome,
      sessionId: sessionManager.getSessionId()
    });
  });

  // Handle user messages
  socket.on('user-message', async (message: string) => {
    if (!conversationManager) {
      socket.emit('error', { message: 'Session not initialized' });
      return;
    }

    try {
      const response = await conversationManager.processInput(message);
      socket.emit('bot-response', response);
    } catch (error) {
      console.error('Error processing message:', error);
      socket.emit('error', { message: 'Failed to process message' });
    }
  });

  // Get session data
  socket.on('get-session-data', () => {
    if (!sessionManager) {
      socket.emit('error', { message: 'Session not initialized' });
      return;
    }

    const data = sessionManager.getSession();
    socket.emit('session-data', data);
  });

  // Export data
  socket.on('export-data', async (format: ExportFormat) => {
    if (!sessionManager) {
      socket.emit('error', { message: 'Session not initialized' });
      return;
    }

    try {
      // Normalize format coming from the client (client sends friendly values like 'json', 'csv', 'pdf', 'summary')
      const clientFormat: string = String(format || '').toLowerCase();

      const mapToEnum = (f: string): ExportFormat => {
        switch (f) {
          case 'json':
          case 'json_pretty':
          case 'json_compact':
            return ExportFormat.JSON_PRETTY;
          case 'csv':
            return ExportFormat.CSV;
          case 'summary':
            return ExportFormat.SUMMARY;
          case 'pdf':
            return ExportFormat.PDF;
          default:
            return ExportFormat.JSON_PRETTY;
        }
      };

      const enumFormat = mapToEnum(clientFormat);
      const exportService = new ExportService();
      const session = sessionManager.getSession();
      const exported = await exportService.exportSession(session, enumFormat);

      // Emit a normalized format back so the client can decide how to download
      const emitFormat = ((): string => {
        switch (enumFormat) {
          case ExportFormat.CSV:
            return 'csv';
          case ExportFormat.PDF:
            return 'pdf';
          case ExportFormat.SUMMARY:
            return 'summary';
          case ExportFormat.JSON_COMPACT:
          case ExportFormat.JSON_PRETTY:
          default:
            return 'json';
        }
      })();

      socket.emit('export-complete', { format: emitFormat, data: exported });
    } catch (error) {
      console.error('Export error:', error);
      socket.emit('error', { message: 'Failed to export data' });
    }
  });

  // Calculate shipping costs
  socket.on('calculate-costs', () => {
    if (!sessionManager) {
      socket.emit('error', { message: 'Session not initialized' });
      return;
    }

    const session = sessionManager.getSession();
    const costs = session.packages.map((pkg: Package) => ({
      packageId: pkg.id,
      cost: ShippingCalculator.calculateCost(pkg),
      breakdown: ShippingCalculator.getCostBreakdown(pkg)
    }));

    const totalCost = costs.reduce((sum: number, c: any) => sum + c.cost, 0);
    socket.emit('costs-calculated', { costs, totalCost });
  });

  // Save session
  socket.on('save-session', async () => {
    if (!sessionManager) {
      socket.emit('error', { message: 'Session not initialized' });
      return;
    }

    try {
      await sessionManager.saveSession();
      socket.emit('session-saved', { sessionId: sessionManager.getSessionId() });
    } catch (error) {
      console.error('Save error:', error);
      socket.emit('error', { message: 'Failed to save session' });
    }
  });

  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// REST API endpoints
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.get('/api/sessions/:sessionId', (req, res) => {
  const session = activeSessions.get(req.params.sessionId);
  if (!session) {
    return res.status(404).json({ error: 'Session not found' });
  }
  res.json(session.sessionManager.getSession());
});

// Import endpoint - upload and parse file
app.post('/api/import', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    let sessionId = req.body.sessionId;
    
    // Auto-create session if missing or invalid
    if (!sessionId || !activeSessions.has(sessionId)) {
      sessionId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const sessionManager = new SessionManager(sessionId);
      const conversationManager = new ConversationManager(sessionManager);
      activeSessions.set(sessionId, { sessionManager, conversationManager });
    }

    const session = activeSessions.get(sessionId)!;
    const importService = new ImportService();
    
    // Determine format from file extension
    const ext = path.extname(req.file.originalname).toLowerCase();
    let format: ImportFormat;
    
    if (ext === '.csv' || req.file.mimetype === 'text/csv') {
      format = ImportFormat.CSV;
    } else if (ext === '.json' || req.file.mimetype === 'application/json') {
      format = ImportFormat.JSON;
    } else if (ext === '.pdf' || req.file.mimetype === 'application/pdf') {
      format = ImportFormat.PDF;
    } else if (ext === '.txt' || req.file.mimetype === 'text/plain') {
      format = ImportFormat.TXT;
    } else {
      return res.status(400).json({ error: 'Unsupported file format. Supported: CSV, JSON, PDF, TXT' });
    }

    // Import the file
    const result = await importService.importFromFile(
      req.file.buffer,
      format,
      req.file.originalname
    );

    // Add successfully imported packages to session
    if (result.success && result.packages.length > 0) {
      const currentSession = session.sessionManager.getSession();
      result.packages.forEach(pkg => {
        currentSession.packages.push(pkg);
      });
      currentSession.metadata.totalPackages += result.packages.length;
      currentSession.metadata.completedPackages += result.packages.length;
    }

    // Store incomplete packages if any
    if (result.incompletePackages && result.incompletePackages.length > 0) {
      result.incompletePackages.forEach(incomplete => {
        incompletePackagesStore.set(incomplete.id, {
          sessionId,
          incompletePackage: incomplete
        });
      });
    }

    res.json({
      ...result,
      sessionId // Include sessionId in response for completing packages later
    });
  } catch (error) {
    console.error('Import error:', error);
    res.status(500).json({
      error: 'Failed to import file',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Download CSV template
app.get('/api/import/template', (req, res) => {
  const importService = new ImportService();
  const template = importService.generateCSVTemplate();
  
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename="package-import-template.csv"');
  res.send(template);
});

// Complete incomplete package
app.post('/api/import/complete', (req, res) => {
  const { sessionId, incompleteId, fieldValues } = req.body;

  if (!sessionId || !incompleteId || !fieldValues) {
    return res.status(400).json({ 
      success: false, 
      error: 'Missing sessionId, incompleteId or fieldValues' 
    });
  }

  try {
    const importService = new ImportService();
    const completedPackage = importService.completePackage(incompleteId, fieldValues);

    if (!completedPackage) {
      return res.status(404).json({ 
        success: false, 
        error: 'Package not found or could not be completed' 
      });
    }

    // Get session and add package
    const session = activeSessions.get(sessionId);
    if (session) {
      const sessionData = session.sessionManager.getSession();
      sessionData.packages.push(completedPackage);
      sessionData.metadata.totalPackages++;
      sessionData.metadata.completedPackages++;
    }

    // Remove from incomplete store
    incompletePackagesStore.delete(incompleteId);

    res.json({ 
      success: true, 
      package: completedPackage 
    });
  } catch (error) {
    console.error('Error completing package:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to complete package' 
    });
  }
});

// Serve React app for all other routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, process.env.NODE_ENV === 'production' ? 'public/index.html' : '../public/index.html');
  res.sendFile(indexPath);
});


// Start server
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                                                              ║
║         🚀  PACKAGE CHATBOT WEB SERVER  📦                   ║
║                                                              ║
║              Server running on port ${PORT}                     ║
║              http://localhost:${PORT}                            ║
║                                                              ║
╚══════════════════════════════════════════════════════════════╝
  `);
});

export default app;
