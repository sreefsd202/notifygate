// src/components/QRCodeDisplay.jsx
import React, { useState } from 'react';
import axios from 'axios';

function QRCodeDisplay({ studentId, studentData }) {
  const [qrImage, setQrImage] = useState('');
  const [qrData, setQrData] = useState(null);

  const generateQR = async () => {
    try {
      const res = await axios.post(`http://localhost:5000/generate-qr/${studentId}`);
      setQrImage(res.data.qrImage);
      setQrData(res.data.studentData);
    } catch {
      alert('QR generation failed');
    }
  };

  return (
    <div style={{ marginTop: "20px", padding: "20px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h3>QR Code Gate Pass</h3>
      
      {/* Student Information */}
      {studentData && (
        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#f9f9f9", borderRadius: "5px" }}>
          <h4>Student Details:</h4>
          <p><strong>Name:</strong> {studentData.name}</p>
          <p><strong>Adm No:</strong> {studentData.admNo}</p>
          <p><strong>Department:</strong> {studentData.dept}</p>
          <p><strong>Semester:</strong> {studentData.sem}</p>
          <p><strong>Purpose:</strong> {studentData.purpose || "Not specified"}</p>
          <p><strong>Date:</strong> {studentData.date ? new Date(studentData.date).toLocaleDateString() : "Not specified"}</p>
          <p><strong>Return Time:</strong> {studentData.returnTime || "Not specified"}</p>
        </div>
      )}
      
      <button 
        onClick={generateQR} 
        style={{
          padding: "10px 15px",
          backgroundColor: "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "4px",
          cursor: "pointer"
        }}
      >
        Generate QR Code
      </button>
      
      <br />
      
      {qrImage && (
        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <img 
            src={qrImage} 
            alt="QR Code" 
            style={{ 
              maxWidth: "200px", 
              border: "1px solid #ddd",
              padding: "10px",
              backgroundColor: "white"
            }} 
          />
          <p style={{ fontSize: "12px", color: "#666", marginTop: "10px" }}>
            Scan this QR code at the gate
          </p>
        </div>
      )}
    </div>
  );
}

export default QRCodeDisplay;