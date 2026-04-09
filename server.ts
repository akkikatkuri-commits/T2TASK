import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import cors from 'cors';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const JWT_SECRET = process.env.JWT_SECRET || 'taskflow-pro-secret-key-123';
const PORT = 3000;

const db = new Database('taskflow.db');

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'todo',
    priority TEXT DEFAULT 'medium',
    category TEXT,
    due_date DATETIME,
    assigned_to INTEGER,
    created_by INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (assigned_to) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS comments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS activity_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id INTEGER,
    user_id INTEGER NOT NULL,
    action TEXT NOT NULL,
    details TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'approved'
    invited_by INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (invited_by) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: '*',
    },
  });

  app.use(cors());
  app.use(express.json());

  // Middleware to verify JWT
  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  // Auth Routes
  app.post('/api/auth/signup', async (req, res) => {
    const { email, password, name } = req.body;
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      const stmt = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)');
      const result = stmt.run(email, hashedPassword, name);
      const user = { id: result.lastInsertRowid, email, name, role: 'user' };
      const token = jwt.sign(user, JWT_SECRET);
      res.json({ token, user });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    let user: any = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
    
    if (!user) {
      try {
        // Auto-signup for "random email/password" request to lower friction
        const hashedPassword = await bcrypt.hash(password, 10);
        const name = email.split('@')[0].charAt(0).toUpperCase() + email.split('@')[0].slice(1);
        const result = db.prepare('INSERT INTO users (email, password, name) VALUES (?, ?, ?)').run(email, hashedPassword, name);
        user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      } catch (error: any) {
        return res.status(400).json({ error: 'Could not create user automatically' });
      }
    } else if (!(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const { password: _, ...userWithoutPassword } = user;
    const token = jwt.sign(userWithoutPassword, JWT_SECRET);
    res.json({ token, user: userWithoutPassword });
  });

  app.patch('/api/users/profile', authenticateToken, (req: any, res) => {
    const { name, avatar_url } = req.body;
    const userId = req.user.id;

    const stmt = db.prepare(`
      UPDATE users 
      SET name = COALESCE(?, name),
          avatar_url = COALESCE(?, avatar_url)
      WHERE id = ?
    `);
    stmt.run(name, avatar_url, userId);
    
    const updatedUser = db.prepare('SELECT id, name, email, role, avatar_url FROM users WHERE id = ?').get(userId);
    res.json(updatedUser);
  });

  // Task Routes
  app.get('/api/tasks', authenticateToken, (req, res) => {
    const tasks = db.prepare(`
      SELECT tasks.*, users.name as assigned_to_name 
      FROM tasks 
      LEFT JOIN users ON tasks.assigned_to = users.id
      ORDER BY created_at DESC
    `).all();
    res.json(tasks);
  });

  app.post('/api/tasks', authenticateToken, (req: any, res) => {
    const { title, description, status, priority, category, due_date, assigned_to } = req.body;
    const stmt = db.prepare(`
      INSERT INTO tasks (title, description, status, priority, category, due_date, assigned_to, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const result = stmt.run(title, description, status || 'todo', priority || 'medium', category, due_date, assigned_to, req.user.id);
    const newTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
    
    io.emit('task:created', newTask);
    res.json(newTask);
  });

  app.patch('/api/tasks/:id', authenticateToken, (req: any, res) => {
    const { title, description, status, priority, category, due_date, assigned_to } = req.body;
    const id = req.params.id;
    
    const stmt = db.prepare(`
      UPDATE tasks 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          category = COALESCE(?, category),
          due_date = COALESCE(?, due_date),
          assigned_to = COALESCE(?, assigned_to),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(title, description, status, priority, category, due_date, assigned_to, id);
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    
    io.emit('task:updated', updatedTask);
    res.json(updatedTask);
  });

  app.delete('/api/tasks/completed', authenticateToken, (req, res) => {
    db.prepare("DELETE FROM tasks WHERE status = 'done'").run();
    io.emit('tasks:updated');
    res.sendStatus(204);
  });

  app.post('/api/tasks/bulk-delete', authenticateToken, (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs must be an array' });
    
    const placeholders = ids.map(() => '?').join(',');
    db.prepare(`DELETE FROM tasks WHERE id IN (${placeholders})`).run(...ids);
    io.emit('tasks:updated');
    res.sendStatus(204);
  });

  app.post('/api/tasks/bulk-update', authenticateToken, (req, res) => {
    const { ids, data } = req.body;
    if (!Array.isArray(ids)) return res.status(400).json({ error: 'IDs must be an array' });
    
    const fields = Object.keys(data);
    const setClause = fields.map(f => `${f} = ?`).join(', ');
    const values = Object.values(data);
    const placeholders = ids.map(() => '?').join(',');
    
    db.prepare(`UPDATE tasks SET ${setClause} WHERE id IN (${placeholders})`).run(...values, ...ids);
    io.emit('tasks:updated');
    res.sendStatus(204);
  });

  app.delete('/api/tasks', authenticateToken, (req, res) => {
    db.prepare('DELETE FROM tasks').run();
    io.emit('tasks:updated'); // Notify clients to refresh
    res.sendStatus(204);
  });

  app.delete('/api/tasks/:id', authenticateToken, (req, res) => {
    const id = req.params.id;
    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    io.emit('task:deleted', id);
    res.sendStatus(204);
  });

  // Users Route
  app.get('/api/users', authenticateToken, (req, res) => {
    const users = db.prepare('SELECT id, name, email, role, avatar_url FROM users').all();
    res.json(users);
  });

  // Team Routes
  app.get('/api/team', authenticateToken, (req, res) => {
    const members = db.prepare(`
      SELECT users.id, users.name, users.email, users.role, users.avatar_url, team_members.status, team_members.created_at
      FROM team_members
      JOIN users ON team_members.user_id = users.id
      WHERE team_members.status = 'approved'
    `).all();
    res.json(members);
  });

  app.get('/api/team/pending', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const pending = db.prepare(`
      SELECT users.id, users.name, users.email, users.role, users.avatar_url, team_members.status, team_members.created_at
      FROM team_members
      JOIN users ON team_members.user_id = users.id
      WHERE team_members.status = 'pending'
    `).all();
    res.json(pending);
  });

  app.post('/api/team/invite', authenticateToken, (req: any, res) => {
    const { userId } = req.body;
    try {
      db.prepare('INSERT INTO team_members (user_id, invited_by, status) VALUES (?, ?, ?)')
        .run(userId, req.user.id, req.user.role === 'admin' ? 'approved' : 'pending');
      io.emit('team:updated');
      res.sendStatus(201);
    } catch (error) {
      res.status(400).json({ error: 'User already in team or invited' });
    }
  });

  app.post('/api/team/approve', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    const { userId } = req.body;
    db.prepare("UPDATE team_members SET status = 'approved' WHERE user_id = ?").run(userId);
    io.emit('team:updated');
    res.sendStatus(200);
  });

  app.post('/api/team/leave', authenticateToken, (req: any, res) => {
    db.prepare('DELETE FROM team_members WHERE user_id = ?').run(req.user.id);
    io.emit('team:updated');
    res.sendStatus(200);
  });

  app.delete('/api/team/:userId', authenticateToken, (req: any, res) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Admin only' });
    db.prepare('DELETE FROM team_members WHERE user_id = ?').run(req.params.userId);
    io.emit('team:updated');
    res.sendStatus(200);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  io.on('connection', (socket) => {
    console.log('a user connected');
    socket.on('disconnect', () => {
      console.log('user disconnected');
    });
  });

  httpServer.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
