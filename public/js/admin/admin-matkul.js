// ===============================
// 📘 Admin Mata Kuliah JS (CSP-SAFE)
// ===============================
document.addEventListener("DOMContentLoaded", () => {
  const addModal = document.getElementById("addModal");
  const editModal = document.getElementById("editModal");
  const searchInput = document.getElementById("searchMatkul");

  // 🔍 Filter Matkul
  if (searchInput) {
    searchInput.addEventListener("input", () => {
      const search = searchInput.value.toLowerCase();
      document.querySelectorAll(".matkul-row").forEach(row => {
        const name = row.dataset.name;
        const lecturer = row.dataset.lecturer;
        row.style.display = name.includes(search) || lecturer.includes(search) ? "" : "none";
      });
    });
  }

  // ➕ Tambah Matkul
  document.querySelectorAll("[data-add-matkul]").forEach(btn => {
    btn.addEventListener("click", () => addModal.classList.remove("hidden"));
  });
  document.querySelectorAll("[data-close-add-matkul]").forEach(btn => {
    btn.addEventListener("click", () => addModal.classList.add("hidden"));
  });

  // ✏️ Edit Matkul
  document.querySelectorAll("[data-edit-matkul]").forEach(btn => {
    btn.addEventListener("click", () => {
      const { id, code, name, nip } = btn.dataset;
      editModal.classList.remove("hidden");
      document.getElementById("editId").value = id;
      document.getElementById("editCode").value = code;
      document.getElementById("editName").value = name;
      document.getElementById("editLecturerNip").value = nip;
    });
  });
  document.querySelectorAll("[data-close-edit-matkul]").forEach(btn => {
    btn.addEventListener("click", () => editModal.classList.add("hidden"));
  });

  // 🗑️ Hapus Matkul
  document.querySelectorAll("[data-delete-matkul]").forEach(btn => {
    btn.addEventListener("click", async () => {
      if (!confirm("Yakin ingin menghapus mata kuliah ini?")) return;
      const id = btn.dataset.id;
      const res = await fetch("/dashboard/admin/subject/delete", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: `id=${encodeURIComponent(id)}`,
        credentials: "include"
      });
      if (res.ok) {
        alert("Mata kuliah berhasil dihapus!");
        location.reload();
      } else {
        alert("Gagal menghapus mata kuliah.");
      }
    });
  });
});
