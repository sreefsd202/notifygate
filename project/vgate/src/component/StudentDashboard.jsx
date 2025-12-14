// src/components/StudentDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import './StudentDashboard.css';
import { useLocation } from 'react-router-dom';

function StudentDashboard({ student, onLogout }) {
  const navigate = useNavigate();
  const location = useLocation(); 
  const { id } = useParams();
  const [gatePasses, setGatePasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPass, setSelectedPass] = useState(null);
  const [qrImage, setQrImage] = useState('');
  const [activeTab, setActiveTab] = useState('approved');
  const [studentImage, setStudentImage] = useState(null);
  
  useEffect(() => {
    if (location.state?.newPass) {
      setGatePasses(prevPasses => [location.state.newPass, ...prevPasses]);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state]);

  useEffect(() => {
    if (student) {
      // Process student image
      if (student.image) {
        try {
          const base64Image = `data:image/jpeg;base64,${student.image.toString('base64')}`;
          setStudentImage(base64Image);
        } catch (e) {
          console.log('Error processing student image:', e);
          // Try alternative method to get image
          fetchStudentImage();
        }
      } else {
        fetchStudentImage();
      }

      const fetchPasses = async () => {
        try {
          const res = await axios.get(`http://localhost:5000/student/approved-passes/${student._id}`);
          setGatePasses(res.data);
          setIsLoading(false);
        } catch (error) {
          console.error('Error fetching gate passes:', error);
          setIsLoading(false);
        }
      };
      
      fetchPasses();
    }
  }, [student]);

  const fetchStudentImage = async () => {
    try {
      const imageResponse = await axios.get(`http://localhost:5000/student/image/${student._id}`, {
        responseType: 'blob'
      });
      const imageUrl = URL.createObjectURL(imageResponse.data);
      setStudentImage(imageUrl);
    } catch (imageError) {
      console.log('Student image not available');
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/');
  };

  const handleGetPass = () => {
    navigate(`/pass/${student._id}`);
  };

  const generateQR = async (passId) => {
    try {
      const res = await axios.post(`http://localhost:5000/generate-qr/${student._id}`);
      setQrImage(res.data.qrImage);
      setSelectedPass(passId);
    } catch (error) {
      alert('QR generation failed: ' + error.message);
    }
  };

  const formatDate = (dateString) => {
    const options = { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  // Calculate stats
  const approvedPasses = gatePasses.filter(pass => pass.status === 'approved');
  const pendingPasses = gatePasses.filter(pass => pass.status === 'pending');

  if (!student) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading student data...</p>
      </div>
    );
  }

  return (
    <div className="student-dashboard-container">
      {/* Header Section */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="user-profile">
            <div className="avatar-square">
              {studentImage ? (
                <img 
                  src={studentImage} 
                  alt={`${student.name} Profile`}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`avatar-square-placeholder ${studentImage ? 'avatar-fallback' : ''}`}>
                <i className="fas fa-user-graduate"></i>
              </div>
            </div>
            <div className="user-info">
              <h1>{student.name}</h1>
              <div className="user-details">
                <span className="detail-item">
                  <i className="fas fa-id-card"></i> {student.admNo}
                </span>
                <span className="detail-item">
                  <i className="fas fa-building"></i> {student.dept}
                </span>
                <span className="detail-item">
                  <i className="fas fa-graduation-cap"></i> Semester {student.sem}
                </span>
                <span className="detail-item">
                  <i className="fas fa-user-tie"></i> {student.tutorName}
                </span>
              </div>
            </div>
          </div>
          
          <div className="header-actions">
            <button className="logout-btn" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt"></i> Logout
            </button>
          </div>
        </div>
      </header>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="stats-overview">
          <div className="stat-card">
            <div className="stat-icon approved">
              <i className="fas fa-check-circle"></i>
            </div>
            <div className="stat-info">
              <h3>{approvedPasses.length}</h3>
              <p>Approved Passes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon pending">
              <i className="fas fa-clock"></i>
            </div>
            <div className="stat-info">
              <h3>{pendingPasses.length}</h3>
              <p>Pending Passes</p>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon history">
              <i className="fas fa-history"></i>
            </div>
            <div className="stat-info">
              <h3>{gatePasses.length}</h3>
              <p>Total Passes</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Main Dashboard Content */}
      <main className="dashboard-main">
        {/* New Pass Button Section */}
        <div className="new-pass-section">
          <button className="primary-button" onClick={handleGetPass}>
            <i className="icon-pass"></i> Get New Gate Pass
          </button>
        </div>

        {/* QR Code Display Section */}
        {selectedPass && qrImage && (
          <div className="qr-section">
            <h3>QR Code Gate Pass</h3>
            <div className="qr-container">
              <img src={qrImage} alt="QR Code" className="qr-image" />
              <div className="qr-info">
                <p><strong>Scan this QR code at the gate</strong></p>
                <p>Valid for: {formatDate(gatePasses.find(p => p._id === selectedPass)?.date)}</p>
                <button 
                  className="secondary-button"
                  onClick={() => {
                    setSelectedPass(null);
                    setQrImage('');
                  }}
                >
                  Close QR
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Controls and Tabs Section */}
        <div className="controls-section">
          <div className="tabs-container">
            <div className="tabs">
              <button 
                className={`tab ${activeTab === 'approved' ? 'active' : ''}`}
                onClick={() => setActiveTab('approved')}
              >
                <i className="fas fa-check-circle"></i>
                Approved Passes 
                <span className="tab-badge">{approvedPasses.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
                onClick={() => setActiveTab('pending')}
              >
                <i className="fas fa-clock"></i>
                Pending Passes 
                <span className="tab-badge">{pendingPasses.length}</span>
              </button>
              <button 
                className={`tab ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                <i className="fas fa-history"></i>
                All Passes 
                <span className="tab-badge">{gatePasses.length}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Content Sections */}
        <div className="content-section">
          {/* Approved Passes Tab Content */}
          {activeTab === 'approved' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-check-circle"></i>
                  Approved Gate Passes
                </h2>
                <div className="section-stats">
                  <span className="stats-badge approved">
                    {approvedPasses.length} approved passes
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading approved gate passes...</p>
                </div>
              ) : approvedPasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-check-circle"></i>
                  </div>
                  <h3>No approved gate passes</h3>
                  <p>Your approved gate passes will appear here after tutor approval</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {approvedPasses.map(pass => (
                    <div key={pass._id} className="card approved-card">
                      <div className="card-header">
                        <div className="card-title">
                          <h4>Gate Pass #{pass._id.slice(-6)}</h4>
                        </div>
                        <span className="status-badge approved">
                          <i className="fas fa-check-circle"></i> Approved
                        </span>
                      </div>
                      
                      <div className="card-body">
                        <div className="info-grid">
                          <div className="info-item">
                            <i className="fas fa-bullseye"></i>
                            <div>
                              <label>Purpose</label>
                              <p>{pass.purpose}</p>
                            </div>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-calendar"></i>
                            <div>
                              <label>Date & Time</label>
                              <p>{formatDate(pass.date)}</p>
                            </div>
                          </div>
                          {pass.returnTime && (
                            <div className="info-item">
                              <i className="fas fa-clock"></i>
                              <div>
                                <label>Expected Return</label>
                                <p>{pass.returnTime}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {pass.groupMembers && pass.groupMembers.length > 0 && (
                          <div className="group-section">
                            <h5>
                              <i className="fas fa-user-friends"></i>
                              Group Members ({pass.groupMembers.length})
                            </h5>
                            <div className="group-members">
                              {pass.groupMembers.map((member, index) => (
                                <div key={index} className="group-member">
                                  <div className="group-member-info">
                                    <span className="member-name">{member.name}</span>
                                    <span className="member-adm">({member.admissionNo || member.admNo})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-actions">
                        <button 
                          className="qr-button"
                          onClick={() => generateQR(pass._id)}
                        >
                          <i className="fas fa-qrcode"></i> Generate QR Code
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Pending Passes Tab Content */}
          {activeTab === 'pending' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-clock"></i>
                  Pending Gate Passes
                </h2>
                <div className="section-stats">
                  <span className="stats-badge pending">
                    {pendingPasses.length} awaiting approval
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading pending gate passes...</p>
                </div>
              ) : pendingPasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-clock"></i>
                  </div>
                  <h3>No pending gate passes</h3>
                  <p>Your gate pass requests will appear here while waiting for tutor approval</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {pendingPasses.map(pass => (
                    <div key={pass._id} className="card pending-card">
                      <div className="card-header">
                        <div className="card-title">
                          <h4>Gate Pass #{pass._id.slice(-6)}</h4>
                        </div>
                        <span className="status-badge pending">
                          <i className="fas fa-clock"></i> Pending Approval
                        </span>
                      </div>
                      
                      <div className="card-body">
                        <div className="info-grid">
                          <div className="info-item">
                            <i className="fas fa-bullseye"></i>
                            <div>
                              <label>Purpose</label>
                              <p>{pass.purpose}</p>
                            </div>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-calendar"></i>
                            <div>
                              <label>Date & Time</label>
                              <p>{formatDate(pass.date)}</p>
                            </div>
                          </div>
                          {pass.returnTime && (
                            <div className="info-item">
                              <i className="fas fa-clock"></i>
                              <div>
                                <label>Expected Return</label>
                                <p>{pass.returnTime}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {pass.groupMembers && pass.groupMembers.length > 0 && (
                          <div className="group-section">
                            <h5>
                              <i className="fas fa-user-friends"></i>
                              Group Members ({pass.groupMembers.length})
                            </h5>
                            <div className="group-members">
                              {pass.groupMembers.map((member, index) => (
                                <div key={index} className="group-member">
                                  <div className="group-member-info">
                                    <span className="member-name">{member.name}</span>
                                    <span className="member-adm">({member.admissionNo || member.admNo})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-actions">
                        <button className="qr-button" disabled>
                          <i className="fas fa-hourglass-half"></i> Awaiting Approval
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* All Passes Tab Content */}
          {activeTab === 'all' && (
            <div className="dashboard-section">
              <div className="section-header">
                <h2>
                  <i className="fas fa-history"></i>
                  All Gate Passes
                </h2>
                <div className="section-stats">
                  <span className="stats-badge">
                    {gatePasses.length} total passes
                  </span>
                </div>
              </div>
              
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-spinner"></div>
                  <p>Loading all gate passes...</p>
                </div>
              ) : gatePasses.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-icon">
                    <i className="fas fa-history"></i>
                  </div>
                  <h3>No gate passes found</h3>
                  <p>Your gate pass history will appear here</p>
                </div>
              ) : (
                <div className="cards-grid">
                  {gatePasses.map(pass => (
                    <div key={pass._id} className={`card ${pass.status}-card`}>
                      <div className="card-header">
                        <div className="card-title">
                          <h4>Gate Pass #{pass._id.slice(-6)}</h4>
                        </div>
                        <span className={`status-badge ${pass.status}`}>
                          <i className={`fas fa-${pass.status === 'approved' ? 'check-circle' : pass.status === 'pending' ? 'clock' : 'times-circle'}`}></i> 
                          {pass.status.charAt(0).toUpperCase() + pass.status.slice(1)}
                        </span>
                      </div>
                      
                      <div className="card-body">
                        <div className="info-grid">
                          <div className="info-item">
                            <i className="fas fa-bullseye"></i>
                            <div>
                              <label>Purpose</label>
                              <p>{pass.purpose}</p>
                            </div>
                          </div>
                          <div className="info-item">
                            <i className="fas fa-calendar"></i>
                            <div>
                              <label>Date & Time</label>
                              <p>{formatDate(pass.date)}</p>
                            </div>
                          </div>
                          {pass.returnTime && (
                            <div className="info-item">
                              <i className="fas fa-clock"></i>
                              <div>
                                <label>Expected Return</label>
                                <p>{pass.returnTime}</p>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {pass.groupMembers && pass.groupMembers.length > 0 && (
                          <div className="group-section">
                            <h5>
                              <i className="fas fa-user-friends"></i>
                              Group Members ({pass.groupMembers.length})
                            </h5>
                            <div className="group-members">
                              {pass.groupMembers.map((member, index) => (
                                <div key={index} className="group-member">
                                  <div className="group-member-info">
                                    <span className="member-name">{member.name}</span>
                                    <span className="member-adm">({member.admissionNo || member.admNo})</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      <div className="card-actions">
                        {pass.status === 'approved' ? (
                          <button 
                            className="qr-button"
                            onClick={() => generateQR(pass._id)}
                          >
                            <i className="fas fa-qrcode"></i> Generate QR Code
                          </button>
                        ) : (
                          <button className="qr-button" disabled>
                            <i className={`fas fa-${pass.status === 'pending' ? 'hourglass-half' : 'ban'}`}></i> 
                            {pass.status === 'pending' ? 'Awaiting Approval' : 'Not Available'}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default StudentDashboard;