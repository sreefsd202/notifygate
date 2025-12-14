import React, { useEffect, useState } from "react";
import "./GatePassForm.css"; 
import axios from 'axios';
import { useParams, useLocation  } from 'react-router-dom';
import QRCodeDisplay from './QRCodeDisplay';

const GatePassForm = ({studentId}) => {
   const { id } = useParams();
  const [formData, setFormData] = useState({
  name: "",
  admissionNo: "",
  dept: "",
  tutor: "",
  reason: "",
  isGroup: false,
  groupMembers: [],
  isReturning: false,
  returnTime: ""
});


  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [studentData, setStudentData] = useState(null);



const location = useLocation();


useEffect(() => {
    // Check if student data was passed via location state
   if (location.state?.student) {
  const student = location.state.student;
      setStudentData(student);
     setFormData({
  name: student.name,
  admissionNo: String(student.admNo),    // <----- force to string!
  dept: student.dept,
  tutor: student.tutorName,
  reason: "",
  isGroup: false,
  groupMembers: [],
  isReturning: false,
  returnTime: ""
});

    } else {
      // Fallback to API call if state not available
      const fetchStudentData = async () => {
        
          const response = await axios.get(`http://localhost:5000/student/${id}`);
          const student = response.data;
          setStudentData(student);
          setFormData({
            name: student.name,
            admissionNo: String(student.admNo),
            dept: student.dept,
            tutor: student.tutorName,
            reason: "",
            isGroup: false,
            groupMembers: [],
            isReturning: false,
            returnTime: ""
          });
       
      };
      fetchStudentData();
    }
  }, [id, location.state]); 




  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === "checkbox" ? checked : value,
    });
  };
  // const handleSubmit = async () => {
  //    try {
  //      await axios.post(`http://localhost:5000/form-fill/${studentId}`, form);
  //      alert('Form submitted');
  //    } catch {
  //      alert('Form submission failed');
  //    }
  //  };
  const handleGroupMemberChange = (index, field, value) => {
    const newGroupMembers = [...formData.groupMembers];
    newGroupMembers[index][field] = value;
    setFormData({ ...formData, groupMembers: newGroupMembers });
  };

  const addGroupMember = () => {
    setFormData({
      ...formData,
      groupMembers: [...formData.groupMembers, { name: "", admissionNo: "", dept: "" }]
    });
  };

  const validate = () => {
    const errs = {};
    if (!formData.name.trim()) errs.name = "Name is required";
    if (!formData.admissionNo.trim()) errs.admissionNo = "Admission number is required";
    if (!formData.dept.trim()) errs.dept = "Department is required";
    if (!formData.tutor.trim()) errs.tutor = "Tutor name is required";
    if (!formData.reason.trim()) errs.reason = "Reason is required";
    if (formData.isReturning && !formData.returnTime.trim())
      errs.returnTime = "Return time required";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  //   const handleSubmit = async (e) => {
  //   e.preventDefault();
    
  //   if (!validate()) return;

  //   try {
  //     const formDataToSend = {
  //       purpose: formData.reason,
  //       date: new Date().toISOString(),
  //       returnTime: formData.isReturning ? formData.returnTime : null
  //     };

  //     const response = await axios.post(`http://localhost:5000/form-fill/${id}`, formDataToSend);
  //     setStudentData(response.data.student); // Save the student data from response
  //     setSubmitted(true);
  //     console.log("Submitted Data:", formData);
  //   } catch (error) {
  //     console.error("Submission error:", error);
  //     alert(`Form submission failed: ${error.response?.data?.message || error.message}`);
  //   }
  // };

  // if (submitted && studentData) {
  //   return (
  //     <div style={{ maxWidth: "600px", margin: "auto", textAlign: "center" }}>
  //       <h2>Gate Pass Approved</h2>
  //       <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "10px" }}>
  //         {/* Student Details */}
  //         <div style={{ marginBottom: "20px" }}>
  //           {studentData.image && (
  //             <img 
  //               src={`data:image/jpeg;base64,${studentData.image.toString('base64')}`} 
  //               alt="Student" 
  //               style={{ width: "100px", height: "100px", borderRadius: "50%" }}
  //             />
  //           )}
  //           <h3>{studentData.name}</h3>
  //           <p>Admission No: {studentData.admNo}</p>
  //           <p>Department: {studentData.dept}</p>
  //           <p>Purpose: {formData.reason}</p>
  //           {formData.isReturning && <p>Return Time: {formData.returnTime}</p>}
  //         </div>
          
  //         {/* QR Code */}
  //         <QRCodeDisplay studentId={id} />
          
  //         <button 
  //           onClick={() => setSubmitted(false)}
  //           style={{ marginTop: "20px" }}
  //         >
  //           Back to Form
  //         </button>
  //       </div>
  //     </div>
  //   );
  // }


const handleSubmit = async (e) => {
  e.preventDefault();

  if (!validate()) return;

  const formDataToSend = {
    purpose: formData.reason,
    date: new Date().toISOString(),
    returnTime: formData.isReturning ? formData.returnTime : null,
    groupMembers: formData.isGroup ? formData.groupMembers : [] // ✅ send if group
  };

  console.log("Data being sent to backend:", formDataToSend);

  try {
    const response = await axios.post(`http://localhost:5000/form-fill/${id}`, formDataToSend);
    console.log("Server response:", response.data);
    setStudentData(response.data.student,response.data.gatePass );
    setSubmitted(true);
  } catch (error) {
    console.error("Submission error:", error);
    alert(`Form submission failed: ${error.response?.data?.message || error.message}`);
  }
};




if (submitted && studentData) {
  return (
    <div style={{ maxWidth: "600px", margin: "auto", textAlign: "center" }}>
      <h2>Gate Pass Submitted for Approval</h2>
      <div style={{ border: "1px solid #ccc", padding: "20px", borderRadius: "10px" }}>
        <div style={{ marginBottom: "20px" }}>
          {studentData.image && (
            <img
              src={`data:image/jpeg;base64,${studentData.image}`}
              alt="Student"
              style={{ width: "100px", height: "100px", borderRadius: "50%" }}
            />
          )}
          <h3>{studentData.name}</h3>
          <p>Admission No: {studentData.admNo}</p>
          <p>Department: {studentData.dept}</p>
          <p>Purpose: {studentData.purpose}</p>
          {studentData.returnTime && <p>Return Time: {studentData.returnTime}</p>}
          <p style={{ color: 'orange', fontWeight: 'bold' }}>
            ⏳ Waiting for tutor approval
          </p>
        </div>

        {/* <button
          onClick={() => {
            setSubmitted(false);
            // Navigate back to dashboard
            navigate(`/student-dashboard/${id}`);
          }}
          style={{ marginTop: "20px" }}
        >
          Back to Dashboard
        </button> */}
      </div>
    </div>
  );
}











  return (
    <div >
      <h2>Gate Pass Registration</h2>
      <form id="for" onSubmit={handleSubmit}>
        {/* Student Details */}
        <label>Name:</label>
        <input type="text" name="name" value={formData.name} onChange={handleChange} />
        {errors.name && <span className="error">{errors.name}</span>}

        <label>Admission No:</label>
        <input type="text" name="admissionNo" value={formData.admissionNo} onChange={handleChange} />
        {errors.admissionNo && <span className="error">{errors.admissionNo}</span>}

        <label>Department:</label>
        <input
          type="text"
          name="dept"
          value={formData.dept}
          onChange={handleChange}
          list="departments"
        />
        <datalist id="departments">
          <option value="BA Malayalam Language & Literature" />
          <option value="BA English Language & Literature" />
          <option value="BA Functional English" />
          <option value="BA Economics" />
          <option value="BA Sociology" />
          <option value="B.Com" />
          <option value="B.Sc Chemistry" />
          <option value="B.Sc Physics" />
          <option value="B.Sc Mathematics" />
          <option value="B.Sc Statistics" />
          <option value="B.Sc Botany" />
          <option value="B.Sc Zoology" />
          <option value="B.Sc Family & Community Science" />
          <option value="B.Sc Computer Science" />
          <option value="B.Com (Self)" />
          <option value="B.Sc Home Science (Textiles & Fashion Technology)" />
          <option value="B.Sc Psychology" />
          <option value="B.Voc Web Technology" />
          <option value="B.Voc Food Processing" />
          <option value="MA English" />
          <option value="MA Economics" />
          <option value="MA Sociology" />
          <option value="M.Com" />
          <option value="MSW" />
          <option value="M.Sc Zoology" />
          <option value="M.Sc Chemistry" />
          <option value="M.Sc Botany" />
          <option value="M.Sc Mathematics" />
          <option value="M.Sc Statistics" />
          <option value="M.Sc Computer Science" />
        </datalist>
        {errors.dept && <span className="error">{errors.dept}</span>}

        <label>Tutor Name:</label>
        <input type="text" name="tutor" value={formData.tutor} onChange={handleChange} />
        {errors.tutor && <span className="error">{errors.tutor}</span>}

        <label>Reason for Gate Pass:</label>
        <textarea name="reason" value={formData.reason} onChange={handleChange} />
        {errors.reason && <span className="error">{errors.reason}</span>}

        {/* Group Members */}
        
        <label>
          Is this request for a group?
        </label>
        <input
            type="checkbox"
            name="isGroup"
            checked={formData.isGroup}
            onChange={handleChange}
          />


        {formData.isGroup && (
          <>
            {formData.groupMembers.map((member, index) => (
              <div key={index} style={{ padding: "10px", border: "1px dashed gray", marginBottom: "10px" }}>
                <strong>Group Member {index + 1}</strong><br />
                <label>Name:</label>
                <input
                  type="text"
                  value={member.name}
                  onChange={(e) => handleGroupMemberChange(index, "name", e.target.value)}
                />
                <label>Admission No:</label>
                <input
                  type="text"
                  value={member.admissionNo}
                  onChange={(e) => handleGroupMemberChange(index, "admissionNo", e.target.value)}
                />
                <label>Department:</label>
                <input
                  type="text"
                  value={member.dept}
                  onChange={(e) => handleGroupMemberChange(index, "dept", e.target.value)}
                  list="departments"
                />
              </div>
            ))}
            <button type="button" onClick={addGroupMember}>+ Add Group Member</button>
          </>
        )}

        {/* Returning */}


        <label>
          Will the student(s) return?
        </label>
          <input
            type="checkbox"
            name="isReturning"
            checked={formData.isReturning}
            onChange={handleChange}
          />

        {formData.isReturning && (
          <>
            <label>Return Time:</label>
            <input
              type="time"
              name="returnTime"
              value={formData.returnTime}
              onChange={handleChange}
            />
            {errors.returnTime && <span className="error">{errors.returnTime}</span>}
          </>
        )}

        <br />
        <button type="submit">Submit Request</button>
      </form>
    </div>
  );
};

export default GatePassForm;











