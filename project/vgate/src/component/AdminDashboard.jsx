import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminDashboard.css';

const AdminDashboard = () => {
  const [students, setStudents] = useState([]);
  const [tutors, setTutors] = useState([]);
  const [gatePasses, setGatePasses] = useState([]);
  const [activeTab, setActiveTab] = useState('students');
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [studentsRes, gatePassesRes] = await Promise.all([
        axios.get('http://localhost:5000/admin/students'),
        axios.get('http://localhost:5000/admin/gate-passes')
      ]);
      
      setStudents(studentsRes.data);
      setGatePasses(gatePassesRes.data);
      
      // Fetch tutors data
      try {
        const tutorsRes = await axios.get('http://localhost:5000/admin/tutors');
        setTutors(tutorsRes.data);
      } catch (err) {
        console.error('Error fetching tutors:', err);
        setTutors([]);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    navigate('/');
  };
// Approve tutor
const handleApproveTutor = async (tutorId) => {
  if (window.confirm('Are you sure you want to approve this tutor?')) {
    try {
      await axios.put(`http://localhost:5000/admin/tutors/${tutorId}/verify`);
      setTutors(tutors.map(tutor => 
        tutor._id === tutorId ? { ...tutor, verified: true } : tutor
      ));
      alert('Tutor approved successfully');
    } catch (err) {
      console.error('Error approving tutor:', err);
      alert('Error approving tutor');
    }
  }
};
  // Delete student
  const handleDeleteStudent = async (studentId) => {
    if (window.confirm('Are you sure you want to delete this student?')) {
      try {
        await axios.delete(`http://localhost:5000/admin/students/${studentId}`);
        setStudents(students.filter(student => student._id !== studentId));
        alert('Student deleted successfully');
      } catch (err) {
        console.error('Error deleting student:', err);
        alert('Error deleting student');
      }
    }
  };

  // Delete tutor
  const handleDeleteTutor = async (tutorId) => {
    if (window.confirm('Are you sure you want to delete this tutor?')) {
      try {
        await axios.delete(`http://localhost:5000/admin/tutors/${tutorId}`);
        setTutors(tutors.filter(tutor => tutor._id !== tutorId));
        alert('Tutor deleted successfully');
      } catch (err) {
        console.error('Error deleting tutor:', err);
        alert('Error deleting tutor');
      }
    }
  };

  const filteredStudents = students.filter(student =>
    student.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.admNo?.toString().includes(searchTerm) ||
    student.dept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredTutors = tutors.filter(tutor =>
    tutor.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.empId?.toString().includes(searchTerm) ||
    tutor.dept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tutor.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredGatePasses = gatePasses.filter(pass =>
    pass.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pass.admNo?.toString().includes(searchTerm) ||
    pass.dept?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    pass.purpose?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getSearchPlaceholder = () => {
    switch (activeTab) {
      case 'students':
        return 'Search students by name, admission no, department, or email...';
      case 'tutors':
        return 'Search tutors by name, employee ID, department, or email...';
      case 'gatepasses':
        return 'Search gate passes by name, admission no, department, or purpose...';
      default:
        return 'Search...';
    }
  };

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="loading-spinner">
          <div className="spinner"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <header className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="header-actions">
          <span className="welcome-text">Welcome, Administrator</span>
          <button onClick={handleLogout} className="logout-button">
            Logout
          </button>
        </div>
      </header>

      <div className="dashboard-stats">
        <div className="stat-card">
          <h3 className="stat-number">{students.length}</h3>
          <p className="stat-label">Total Students</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">{tutors.length}</h3>
          <p className="stat-label">Registered Tutors</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">{gatePasses.length}</h3>
          <p className="stat-label">Gate Pass Requests</p>
        </div>
        <div className="stat-card">
          <h3 className="stat-number">
            {students.filter(s => s.verified).length}
          </h3>
          <p className="stat-label">Verified Students</p>
        </div>
      </div>

      <div className="admin-tabs">
        <button 
          className={activeTab === 'students' ? 'active' : ''}
          onClick={() => {
            setActiveTab('students');
            setSearchTerm('');
          }}
        >
          Registered Students ({students.length})
        </button>
        <button 
          className={activeTab === 'tutors' ? 'active' : ''}
          onClick={() => {
            setActiveTab('tutors');
            setSearchTerm('');
          }}
        >
          Registered Tutors ({tutors.length})
        </button>
        <button 
          className={activeTab === 'gatepasses' ? 'active' : ''}
          onClick={() => {
            setActiveTab('gatepasses');
            setSearchTerm('');
          }}
        >
          Gate Pass Requests ({gatePasses.length})
        </button>
      </div>

      <div className="admin-content">
        <div className="content-header">
          <h2>
            {activeTab === 'students' && 'Registered Students'}
            {activeTab === 'tutors' && 'Registered Tutors'}
            {activeTab === 'gatepasses' && 'Gate Pass Requests'}
          </h2>
          <input
            type="text"
            className="search-box"
            placeholder={getSearchPlaceholder()}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="table-container">
          {activeTab === 'students' && (
            <>
              {filteredStudents.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Photo</th>
                      <th>Adm No</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Semester</th>
                      <th>Tutor</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr key={student._id}>
                        <td className="avatar-cell">
                          {student.image ? (
                            <img 
                              src={`data:image/jpeg;base64,${student.image.toString('base64')}`}
                              alt={student.name}
                              className="avatar"
                            />
                          ) : (
                            <div className="avatar" style={{
                              background: '#e2e8f0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#666',
                              fontSize: '12px'
                            }}>
                              No Image
                            </div>
                          )}
                        </td>
                        <td>{student.admNo}</td>
                        <td>{student.name}</td>
                        <td>{student.dept}</td>
                        <td>{student.sem}</td>
                        <td>{student.tutorName}</td>
                        <td>{student.email}</td>
                        <td>{student.phone}</td>
                        <td>
                          <span className={`status-badge ${student.verified ? 'status-active' : 'status-pending'}`}>
                            {student.verified ? 'Verified' : 'Pending'}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteStudent(student._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No Students Found</h3>
                  <p>No students match your search criteria.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'tutors' && (
  <>
    {filteredTutors.length > 0 ? (
      <table>
        <thead>
          <tr>
            <th>Photo</th>
            <th>Employee ID</th>
            <th>Name</th>
            <th>Department</th>
            <th>Email</th>
            <th>Students Count</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredTutors.map(tutor => (
            <tr key={tutor._id}>
              <td className="avatar-cell">
                {tutor.image ? (
                  <img 
                    src={`data:image/jpeg;base64,${tutor.image.toString('base64')}`}
                    alt={tutor.name}
                    className="avatar"
                  />
                ) : (
                  <div className="avatar" style={{
                    background: '#e2e8f0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#666',
                    fontSize: '12px'
                  }}>
                    No Image
                  </div>
                )}
              </td>
              <td>{tutor.empId}</td>
              <td>{tutor.name}</td>
              <td>{tutor.dept}</td>
              <td>{tutor.email}</td>
              <td>
                {students.filter(s => s.tutorName === tutor.name).length}
              </td>
              <td>
                <span className={`status-badge ${tutor.verified ? 'status-active' : 'status-pending'}`}>
                  {tutor.verified ? 'Verified' : 'Pending Approval'}
                </span>
              </td>
              <td className="actions-cell">
                {!tutor.verified && (
                  <button 
                    className="action-btn view-btn"
                    onClick={() => handleApproveTutor(tutor._id)}
                  >
                    Approve
                  </button>
                )}
                          <button 
                            className="action-btn delete-btn"
                            onClick={() => handleDeleteTutor(tutor._id)}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No Tutors Found</h3>
                  <p>No tutors match your search criteria.</p>
                </div>
              )}
            </>
          )}

          {activeTab === 'gatepasses' && (
            <>
              {filteredGatePasses.length > 0 ? (
                <table>
                  <thead>
                    <tr>
                      <th>Adm No</th>
                      <th>Name</th>
                      <th>Department</th>
                      <th>Purpose</th>
                      <th>Date/Time</th>
                      <th>Return Time</th>
                      <th>Tutor</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredGatePasses.map(pass => (
                      <tr key={pass._id}>
                        <td>{pass.admNo}</td>
                        <td>{pass.name}</td>
                        <td>{pass.dept}</td>
                        <td>{pass.purpose}</td>
                        <td>{new Date(pass.date).toLocaleString()}</td>
                        <td>{pass.returnTime || 'N/A'}</td>
                        <td>{pass.tutorName}</td>
                        <td>
                          <span className={`status-badge ${
                            pass.status === 'approved' ? 'status-active' :
                            pass.status === 'rejected' ? 'status-inactive' : 'status-pending'
                          }`}>
                            {pass.status || 'Pending'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <div className="empty-state">
                  <h3>No Gate Passes Found</h3>
                  <p>No gate pass requests match your search criteria.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;