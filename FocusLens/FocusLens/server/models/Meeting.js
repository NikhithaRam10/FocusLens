const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },

    subject: {
      type: String,
      default: "",
    },

    description: {
      type: String,
      default: "",
    },

    scheduledTime: {
      type: String,
      default: "",
    },

    meetingCode: {
      type: String,
      required: true,
      unique: true,
    },

    meetingLink: {
      type: String,
      default: "",
    },

    status: {
      type: String,
      enum: ["Scheduled", "Active", "Completed"],
      default: "Scheduled",
    },

    joinRequests: [
      {
        student: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        name: {
          type: String,
          required: true,
        },
        email: {
          type: String,
          required: true,
        },
        status: {
          type: String,
          enum: ["pending", "approved", "rejected"],
          default: "pending",
        },
        requestedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Meeting", meetingSchema);