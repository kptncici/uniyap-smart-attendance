// build-tailwind.cjs
const { execSync } = require("child_process");
const path = require("path");

// Path langsung ke binary tailwind di node_modules
const tailwindPath = path.resolve("node_modules", ".bin", "tailwindcss");

// Jalankan perintah build
execSync(
  `"${tailwindPath}" -i ./public/css/input.css -o ./public/css/output.css --watch`,
  { stdio: "inherit", shell: true }
);
