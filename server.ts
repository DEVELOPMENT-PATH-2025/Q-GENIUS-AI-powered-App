import express from "express";
import { createServer } from "http";
import { Server } from "socket.io";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  const PORT = 3000;

  // Mock real-time stats generator
  let stats = {
    totalPapers: 1377,
    approved: 944,
    pending: 272,
    rejected: 161,
    topTopics: [
      { name: 'Data Structures', count: 482 },
      { name: 'Algorithms', count: 412 },
      { name: 'Database Systems', count: 345 },
      { name: 'Operating Systems', count: 308 },
      { name: 'Computer Networks', count: 224 },
    ],
    difficultyDistribution: [
      { name: 'Easy', value: 420 },
      { name: 'Medium', value: 650 },
      { name: 'Hard', value: 307 },
    ]
  };

  let activities: any[] = [
    { id: 1, user: 'Dr. Sarah Chen', action: 'generated a paper', topic: 'Data Structures', time: '2 mins ago', type: 'generation' },
    { id: 2, user: 'Admin Mike', action: 'approved a paper', topic: 'Algorithms', time: '5 mins ago', type: 'approval' },
    { id: 3, user: 'Prof. James Wilson', action: 'uploaded a syllabus', topic: 'Cloud Computing', time: '12 mins ago', type: 'upload' },
  ];

  const users = ['Dr. Sarah Chen', 'Prof. James Wilson', 'Dr. Robert Fox', 'Mike Admin', 'Prof. Elena Rodriguez', 'Dr. Amit Shah'];
  const topics = ['Data Structures', 'Algorithms', 'Database Systems', 'Operating Systems', 'Computer Networks', 'Machine Learning', 'Cybersecurity'];
  const actions = [
    { text: 'generated a paper', type: 'generation' },
    { text: 'approved a paper', type: 'approval' },
    { text: 'rejected a paper', type: 'rejection' },
    { text: 'uploaded a syllabus', type: 'upload' }
  ];

  // Simulate real-time updates
  setInterval(() => {
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const randomUser = users[Math.floor(Math.random() * users.length)];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];

    // Update stats based on action
    if (randomAction.type === 'generation') {
      stats.totalPapers += 1;
      stats.pending += 1;
      // Update topic count
      const topicObj = stats.topTopics.find(t => t.name === randomTopic);
      if (topicObj) {
        topicObj.count += 1;
      } else if (stats.topTopics.length < 7) {
        stats.topTopics.push({ name: randomTopic, count: 1 });
      }
    } else if (randomAction.type === 'approval') {
      if (stats.pending > 0) {
        stats.pending -= 1;
        stats.approved += 1;
      }
    } else if (randomAction.type === 'rejection') {
      if (stats.pending > 0) {
        stats.pending -= 1;
        stats.rejected += 1;
      }
    }

    // Add to activity log
    const newActivity = {
      id: Date.now(),
      user: randomUser,
      action: randomAction.text,
      topic: randomTopic,
      time: 'Just now',
      type: randomAction.type
    };

    activities = [newActivity, ...activities.slice(0, 9)];

    io.emit("stats_update", { stats, activities });
  }, 5000);

  io.on("connection", (socket) => {
    console.log("Client connected:", socket.id);
    // Send initial stats
    socket.emit("stats_update", { stats, activities });

    socket.on("disconnect", () => {
      console.log("Client disconnected:", socket.id);
    });
  });

  // API routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
