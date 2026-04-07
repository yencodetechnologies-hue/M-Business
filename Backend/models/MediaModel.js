const mongoose = require("mongoose");

const MediaSchema = new mongoose.Schema(
  {
    url:       { type: String, required: true },
    public_id: { type: String, required: true },
    name:      { type: String, default: "untitled" },
    type:      { type: String, default: "image" },
    size:      { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Media", MediaSchema);
