const mongoose = require("mongoose");

const attentionReportSchema = new mongoose.Schema(
  {
    meeting: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Meeting",
      required: true,
    },
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    logs: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        score: {
          type: Number,
          required: true,
        },
      },
    ],
    averageScore: {
      type: Number,
      default: 0,
    },
    totalEntries: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to ensure uniqueness of student + meeting report
attentionReportSchema.index({ meeting: 1, student: 1 }, { unique: true });

module.exports = mongoose.model("AttentionReport", attentionReportSchema);
