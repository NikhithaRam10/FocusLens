const mongoose = require("mongoose");

mongoose.connect("mongodb+srv://ishwaryaketha_db_user:Ishwarya%40243@ishwarya.ixnfnim.mongodb.net/?retryWrites=true&w=majority&appName=Ishwarya")
  .then(() => {
    console.log("✅ Connected to MongoDB");
    process.exit(0);
  })
  .catch((err) => {
    console.error(err);
  });