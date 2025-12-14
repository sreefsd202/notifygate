const express = require("express")
const app = express()
const QRCode = require('qrcode')
app.use(express.json())
const Student = require('./models/student')
const Tutor = require('./models/Tutor')
const GatePass = require("./models/Gatepass")
const cors = require('cors')
app.use(cors())
const multer = require('multer')
const bcrypt = require('bcryptjs')
const connectDB = require('./connection')

// Connect to database
connectDB

const storage = multer.memoryStorage()
const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
})

// Serve static files
app.use(express.static('public'))

// Security middleware
app.use((req, res, next) => {
  res.set('X-Content-Type-Options', 'nosniff')
  res.set('X-Frame-Options', 'DENY')
  next()
})

// ========== NOTIFICATION ROUTES ==========

// Get notifications for tutor
app.get('/tutor/:id/notifications', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Get pending gate passes for this tutor's students
    const students = await Student.find({ tutorName: tutor.name });
    const studentIds = students.map(s => s._id);
    
    const pendingPasses = await GatePass.find({ 
      studentId: { $in: studentIds },
      status: 'pending'
    })
    .populate('studentId', 'name admNo dept sem')
    .sort({ createdAt: -1 })
    .limit(10); // Limit to recent notifications

    // Get pending students for this tutor
    const pendingStudents = await Student.find({ 
      tutorName: tutor.name,
      tutorApproved: false 
    }).limit(10);

    // Format notifications
    const notifications = [];

    // Add pending gate pass notifications
    pendingPasses.forEach(pass => {
      notifications.push({
        id: pass._id,
        type: 'gatepass',
        title: 'New Gate Pass Request',
        message: `${pass.studentId.name} (${pass.studentId.admNo}) has submitted a gate pass request`,
        studentName: pass.studentId.name,
        studentAdmNo: pass.studentId.admNo,
        purpose: pass.purpose,
        date: pass.createdAt,
        read: false,
        priority: 'high'
      });
    });

    // Add pending student registration notifications
    pendingStudents.forEach(student => {
      notifications.push({
        id: student._id,
        type: 'registration',
        title: 'New Student Registration',
        message: `${student.name} (${student.admNo}) has registered and awaits your approval`,
        studentName: student.name,
        studentAdmNo: student.admNo,
        dept: student.dept,
        date: student.registrationDate,
        read: false,
        priority: 'medium'
      });
    });

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.date) - new Date(a.date));

    res.json({
      count: notifications.length,
      unreadCount: notifications.filter(n => !n.read).length,
      notifications: notifications.slice(0, 20) // Limit to 20 most recent
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ 
      message: 'Error fetching notifications', 
      error: error.message 
    });
  }
});

// Mark notification as read
app.post('/tutor/notifications/:id/read', async (req, res) => {
  try {
    // In a real app, you'd store notifications in a separate collection
    // For now, we'll just acknowledge the request
    res.json({ 
      message: 'Notification marked as read',
      notificationId: req.params.id 
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ 
      message: 'Error updating notification', 
      error: error.message 
    });
  }
});

// Mark all notifications as read for a tutor
app.post('/tutor/:id/notifications/read-all', async (req, res) => {
  try {
    res.json({ 
      message: 'All notifications marked as read',
      tutorId: req.params.id 
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ 
      message: 'Error updating notifications', 
      error: error.message 
    });
  }
});

// Get tutor image route
app.get('/tutor/image/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
    if (!tutor || !tutor.image) {
      return res.status(404).send('Image not found')
    }
    res.set('Content-Type', 'image/jpeg')
    res.send(tutor.image)
  } catch (err) {
    console.error('Error fetching tutor image:', err)
    res.status(500).send('Server error')
  }
})

// Input validation function
const validateStudentRegistration = (data) => {
  const errors = []
  if (!data.admNo || isNaN(data.admNo)) errors.push('Valid admission number required')
  if (!data.name || data.name.trim().length < 2) errors.push('Valid name required')
  if (!data.email || !/\S+@\S+\.\S+/.test(data.email)) errors.push('Valid email required')
  if (!data.phone || isNaN(data.phone) || data.phone.toString().length !== 10) errors.push('Valid 10-digit phone number required')
  if (!data.password || data.password.length < 6) errors.push('Password must be at least 6 characters')
  return errors
}

