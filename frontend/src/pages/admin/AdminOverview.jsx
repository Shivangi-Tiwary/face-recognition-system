import React, { useEffect, useState } from "react";
import api from "../../api/axios";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";

const AdminOverview = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const res = await api.get("/admin/students");
      setStudents(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch students");
    }
  };

  const handleStudentClick = async (studentId) => {
    setModalLoading(true);
    setSelectedStudent(null);
    try {
      const res = await api.get(`/admin/students/${studentId}`);
      setSelectedStudent(res.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch student details");
    } finally {
      setModalLoading(false);
    }
  };

  const closeModal = () => setSelectedStudent(null);

  return (
    <>
      {/* Cards */}
      <div className="admin__cards">
        <div className="card">
          <h4>Total Students</h4>
          <p>{students.length}</p>
        </div>
        <div className="card">
          <h4>Face Registered</h4>
          <p>{students.filter(s => s.faceEnrolled).length}</p>
        </div>
        <div className="card">
          <h4>Pending</h4>
          <p>{students.filter(s => !s.faceEnrolled).length}</p>
        </div>
        <div className="card card--clickable" onClick={() => navigate("/admin/tickets")}>
          <h4>Support Tickets</h4>
          <p>View →</p>
        </div>
      </div>

      {/* Table */}
      <div className="admin__table">
        <h3>Students List</h3>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Enrollment No.</th>
              <th>Department</th>
              <th>Face Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student._id}>
                <td>
                  <span
                    className="student-name-link"
                    onClick={() => handleStudentClick(student._id)}
                  >
                    {student.name}
                  </span>
                </td>
                <td>{student.email}</td>
                <td>{student.enrollment || "—"}</td>
                <td>{student.department || "—"}</td>
                <td className={student.faceEnrolled ? "approved" : "pending"}>
                  {student.faceEnrolled ? "✔ Registered" : "⏳ Pending"}
                </td>
                <td>{new Date(student.createdAt).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Student Detail Modal */}
      {(modalLoading || selectedStudent) && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            {modalLoading ? (
              <div className="modal-loading">
                <div className="spinner" />
                <p>Loading student details…</p>
              </div>
            ) : (
              <>
                <button className="modal-close" onClick={closeModal}>✕</button>
                <div className="modal-avatar">
                  {selectedStudent.faceImageUrl ? (
                    <img src={selectedStudent.faceImageUrl} alt={selectedStudent.name} />
                  ) : (
                    <div className="avatar-placeholder">
                      {selectedStudent.name?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <h2 className="modal-name">{selectedStudent.name}</h2>
                <span className={`modal-badge ${selectedStudent.faceEnrolled ? "badge-success" : "badge-warn"}`}>
                  {selectedStudent.faceEnrolled ? "✔ Face Registered" : "⏳ Face Pending"}
                </span>
                <div className="modal-grid">
                  <div className="modal-field">
                    <label>Email</label>
                    <span>{selectedStudent.email}</span>
                  </div>
                  <div className="modal-field">
                    <label>Enrollment Number</label>
                    <span>{selectedStudent.enrollment || "Not provided"}</span>
                  </div>
                  <div className="modal-field">
                    <label>Department</label>
                    <span>{selectedStudent.department || "Not provided"}</span>
                  </div>
                  <div className="modal-field">
                    <label>Role</label>
                    <span style={{ textTransform: "capitalize" }}>{selectedStudent.role}</span>
                  </div>
                  <div className="modal-field">
                    <label>Registered On</label>
                    <span>{new Date(selectedStudent.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="modal-field">
                    <label>Face Enrolled At</label>
                    <span>
                      {selectedStudent.enrolledAt
                        ? new Date(selectedStudent.enrolledAt).toLocaleString()
                        : "Not yet enrolled"}
                    </span>
                  </div>
                  <div className="modal-field">
                    <label>Last Face Login</label>
                    <span>
                      {selectedStudent.lastFaceLogin
                        ? new Date(selectedStudent.lastFaceLogin).toLocaleString()
                        : "No face login yet"}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default AdminOverview;
