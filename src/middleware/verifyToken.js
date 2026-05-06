// ===============================
// 🧩 Middleware: Verify Token JWT
// ===============================
import jwt from "jsonwebtoken";

/**
 * Middleware untuk memverifikasi token JWT dari cookie.
 * Digunakan untuk memastikan hanya pengguna terautentikasi
 * yang bisa mengakses route admin/dosen/mahasiswa.
 */
export const verifyToken = (req, res, next) => {
  const token = req.cookies?.token;

  // 🟥 Tidak ada token
  if (!token) {
    console.log("🚫 [verifyToken] Tidak ada token dikirim di request:", req.originalUrl);
    req.user = null;
    return next();
  }

  try {
    // 🟩 Verifikasi JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    console.log(`✅ [verifyToken] Token valid untuk role: ${decoded.role}, userID: ${decoded.id}`);

    // Auto perpanjang masa aktif (opsional, biar gak logout cepat)
    const now = Math.floor(Date.now() / 1000);
    const exp = decoded.exp;
    if (exp - now < 15 * 60) { // jika sisa waktu < 15 menit
      const newToken = jwt.sign(
        { id: decoded.id, email: decoded.email, role: decoded.role },
        process.env.JWT_SECRET,
        { expiresIn: "2h" }
      );
      res.cookie("token", newToken, {
        httpOnly: true,
        secure: false,
        sameSite: "none", // biar cookie dikirim di semua POST form
        maxAge: 2 * 60 * 60 * 1000,
      });
      console.log("🔄 [verifyToken] Token otomatis diperpanjang");
    }

  } catch (err) {
    // 🟨 Token tidak valid atau sudah kedaluwarsa
    console.warn("⚠️ [verifyToken] Token tidak valid atau expired:", err.message);
    req.user = null;

    // Kalau token expired, hapus cookie agar tidak loop redirect
    if (err.name === "TokenExpiredError") {
      res.clearCookie("token");
      return res.redirect("/auth/login-admin?expired=true");
    }
  }

  next();
};