// Get student image route
app.get('/student/image/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student || !student.image) {
      return res.status(404).send('Image not found')
    }
    res.set('Content-Type', 'image/jpeg')
    res.send(student.image)
  } catch (err) {
    console.error('Error fetching student image:', err)
    res.status(500).send('Server error')
  }
})

// Student registration with password hashing
app.post('/register', upload.single('image'), async (req, res) => {
  try {
    const { admNo, name, dept, sem, tutorName, phone, email, password } = req.body
    
    // Validate required fields
    if (!admNo || !name || !dept || !sem || !tutorName || !phone || !email || !password) {
      return res.status(400).json({ 
        message: 'All fields are required'
      })
    }

    // Input validation
    const validationErrors = validateStudentRegistration(req.body)
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        message: 'Validation failed',
        errors: validationErrors
      })
    }

    // Check if student already exists
    const existingStudent = await Student.findOne({ 
      $or: [
        { admNo: Number(admNo) },
        { email: email }
      ]
    })

    if (existingStudent) {
      return res.status(400).json({ 
        message: 'Student with this admission number or email already exists' 
      })
    }

    // Hash password
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    // Create new student
    const student = new Student({
      admNo: Number(admNo),
      name: name.trim(),
      dept: dept.trim(),
      sem: Number(sem),
      tutorName: tutorName.trim(),
      phone: Number(phone),
      email: email.trim(),
      password: hashedPassword,
      image: req.file ? req.file.buffer : undefined,
    })

    await student.save()
    
    res.status(201).json({ 
      message: 'Registration successful',
      studentId: student._id 
    })
    
  } catch (error) {
    console.error('Registration error:', error)
    
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Student with this admission number or email already exists' 
      })
    }
    
    if (error.name === 'ValidationError') {
      return res.status(400).json({ 
        message: 'Validation error',
        error: error.message 
      })
    }
    
    res.status(500).json({
      message: 'Registration failed',
      error: error.message
    })
  }
})

// Login route with bcrypt
app.post('/login', async (req, res) => {
  try {
    const admNo = Number(req.body.admNo)
    const { password } = req.body

    const student = await Student.findOne({ admNo: admNo })
    if (student && await bcrypt.compare(password, student.password)) {
      res.json({ 
        message: 'Login successful', 
        student: {
          _id: student._id,
          name: student.name,
          admNo: student.admNo,
          dept: student.dept,
          email: student.email
        }
      })
    } else {
      res.status(401).json({ message: 'Invalid credentials' })
    }
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({ message: 'Server error during login' })
  }
})

// Form fill route (purpose + date) - UPDATED for tutor approval
app.post('/form-fill/:id', async (req, res) => {
  const { id } = req.params;
  const { purpose, date, returnTime, groupMembers } = req.body;

  try {
    const mainStudent = await Student.findById(id);
    if (!mainStudent) return res.status(404).json({ message: 'Main student not found' });

    // Create gate pass record with pending status
    const gp = new GatePass({
      studentId: mainStudent._id,
      purpose,
      date,
      returnTime,
      groupMembers: groupMembers || [],
      status: 'pending' // Changed to pending for tutor approval
    });
    await gp.save();

    // Update student record with pending status
    mainStudent.groupId = gp._id;
    mainStudent.purpose = purpose;
    mainStudent.date = date;
    mainStudent.returnTime = returnTime;
    mainStudent.passStatus = 'pending';
    await mainStudent.save();

    // Process group members
    if (groupMembers && groupMembers.length) {
      for (const member of groupMembers) {
        const admNo = member.admissionNo || member.admNo;
        if (admNo) {
          const existing = await Student.findOne({ admNo: Number(admNo) });
          if (existing) {
            existing.groupId = gp._id;
            existing.purpose = purpose;
            existing.date = date;
            existing.returnTime = returnTime;
            existing.passStatus = 'pending';
            await existing.save();
          } else {
            // Create placeholder student record
            await Student.create({
              name: member.name || 'Unknown',
              admNo: Number(admNo),
              dept: member.dept || '',
              groupId: gp._id,
              purpose: purpose,
              date: date,
              returnTime: returnTime,
              passStatus: 'pending'
            });
          }
        }
      }
    }

    return res.status(200).json({ 
      message: 'GatePass submitted for tutor approval', 
      gatePass: gp, 
      student: mainStudent 
    });
  } catch (err) {
    console.error('Form fill error:', err);
    return res.status(500).json({ 
      message: 'Form fill failed', 
      error: err.message 
    });
  }
});

