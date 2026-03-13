const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json());

// MongoDB connect
connectDB();

app.use("/api/user", require("./routes/UserRoutes"));
app.use("/api/clients", require("./routes/ClientRoutes"));
app.use("/api/employees", require("./routes/EmployeeRoutes"));
app.use("/api/projects", require("./routes/ProjectRoutes"));
app.use("/api/auth", require("./routes/authroutes"));
app.use("/api/upload", require("./routes/uploadRoutes"));

app.listen(process.env.PORT, () => {
  console.log("Server running on port", process.env.PORT);
});