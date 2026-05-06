// public/js/admin.js
// Dipanggil dari dashboard-admin.ejs (pastikan <script src="/js/admin.js"></script> ada)

function openModal(id) {
  document.getElementById(id)?.classList.remove('hidden');
}
function closeModal(id) {
  document.getElementById(id)?.classList.add('hidden');
}

// Set up edit buttons (delegation)
document.addEventListener('click', function (e) {
  const ed = e.target.closest('.btn-edit');
  if (ed) {
    const type = ed.dataset.type;
    if (type === 'lecturer') {
      document.getElementById('editLecturerId').value = ed.dataset.id || '';
      document.getElementById('editLecturerNip').value = ed.dataset.nip || '';
      document.getElementById('editLecturerName').value = ed.dataset.name || '';
      document.getElementById('editLecturerEmail').value = ed.dataset.email || '';
      document.getElementById('editLecturerStatus').value = ed.dataset.status || 'Aktif';
      openModal('modalEditLecturer');
    } else if (type === 'student') {
      document.getElementById('editStudentId').value = ed.dataset.id || '';
      document.getElementById('editStudentName').value = ed.dataset.name || '';
      document.getElementById('editStudentClass').value = ed.dataset.class || '';
      document.getElementById('editStudentStatus').value = ed.dataset.status || 'Aktif';
      openModal('modalEditStudent');
    } else if (type === 'subject') {
      document.getElementById('editSubjectId').value = ed.dataset.id || '';
      document.getElementById('editSubjectName').value = ed.dataset.name || '';
      // pilih option pada select lecturer
      const nip = ed.dataset.lecturernip || '';
      const sel = document.getElementById('editSubjectLecturerNip');
      if (sel) { sel.value = nip; }
      openModal('modalEditSubject');
    }
  }

  const del = e.target.closest('.btn-delete');
  if (del) {
    const url = del.dataset.url;
    const id = del.dataset.id;
    if (!confirm('Yakin ingin dihapus?')) return;
    const form = new FormData();
    form.append('id', id);
    fetch(url, { method: 'POST', body: form })
      .then(r => r.json())
      .then(j => {
        if (j.success) location.reload();
        else alert(j.message || 'Gagal menghapus');
      })
      .catch(err => {
        console.error(err);
        alert('Terjadi kesalahan jaringan');
      });
  }
});
