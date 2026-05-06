// ===============================
// 📘 Admin Dosen JS (CSP-SAFE)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addModal");
  const editModal = document.getElementById("editModal");
  const searchInput = document.getElementById("searchInput");

  // 🔍 Filter Tabel Dosen
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const search = searchInput.value.toLowerCase();
      document.querySelectorAll(".lecturer-row").forEach(row => {
        const name = row.dataset.name;
        const nip = row.dataset.nip;
        const email = row.dataset.email;
        const match = name.includes(search) || nip.includes(search) || email.includes(search);
        row.style.display = match ? "" : "none";
      });
    });
  }

  // ➕ Tambah Dosen
  document.querySelectorAll("[data-add-dosen]").forEach(btn => {
    btn.addEventListener("click", () => addModal.classList.remove("hidden"));
  });

  document.querySelectorAll("[data-close-add]").forEach(btn => {
    btn.addEventListener("click", () => addModal.classList.add("hidden"));
  });

  // ✏️ Edit Dosen
  document.querySelectorAll("[data-edit-dosen]").forEach(btn => {
    btn.addEventListener("click", () => {
      const { id, nip, name, email, status } = btn.dataset;
      editModal.classList.remove("hidden");
      document.getElementById("editId").value = id;
      document.getElementById("editNip").value = nip;
      document.getElementById("editName").value = name;
      document.getElementById("editEmail").value = email;
      document.getElementById("editStatus").value = status;
    });
  });

  document.querySelectorAll("[data-close-edit]").forEach(btn => {
    btn.addEventListener("click", () => editModal.classList.add("hidden"));
  });

  // 🔁 Reset Password
  document.querySelectorAll("[data-reset-dosen]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("Reset password dosen ini ke 123456?")) {
        const id = btn.dataset.id;
        const res = await fetch("/dashboard/admin/lecturer/reset", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `id=${id}`,
          credentials: "include"
        });
        if (res.ok) alert("Password berhasil direset!");
      }
    });
  });

  // 🗑️ Hapus Dosen
  document.querySelectorAll("[data-delete-dosen]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (confirm("Yakin ingin menghapus dosen ini?")) {
        const id = btn.dataset.id;
        const res = await fetch("/dashboard/admin/lecturer/delete", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: `id=${id}`,
          credentials: "include"
        });
        if (res.ok) {
          alert("Dosen berhasil dihapus!");
          setTimeout(() => location.reload(), 700);
        }
      }
    });
  });
});