// Generate QR code route
app.post("/generate-qr/:studentId", async (req, res) => {
  try {
    const { studentId } = req.params
    const student = await Student.findById(studentId)

    if (!student) return res.status(404).json({ message: "Student not found" })

    const verifyUrl = `${req.protocol}://${req.get('host')}/gatepass/${studentId}`
    const qrImage = await QRCode.toDataURL(verifyUrl)

    res.json({ 
      qrImage, 
      studentData: {
        name: student.name,
        admNo: student.admNo,
        dept: student.dept
      }
    })
  } catch (err) {
    console.error('QR generation error:', err)
    res.status(500).json({ message: "QR generation failed" })
  }
})

// Gate pass verification page
app.get('/gatepass/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).send('<h2>Student not found</h2>')

    // Find gatepass
    let gatePass = null
    if (student.groupId) {
      gatePass = await GatePass.findById(student.groupId)
    }
    if (!gatePass) {
      gatePass = await GatePass.findOne({ studentId: student._id })
    }
    if (!gatePass) {
      gatePass = {
        _id: null,
        purpose: student.purpose || 'N/A',
        date: student.date || null,
        returnTime: student.returnTime || null,
        groupMembers: []
      }
    }

    // Build members list
    const members = []
    members.push({
      _id: student._id,
      name: student.name,
      admNo: student.admNo,
      dept: student.dept,
      sem: student.sem,
      image: student.image ? `data:image/jpeg;base64,${student.image.toString('base64')}` : null,
      verified: student.verified || false
    })

    // Process group members
    for (const gm of gatePass.groupMembers || []) {
      const admNo = gm.admissionNo || gm.admNo
      let memberDoc = null
      if (admNo) {
        memberDoc = await Student.findOne({ admNo: Number(admNo) })
      }

      members.push({
        _id: memberDoc ? memberDoc._id : ('new-' + (admNo || gm.name)),
        name: gm.name || (memberDoc && memberDoc.name) || 'Unknown',
        admNo: admNo || (memberDoc && memberDoc.admNo) || '',
        dept: gm.dept || (memberDoc && memberDoc.dept) || '',
        sem: (memberDoc && memberDoc.sem) || gm.sem || '-',
        image: memberDoc && memberDoc.image ? `data:image/jpeg;base64,${memberDoc.image.toString('base64')}` : null,
        verified: (memberDoc && memberDoc.verified) || false
      })
    }

    // Build table rows with checkboxes
    const tableRows = members.map(m => `
      <tr>
        <td><img src="${m.image || 'https://via.placeholder.com/50'}" style="width:50px;height:50px;border-radius:4px;object-fit:cover;"></td>
        <td>${m.name}</td>
        <td>${m.admNo}</td>
        <td>${m.dept}</td>
        <td>${m.sem}</td>
        <td>${gatePass.purpose || 'N/A'}</td>
        <td>${gatePass.date ? new Date(gatePass.date).toLocaleString() : 'N/A'}</td>
        <td>${gatePass.returnTime || 'N/A'}</td>
        <td>
          <input type="checkbox" 
                 id="verify-${m._id}" 
                 name="verify-${m._id}" 
                 data-student-id="${m._id}" 
                 ${m.verified ? 'checked disabled' : ''}
                 autocomplete="off">
        </td>
      </tr>
    `).join('')

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Gate Pass Verification</title>
        <style>
          body{font-family:Arial;background:#f0f4f8;padding:30px;display:flex;justify-content:center}
          .container{background:#fff;padding:25px;border-radius:12px;box-shadow:0 5px 20px rgba(0,0,0,0.15);max-width:1200px;width:100%}
          table{width:100%;border-collapse:collapse}
          th,td{padding:10px;text-align:left;border-bottom:1px solid #ddd}
          th{background:#f8f9fa}
          img{display:block}
          button{padding:10px 20px;border:none;background:#3498db;color:#fff;border-radius:6px;cursor:pointer;margin-top:15px}
          .verified{color:green;font-weight:bold}
        </style>
      </head>
      <body>
        <div class="container">
          <h2>Gate Pass Verification</h2>
          <p><strong>Purpose:</strong> ${gatePass.purpose || 'N/A'}</p>
          <p><strong>Date:</strong> ${gatePass.date ? new Date(gatePass.date).toLocaleString() : 'N/A'}</p>
          <p><strong>Return Time:</strong> ${gatePass.returnTime || 'N/A'}</p>

          <table>
            <thead>
              <tr>
                <th>Photo</th><th>Name</th><th>Admission No</th><th>Department</th><th>Semester</th><th>Purpose</th><th>Date</th><th>Return Time</th><th>Verified</th>
              </tr>
            </thead>
            <tbody>
              ${tableRows}
            </tbody>
          </table>

          <button id="submitBtn">Submit Verifications</button>
        </div>

        <script>
          document.getElementById('submitBtn').addEventListener('click', async () => {
            const verifiedIds = Array.from(document.querySelectorAll('input[type="checkbox"]:checked:not(:disabled)')).map(cb => cb.dataset.studentId);
            if (!verifiedIds.length) return alert('Select at least one student to verify');
            try {
              const res = await fetch('/verify-students', {
                method: 'POST',
                headers: {'Content-Type':'application/json'},
                body: JSON.stringify({ studentIds: verifiedIds })
              });
              if (res.ok) { 
                alert('Students verified successfully'); 
                location.reload(); 
              } else { 
                alert('Verification failed'); 
              }
            } catch (err) { 
              alert('Server error'); 
            }
          });
        </script>
      </body>
      </html>
    `
    res.send(html)

  } catch (err) {
    console.error('Gate pass verification error:', err)
    res.status(500).send('<h2>Server Error</h2>')
  }
})

// Get student by ID
app.get('/student/:id', async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
    if (!student) {
      return res.status(404).json({ message: 'Student not found' })
    }
    res.json(student)
  } catch (error) {
    console.error('Error fetching student:', error)
    res.status(500).json({ message: 'Error fetching student', error: error.message })
  }
})

// Create new gate pass
app.post('/gatepasses', async (req, res) => {
  try {
    const { studentId, purpose, date, groupMembers, returnTime } = req.body
    
    // Create pass
    const gatePass = new GatePass({
      studentId,
      purpose,
      date,
      groupMembers,
      returnTime,
      status: 'approved'
    })
    
    await gatePass.save()
    
    res.json({ 
      message: 'Gate pass created successfully',
      pass: gatePass
    })
  } catch (error) {
    console.error('Gate pass creation error:', error)
    res.status(500).json({ message: 'Failed to create gate pass', error: error.message })
  }
})

// Verify students route
app.post('/verify-students', async (req, res) => {
  const { studentIds } = req.body
  try {
    await Student.updateMany(
      { _id: { $in: studentIds } },
      { verified: true }
    )
    res.status(200).json({ message: 'Students verified successfully' })
  } catch (error) {
    console.error('Verification error:', error)
    res.status(500).json({ message: 'Verification failed', error: error.message })
  }
})

// Get gate pass history for a student (removes duplicates)
app.get('/gatepasses/:studentId', async (req, res) => {
  try {
    const studentId = req.params.studentId
    const student = await Student.findById(studentId)
    if (!student) return res.status(404).json({ message: 'Student not found' })

    // Find all passes where student is main or a group member
    const passes = await GatePass.find({
      $or: [
        { studentId },
        { 'groupMembers.admNo': student.admNo },
        { 'groupMembers.admissionNo': student.admNo }
      ]
    }).sort({ createdAt: -1 })

    // Remove duplicates by comparing GatePass._id
    const uniquePasses = []
    const seenIds = new Set()

    for (const pass of passes) {
      if (!seenIds.has(pass._id.toString())) {
        seenIds.add(pass._id.toString())
        uniquePasses.push(pass)
      }
    }

    res.status(200).json(uniquePasses)
  } catch (err) {
    console.error('Error fetching gate passes:', err)
    res.status(500).json({ message: 'Failed to fetch gate passes', error: err.message })
  }
})

// Tutor registration route
app.post('/tutor/register', upload.single('image'), async (req, res) => {
  try {
    const { empId, name, dept, email, password } = req.body

    // Check if tutor already exists
    const existingTutor = await Tutor.findOne({ 
      $or: [
        { empId: empId },
        { email: email }
      ]
    })

    if (existingTutor) {
      return res.status(400).json({ 
        message: 'Tutor with this employee ID or email already exists' 
      })
    }

    // Hash password for tutor
    const saltRounds = 10
    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const tutor = new Tutor({
      empId,
      name,
      dept,
      email,
      password: hashedPassword,
      image: req.file ? req.file.buffer : undefined,
      verified: false,
      status: 'pending'
    })

    await tutor.save()
    res.json({ message: 'Tutor registered successfully and awaiting admin verification' })
  } catch (error) {
    console.error('Tutor registration error:', error)
    res.status(500).json({ message: 'Tutor registration failed', error: error.message })
  }
})

// Tutor login route
app.post('/tutor/login', async (req, res) => {
  try {
    const { empId, password } = req.body;

    const tutor = await Tutor.findOne({ empId: empId });
    if (tutor && await bcrypt.compare(password, tutor.password)) {
      // ✅ Check if tutor is verified by admin
      if (!tutor.verified) {
        return res.status(403).json({ 
          message: 'Your account is pending admin approval. Please wait for approval.' 
        });
      }
      
      res.json({ 
        message: 'Login successful', 
        tutor: {
          _id: tutor._id,
          name: tutor.name,
          empId: tutor.empId,
          dept: tutor.dept,
          email: tutor.email
        }
      });
    } else {
      res.status(401).json({ message: 'Invalid credentials' });
    }
  } catch (error) {
    console.error('Tutor login error:', error);
    res.status(500).json({ message: 'Server error during login' });
  }
});

// Get approved gate passes for a tutor's students
app.get('/tutor/:id/approved-passes', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    // Find all students with this tutor
    const students = await Student.find({ tutorName: tutor.name });
    const studentIds = students.map(s => s._id);
    
    // Find approved passes for these students, sorted by date
    const passes = await GatePass.find({ 
      studentId: { $in: studentIds },
      status: 'approved'
    })
    .populate('studentId', 'name admNo dept sem')
    .sort({ createdAt: -1 });
    
    // Format the response with more details
    const formattedPasses = passes.map(pass => {
      const student = pass.studentId;
      return {
        _id: pass._id,
        purpose: pass.purpose,
        date: pass.date,
        returnTime: pass.returnTime,
        groupMembers: pass.groupMembers,
        createdAt: pass.createdAt,
        approvedAt: pass.approvedAt,
        studentName: student.name,
        studentAdmNo: student.admNo,
        studentDept: student.dept,
        studentSem: student.sem,
        studentId: student._id
      };
    });
    
    res.json(formattedPasses);
  } catch (error) {
    console.error('Error fetching approved passes:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Get tutor by ID
app.get('/tutor/:id', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' })
    }
    res.json(tutor)
  } catch (error) {
    console.error('Error fetching tutor:', error)
    res.status(500).json({ message: 'Error fetching tutor', error: error.message })
  }
})

// Get students under a tutor
app.get('/tutor/:id/students', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id)
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' })
    }
    
    const students = await Student.find({ tutorName: tutor.name })
    res.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({ message: 'Error fetching students', error: error.message })
  }
})

// Approve/reject gate pass - UPDATED
app.post('/tutor/gatepass/:id/approve', async (req, res) => {
  try {
    const { status, tutorId } = req.body;
    
    // Update gate pass
    const updatedPass = await GatePass.findByIdAndUpdate(
      req.params.id,
      { 
        status,
        approvedBy: status === 'approved' ? tutorId : null,
        approvedAt: status === 'approved' ? new Date() : null
      },
      { new: true }
    ).populate('studentId', 'name admNo dept');
    
    if (!updatedPass) {
      return res.status(404).json({ message: 'Gate pass not found' });
    }

    // Update all students associated with this gate pass
    await Student.updateMany(
      { groupId: req.params.id },
      { 
        passStatus: status,
        purpose: status === 'approved' ? updatedPass.purpose : null,
        date: status === 'approved' ? updatedPass.date : null,
        returnTime: status === 'approved' ? updatedPass.returnTime : null
      }
    );

    // Also update the main student
    await Student.findByIdAndUpdate(
      updatedPass.studentId._id,
      { 
        passStatus: status,
        purpose: status === 'approved' ? updatedPass.purpose : null,
        date: status === 'approved' ? updatedPass.date : null,
        returnTime: status === 'approved' ? updatedPass.returnTime : null
      }
    );
    
    res.json({ 
      message: `Gate pass ${status} successfully`,
      gatePass: updatedPass
    });
  } catch (error) {
    console.error('Error updating gate pass:', error);
    res.status(500).json({ message: 'Error updating gate pass', error: error.message });
  }
});

// Get pending gate passes for a tutor's students - UPDATED
app.get('/tutor/:id/pending-passes', async (req, res) => {
  try {
    const tutor = await Tutor.findById(req.params.id);
    if (!tutor) {
      return res.status(404).json({ message: 'Tutor not found' });
    }
    
    // Find all students with this tutor
    const students = await Student.find({ tutorName: tutor.name });
    const studentIds = students.map(s => s._id);
    
    // Find pending passes for these students, sorted by date
    const passes = await GatePass.find({ 
      studentId: { $in: studentIds },
      status: 'pending'
    })
    .populate('studentId', 'name admNo dept sem')
    .sort({ createdAt: -1 });
    
    // Format the response with more details
    const formattedPasses = passes.map(pass => {
      const student = pass.studentId;
      return {
        _id: pass._id,
        purpose: pass.purpose,
        date: pass.date,
        returnTime: pass.returnTime,
        groupMembers: pass.groupMembers,
        createdAt: pass.createdAt,
        studentName: student.name,
        studentAdmNo: student.admNo,
        studentDept: student.dept,
        studentSem: student.sem,
        studentId: student._id
      };
    });
    
    res.json(formattedPasses);
  } catch (error) {
    console.error('Error fetching pending passes:', error);
    res.status(500).json({ 
      message: 'Server error',
      error: error.message
    });
  }
});

// Get approved gate passes for student dashboard
app.get('/student/approved-passes/:studentId', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const passes = await GatePass.find({
      $or: [
        { studentId: studentId },
        { 'groupMembers.admNo': { $in: [await getStudentAdmNo(studentId)] } }
      ],
      status: 'approved'
    })
    .populate('studentId', 'name admNo dept')
    .sort({ createdAt: -1 });
    
    res.json(passes);
  } catch (error) {
    console.error('Error fetching approved passes:', error);
    res.status(500).json({ message: 'Error fetching approved passes', error: error.message });
  }
});

// Helper function to get student admission number
async function getStudentAdmNo(studentId) {
  const student = await Student.findById(studentId);
  return student ? student.admNo : null;
}

// Admin login route
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    // Hardcoded admin credentials (should be stored securely in production)
    if (username === 'admin' && password === '12345') {
      res.json({ message: 'Admin login successful' })
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' })
    }
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ message: 'Server error during admin login' })
  }
})

// Get all students route
app.get('/admin/students', async (req, res) => {
  try {
    const students = await Student.find({})
    res.json(students)
  } catch (error) {
    console.error('Error fetching students:', error)
    res.status(500).json({ message: 'Error fetching students', error: error.message })
  }
})

// Get all gate pass requests
app.get('/admin/gate-passes', async (req, res) => {
  try {
    const passes = await Student.find({ 
      purpose: { $exists: true, $ne: null },
      date: { $exists: true, $ne: null }
    })
    res.json(passes)
  } catch (error) {
    console.error('Error fetching gate passes:', error)
    res.status(500).json({ message: 'Error fetching gate passes', error: error.message })
  }
})

// ========== NEW ROUTES ADDED FROM SECOND FILE ==========

// Get all tutors route
app.get('/admin/tutors', async (req, res) => {
  try {
    const tutors = await Tutor.find({});
    res.json(tutors);
  } catch (error) {
    console.error('Error fetching tutors:', error);
    res.status(500).json({ message: 'Error fetching tutors', error: error.message });
  }
});

// Get all gate passes with detailed information
app.get('/admin/gate-passes-detailed', async (req, res) => {
  try {
    const passes = await GatePass.find({})
      .populate('studentId', 'name admNo dept tutorName')
      .sort({ date: -1 });
    
    const formattedPasses = passes.map(pass => ({
      _id: pass._id,
      admNo: pass.studentId?.admNo,
      name: pass.studentId?.name,
      dept: pass.studentId?.dept,
      tutorName: pass.studentId?.tutorName,
      purpose: pass.purpose,
      date: pass.date,
      returnTime: pass.returnTime,
      status: pass.status,
      groupMembers: pass.groupMembers
    }));
    
    res.json(formattedPasses);
  } catch (error) {
    console.error('Error fetching detailed gate passes:', error);
    res.status(500).json({ message: 'Error fetching gate passes', error: error.message });
  }
});

// Delete student route
app.delete('/admin/students/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Error deleting student', error: error.message });
  }
});

// Delete tutor route
app.delete('/admin/tutors/:id', async (req, res) => {
  try {
    await Tutor.findByIdAndDelete(req.params.id);
    res.json({ message: 'Tutor deleted successfully' });
  } catch (error) {
    console.error('Error deleting tutor:', error);
    res.status(500).json({ message: 'Error deleting tutor', error: error.message });
  }
});

// Update gate pass status
app.put('/admin/gate-passes/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const updatedPass = await GatePass.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );
    res.json({ message: 'Gate pass updated successfully', gatePass: updatedPass });
  } catch (error) {
    console.error('Error updating gate pass status:', error);
    res.status(500).json({ message: 'Error updating gate pass', error: error.message });
  }
});

// ========== TUTOR APPROVAL ROUTE - MOVED ABOVE 404 HANDLER ==========

// Approve tutor route - FIXED VERSION
app.put('/admin/tutors/:id/verify', async (req, res) => {
  try {
    const tutorId = req.params.id;
    console.log('🔄 Attempting to approve tutor with ID:', tutorId);

    // Check if tutor exists
    const tutor = await Tutor.findById(tutorId);
    if (!tutor) {
      console.log('❌ Tutor not found with ID:', tutorId);
      return res.status(404).json({ message: 'Tutor not found' });
    }

    // Update tutor verification status
    const updatedTutor = await Tutor.findByIdAndUpdate(
      tutorId,
      { 
        verified: true,
        status: 'approved'
      },
      { new: true }
    );
    
    console.log('✅ Tutor approved successfully:', updatedTutor.name);
    res.json({ 
      message: 'Tutor approved successfully',
      tutor: updatedTutor
    });
  } catch (error) {
    console.error('❌ Error approving tutor:', error);
    res.status(500).json({ 
      message: 'Error approving tutor', 
      error: error.message 
    });
  }
});

// ========== END OF NEW ROUTES ==========

// Delete gate pass route
app.delete('/admin/gatepasses/:id', async (req, res) => {
  try {
    await GatePass.findByIdAndDelete(req.params.id);
    res.json({ message: 'Gate pass deleted successfully' });
  } catch (error) {
    console.error('Error deleting gate pass:', error);
    res.status(500).json({ message: 'Error deleting gate pass', error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error)
  res.status(500).json({ 
    message: 'Internal server error',
    error: error.message 
  })
})

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' })
})

app.listen(5000, () => {
  console.log("Server is running on port 5000")
})