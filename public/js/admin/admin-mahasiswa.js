// ===============================
// 🎓 Admin Mahasiswa JS (CSP-SAFE)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addStudentModal");
  const editModal = document.getElementById("editStudentModal");
  const searchInput = document.getElementById("searchInputStudent");
  const statusFilter = document.getElementById("statusFilterStudent");

  // 🔍 Filter tabel mahasiswa
  const filterTable = () => {
    const q = searchInput.value.toLowerCase().trim();
    const status = statusFilter.value;
    document.querySelectorAll(".student-row").forEach(row => {
      const nim = (row.dataset.nim || "").toLowerCase();
      const name = (row.dataset.name || "").toLowerCase();
      const kelas = (row.dataset.class || "").toLowerCase();
      const statusRow = row.dataset.status || "";
      const matchQ = !q || nim.includes(q) || name.includes(q) || kelas.includes(q);
      const matchStatus = status === "Semua" || statusRow === status;
      row.style.display = matchQ && matchStatus ? "" : "none";
    });
  };

  searchInput?.addEventListener("input", filterTable);
  statusFilter?.addEventListener("change", filterTable);

  // ➕ Tambah Mahasiswa
  document.querySelectorAll("[data-add-mahasiswa]").forEach(btn => {
    btn.addEventListener("click", () => addModal.classList.remove("hidden"));
  });
  document.querySelectorAll("[data-close-add-mahasiswa]").forEach(btn => {
    btn.addEventListener("click", () => addModal.classList.add("hidden"));
  });

  // ✏️ Edit Mahasiswa
  document.querySelectorAll("[data-edit-mahasiswa]").forEach(btn => {
    btn.addEventListener("click", () => {
      const { id, nim, name, kelas, status } = btn.dataset;
      editModal.classList.remove("hidden");
      document.getElementById("editStudentId").value = id;
      document.getElementById("editStudentNim").value = nim;
      document.getElementById("editStudentName").value = name;
      document.getElementById("editStudentClass").value = kelas;
      document.getElementById("editStudentStatus").value = status;
    });
  });
  document.querySelectorAll("[data-close-edit-mahasiswa]").forEach(btn => {
    btn.addEventListener("click", () => editModal.classList.add("hidden"));
  });

  // 🔁 Reset Password Mahasiswa
  document.querySelectorAll("[data-reset-mahasiswa]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("Reset password mahasiswa ini ke default 123456?")) {
        const id = btn.dataset.id;
        const res = await fetch("/dashboard/admin/student/reset", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `id=${encodeURIComponent(id)}`,
          credentials: "include"
        });
        if (res.ok) {
          alert("Password berhasil direset!");
          location.reload();
        } else {
          alert("Gagal reset password.");
        }
      }
    });
  });

  // 🗑️ Hapus Mahasiswa
  document.querySelectorAll("[data-delete-mahasiswa]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Yakin ingin menghapus mahasiswa ini?")) return;
      const id = btn.dataset.id;
      const res = await fetch("/dashboard/admin/student/delete", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${encodeURIComponent(id)}`,
        credentials: "include"
      });
      if (res.ok) {
        alert("Mahasiswa berhasil dihapus!");
        location.reload();
      } else {
        alert("Gagal menghapus mahasiswa.");
      }
    });
  });
});
