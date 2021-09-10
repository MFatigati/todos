const bcrypt = require("bcrypt");

bcrypt.hash("secret", 10, (_, hash) => console.log("secret:" + hash));
bcrypt.hash("letmein", 10, (_, hash) => console.log("letmein:" + hash));
