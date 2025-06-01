const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
require("dotenv").config();
const path = require("path");
const cookieParser = require('cookie-parser');
const http = require("http"); 
const { Server } = require("socket.io"); // ดึง Server class จาก socket.io
 
const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});
//  Middleware ผูก io เข้ากับ req
app.use((req, res, next) => {
  req.io = io;
  next();
});
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE","PATCH"],
    allowedHeaders: ["Content-Type"],
  })
);


app.use(bodyParser.json());
app.use(express.json()); 
app.use('/uploads/images', express.static(path.join(__dirname, 'uploads/images')));
app.use('/uploads/images/posts', express.static(path.join(__dirname, 'uploads/images/posts')));
app.use('/uploads/documents', express.static(path.join(__dirname, 'uploads/documents')));
app.use(cookieParser());
app.use('/uploads/images/slip', express.static(path.join(__dirname, 'uploads/images/slip')));

const registerRoute = require("./routers/register");
const loginRoute = require("./routers/login");
const usersRoute = require("./routers/users");
const logoutRoute = require("./routers/logout");
const fieldRoute = require("./routers/field");
const facilitiesRoutes = require("./routers/facilities");
const sportsTypesRoutes = require("./routers/sportsTypes");
const myfieldRoute = require("./routers/myfield");
const profile = require("./routers/profile");
const posts = require("./routers/posts");
const booking = require("./routers/booking");



app.get("/", (req, res) => {
  res.send("Welcome to the API");
});

app.use("/register", registerRoute);
app.use("/login", loginRoute);
app.use("/users", usersRoute);
app.use("/logout", logoutRoute);
app.use("/facilities", facilitiesRoutes);
app.use("/sports_types", sportsTypesRoutes);
app.use("/field", fieldRoute);
app.use("/myfield", myfieldRoute);
app.use("/profile", profile);
app.use("/posts", posts);
app.use("/booking",booking)
io.on("connection", (socket) => {
  console.log(" Client connected:", socket.id);

  socket.on("disconnect", () => {
    console.log(" Client disconnected:", socket.id);
  });
});

const port = 5000;
server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
