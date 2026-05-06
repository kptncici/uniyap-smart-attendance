// ===============================
// 🧩 Middleware: Verifikasi Token JWT
// ===============================
import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  // Jika tidak ada token
  if (!token) {
    console.log(`🚫 [verifyToken] Tidak ada token pada ${req.method} ${req.originalUrl}`);

    // Kalau akses GET halaman utama → redirect login
    if (req.method === "GET") {
      return res.redirect("/auth/login-admin?expired=true");
    }

    // Kalau POST (biasanya dari form dashboard)
    // Biarkan lanjut tapi beri user=null agar tidak error
    req.user = null;
    return next();
  }

  try {
    // ✅ Verifikasi JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log(`✅ [verifyToken] Token valid → Role: ${decoded.role}, ID: ${decoded.id}`);

    // Auto-refresh token jika hampir expired (opsional)
    const now = Math.floor(Date.now() / 1000);
    if (decoded.exp - now < 15 * 60) { // kurang dari 15 menit
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.cookie("token", newToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none",
        maxAge: 2 * 60 * 60 * 1000,
      });
      console.log("🔄 [verifyToken] Token otomatis diperpanjang");
    }

    return next();
  } catch (err) {
    console.warn(`⚠️ [verifyToken] Token invalid (${err.name}): ${err.message}`);

    // Kalau token invalid / expired
    if (req.method === "GET") {
      return res.redirect("/auth/login-admin?expired=true");
    } else {
      // biar form gak rusak, lanjutkan request tapi clear user
      req.user = null;
      return next();
    }
  }
};
