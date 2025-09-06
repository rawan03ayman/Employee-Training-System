// Complete Enhanced script.js with all features working and real data integration

// API Configuration
const API_BASE_URL = 'http://localhost:5172/api';
let currentUser = null;
let authToken = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    checkAuthStatus();
});

// Initialize the application
function initializeApp() {
    const savedToken = localStorage.getItem('authToken');
    const savedUser = localStorage.getItem('currentUser');
    
    if (savedToken && savedUser) {
        authToken = savedToken;
        currentUser = JSON.parse(savedUser);
        showDashboard();
    } else {
        showLoginPage();
    }
}

// Setup event listeners
function setupEventListeners() {
    document.getElementById('loginForm').addEventListener('submit', handleLogin);
    document.getElementById('logoutBtn').addEventListener('click', handleLogout);
    document.getElementById('employeeLogoutBtn').addEventListener('click', handleLogout);
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
    
    setupModalEvents();
    setupFormSubmissions();
}

// Check authentication status
function checkAuthStatus() {
    const token = localStorage.getItem('authToken');
    if (token) {
        authToken = token;
    }
}

// Handle login with proper error handling
async function handleLogin(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    const loginData = {
        username: formData.get('username'),
        password: formData.get('password')
    };
    
    try {
        console.log('Attempting login with:', loginData);
        const response = await fetch(`${API_BASE_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(loginData)
        });
        
        console.log('Login response status:', response.status);
        
        if (response.ok) {
            const data = await response.json();
            console.log('Login successful:', data);
            
            authToken = data.token;
            currentUser = data.user;
            
            localStorage.setItem('authToken', authToken);
            localStorage.setItem('currentUser', JSON.stringify(currentUser));
            
            showDashboard();
            clearLoginError();
        } else {
            const errorText = await response.text();
            console.error('Login failed:', errorText);
            showLoginError('Invalid username or password');
        }
    } catch (error) {
        console.error('Login error:', error);
        showLoginError('Connection error. Please try again.');
    }
}

// Temporary function to create test user
async function createTestUser() {
    const testUser = {
        username: "admin",
        email: "admin@test.com",
        password: "admin123",
        firstName: "Test",
        lastName: "Admin",
        role: 0, // 0 = Admin
        department: "IT"
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(testUser)
        });
        
        if (response.ok) {
            showNotification('Test user created! Username: admin, Password: admin123', 'success');
        } else {
            const errorText = await response.text();
            console.error('Registration error:', errorText);
            if (errorText.includes('Username already exists')) {
                showNotification('Test user already exists. You can login with: admin / admin123', 'info');
            } else {
                showNotification('Error creating user: ' + errorText, 'error');
            }
        }
    } catch (error) {
        console.error('Registration error:', error);
        showNotification('Connection error during registration', 'error');
    }
}

// Handle logout
function handleLogout() {
    authToken = null;
    currentUser = null;
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    showLoginPage();
}

// Show login page
function showLoginPage() {
    document.getElementById('loginPage').classList.remove('hidden');
    document.getElementById('adminDashboard').classList.add('hidden');
    document.getElementById('employeeDashboard').classList.add('hidden');
}

// Show appropriate dashboard
function showDashboard() {
    document.getElementById('loginPage').classList.add('hidden');
    
    if (currentUser.role === 'Admin') {
        document.getElementById('adminDashboard').classList.remove('hidden');
        document.getElementById('employeeDashboard').classList.add('hidden');
        document.getElementById('adminUserName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        loadAdminDashboard();
    } else {
        document.getElementById('employeeDashboard').classList.remove('hidden');
        document.getElementById('adminDashboard').classList.add('hidden');
        document.getElementById('employeeUserName').textContent = `${currentUser.firstName} ${currentUser.lastName}`;
        loadEmployeeDashboard();
    }
}

// Show/clear login errors
function showLoginError(message) {
    document.getElementById('loginError').textContent = message;
}

function clearLoginError() {
    document.getElementById('loginError').textContent = '';
}

// Handle navigation
function handleNavigation(e) {
    e.preventDefault();
    const targetSection = e.target.getAttribute('data-section');
    
    document.querySelectorAll('.nav-link').forEach(link => {
        link.classList.remove('active');
    });
    e.target.classList.add('active');
    
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    document.getElementById(targetSection).classList.add('active');
    
    loadSectionData(targetSection);
}

// Load section-specific data
function loadSectionData(section) {
    switch(section) {
        case 'overview':
            loadAdminOverview();
            break;
        case 'courses':
            loadCourses();
            break;
        case 'users':
            loadUsers();
            break;
        case 'enrollments':
            loadEnrollments();
            break;
        case 'reports':
            loadReports();
            break;
        case 'emp-overview':
            loadEmployeeOverview();
            break;
        case 'my-courses':
            loadMyCourses();
            break;
        case 'available-courses':
            loadAvailableCourses();
            break;
        case 'progress':
            loadProgress();
            break;
        case 'certificates':
            loadCertificates();
            break;
    }
}

// Load admin dashboard
async function loadAdminDashboard() {
    await loadAdminOverview();
}

// FIXED: Load admin overview with proper status handling
async function loadAdminOverview() {
    try {
        // Show loading state
        document.getElementById('totalCourses').textContent = 'Loading...';
        document.getElementById('totalUsers').textContent = 'Loading...';
        document.getElementById('totalEnrollments').textContent = 'Loading...';
        document.getElementById('completionRate').textContent = 'Loading...';
        
        const [courses, users, enrollments] = await Promise.all([
            apiCall('/courses'),
            apiCall('/users'),
            apiCall('/enrollments')
        ]);
        
        // Update UI with real data
        document.getElementById('totalCourses').textContent = courses.length;
        document.getElementById('totalUsers').textContent = users.filter(u => 
            u.role === 'Employee' || u.role === 1 || u.role === '1'
        ).length;
        document.getElementById('totalEnrollments').textContent = enrollments.length;
        
        // FIXED: Handle status comparison properly
        const completedEnrollments = enrollments.filter(e => {
            if (typeof e.status === 'string') {
                return e.status === 'Completed';
            } else {
                return e.status === 2; // 2 = Completed enum value
            }
        }).length;
        
        const completionRate = enrollments.length > 0 ? Math.round((completedEnrollments / enrollments.length) * 100) : 0;
        document.getElementById('completionRate').textContent = `${completionRate}%`;
        
        // Load recent activities from real data
        loadRecentActivities(enrollments, courses, users);
        
    } catch (error) {
        console.error('Error loading admin overview:', error);
        showNotification('Error loading dashboard data: ' + error.message, 'error');
        
        // Show error state
        document.getElementById('totalCourses').textContent = 'Error';
        document.getElementById('totalUsers').textContent = 'Error';
        document.getElementById('totalEnrollments').textContent = 'Error';
        document.getElementById('completionRate').textContent = 'Error';
    }
}

// FIXED: Handle status in recent activities
function loadRecentActivities(enrollments, courses, users) {
    if (!enrollments || enrollments.length === 0) {
        const container = document.getElementById('recentActivities');
        container.innerHTML = '<div class="empty-state"><p>No recent activities</p></div>';
        return;
    }

    const recentEnrollments = enrollments
        .sort((a, b) => new Date(b.enrolledAt) - new Date(a.enrolledAt))
        .slice(0, 5);
    
    const activities = recentEnrollments.map(enrollment => {
        const user = users.find(u => u.id === enrollment.userId);
        const course = courses.find(c => c.id === enrollment.courseId);
        const timeAgo = getTimeAgo(new Date(enrollment.enrolledAt));
        
        // FIXED: Handle status properly
        let isCompleted = false;
        if (typeof enrollment.status === 'string') {
            isCompleted = enrollment.status === 'Completed';
        } else {
            isCompleted = enrollment.status === 2; // 2 = Completed
        }
        
        return {
            icon: isCompleted ? 'fa-graduation-cap' : 'fa-book',
            text: `${user ? `${user.firstName} ${user.lastName}` : 'Unknown'} ${isCompleted ? 'completed' : 'enrolled in'} "${course ? course.title : 'Unknown Course'}"`,
            time: timeAgo
        };
    });
    
    const container = document.getElementById('recentActivities');
    container.innerHTML = activities.map(activity => `
        <div class="activity-item">
            <div class="activity-icon">
                <i class="fas ${activity.icon}"></i>
            </div>
            <div class="activity-content">
                <div class="activity-text">${activity.text}</div>
                <div class="activity-time">${activity.time}</div>
            </div>
        </div>
    `).join('');
}

// Load courses with real data
async function loadCourses() {
    try {
        const courses = await apiCall('/courses');
        const container = document.getElementById('coursesGrid');
        
        if (courses.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-book"></i>
                    <h3>No Courses Available</h3>
                    <p>Start by creating your first course</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = courses.map(course => `
            <div class="course-card">
                <div class="course-header">
                    <div class="course-title">${course.title}</div>
                    <div class="course-meta">
                        <span>${course.category}</span>
                        <span>${course.duration}h</span>
                    </div>
                </div>
                <div class="course-body">
                    <div class="course-description">${course.description}</div>
                    <div class="course-details">
                        <span class="course-tag">Level: ${course.level}</span>
                        <span class="course-tag">Instructor: ${course.instructor}</span>
                        <span class="course-tag">Max: ${course.maxParticipants}</span>
                    </div>
                    <div class="course-actions">
                        <button class="btn btn-primary" onclick="viewCourse('${course.id}')">
                            <i class="fas fa-eye"></i> View
                        </button>
                        <button class="btn btn-warning" onclick="editCourse('${course.id}')">
                            <i class="fas fa-edit"></i> Edit
                        </button>
                        <button class="btn btn-danger" onclick="deleteCourse('${course.id}')">
                            <i class="fas fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading courses:', error);
        showNotification('Error loading courses', 'error');
        document.getElementById('coursesGrid').innerHTML = '<div class="empty-state"><p>Error loading courses</p></div>';
    }
}

// ENHANCED: Better user loading with role handling
async function loadUsers() {
    try {
        const users = await apiCall('/users');
        console.log('All users loaded:', users);
        
        const tbody = document.getElementById('usersTableBody');
        
        if (users.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No users found</td></tr>';
            return;
        }
        
        tbody.innerHTML = users.map(user => {
            // Display role properly regardless of how it's stored
            let roleDisplay = user.role;
            if (user.role === 0 || user.role === '0') roleDisplay = 'Admin';
            if (user.role === 1 || user.role === '1') roleDisplay = 'Employee';
            
            return `
                <tr>
                    <td>${user.firstName} ${user.lastName}</td>
                    <td>${user.email}</td>
                    <td>${user.department || 'Not specified'}</td>
                    <td>
                        <span class="role-badge role-${roleDisplay.toLowerCase()}">
                            ${roleDisplay}
                        </span>
                    </td>
                    <td>
                        <span class="status-badge ${user.isActive ? 'status-active' : 'status-inactive'}">
                            ${user.isActive ? 'Active' : 'Inactive'}
                        </span>
                    </td>
                    <td>
                        <button class="btn btn-warning" onclick="editUser('${user.id}')">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteUser('${user.id}')" 
                                ${user.username === 'admin' ? 'disabled title="Cannot delete admin user"' : ''}>
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        // Count employees for debugging
        const employeeCount = users.filter(u => u.role === 'Employee' || u.role === 1 || u.role === '1').length;
        const adminCount = users.filter(u => u.role === 'Admin' || u.role === 0 || u.role === '0').length;
        console.log(`Found ${employeeCount} employees and ${adminCount} admins out of ${users.length} total users`);
        
    } catch (error) {
        console.error('Error loading users:', error);
        showNotification('Error loading users: ' + error.message, 'error');
        document.getElementById('usersTableBody').innerHTML = '<tr><td colspan="6" class="empty-state">Error loading users</td></tr>';
    }
}

// FIXED: Load enrollments with proper status handling
async function loadEnrollments() {
    try {
        console.log('Loading enrollments...');
        
        const [enrollments, users, courses] = await Promise.all([
            apiCall('/enrollments'),
            apiCall('/users'),
            apiCall('/courses')
        ]);
        
        console.log('Sample enrollment for debugging:', enrollments[0]);
        
        const tbody = document.getElementById('enrollmentsTableBody');
        
        if (enrollments.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6" class="empty-state">No enrollments found. Create some course assignments to see them here.</td></tr>';
            return;
        }
        
        tbody.innerHTML = enrollments.map(enrollment => {
            const user = users.find(u => u.id === enrollment.userId);
            const course = courses.find(c => c.id === enrollment.courseId);
            
            // Handle missing user or course data gracefully
            const userName = user ? `${user.firstName} ${user.lastName}` : `Unknown User (ID: ${enrollment.userId})`;
            const courseName = course ? course.title : `Unknown Course (ID: ${enrollment.courseId})`;
            
            // FIXED: Handle enrollment status properly (could be string or number)
            let statusText = '';
            let statusClass = '';
            
            if (typeof enrollment.status === 'string') {
                statusText = enrollment.status;
                statusClass = enrollment.status.toLowerCase();
            } else {
                // Handle enum values: 0=Enrolled, 1=InProgress, 2=Completed, 3=Dropped
                switch (enrollment.status) {
                    case 0:
                        statusText = 'Enrolled';
                        statusClass = 'enrolled';
                        break;
                    case 1:
                        statusText = 'InProgress';
                        statusClass = 'inprogress';
                        break;
                    case 2:
                        statusText = 'Completed';
                        statusClass = 'completed';
                        break;
                    case 3:
                        statusText = 'Dropped';
                        statusClass = 'dropped';
                        break;
                    default:
                        statusText = 'Unknown';
                        statusClass = 'unknown';
                }
            }
            
            return `
                <tr>
                    <td>${userName}</td>
                    <td>${courseName}</td>
                    <td>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${enrollment.progress || 0}%"></div>
                        </div>
                        <span>${enrollment.progress || 0}%</span>
                    </td>
                    <td>
                        <span class="status-badge status-${statusClass}">
                            ${statusText}
                        </span>
                    </td>
                    <td>${new Date(enrollment.enrolledAt).toLocaleDateString()}</td>
                    <td>
                        <button class="btn btn-primary" onclick="viewEnrollment('${enrollment.id}')">
                            <i class="fas fa-eye"></i>
                        </button>
                        <button class="btn btn-warning" onclick="updateProgress('${enrollment.id}')">
                            <i class="fas fa-chart-line"></i>
                        </button>
                        <button class="btn btn-danger" onclick="deleteEnrollment('${enrollment.id}')">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>
            `;
        }).join('');
        
        console.log('Enrollments loaded successfully');
        
    } catch (error) {
        console.error('Error loading enrollments:', error);
        showNotification('Error loading enrollments: ' + error.message, 'error');
        
        const tbody = document.getElementById('enrollmentsTableBody');
        tbody.innerHTML = `<tr><td colspan="6" class="empty-state">Error loading enrollments: ${error.message}</td></tr>`;
    }
}

// Load reports with real data
async function loadReports() {
    try {
        const [courses, enrollments, users] = await Promise.all([
            apiCall('/courses'),
            apiCall('/enrollments'),
            apiCall('/users')
        ]);
        
        await Promise.all([
            createCoursePerformanceChart(courses, enrollments),
            createEmployeeProgressChart(enrollments),
            createDepartmentChart(users, enrollments)
        ]);
    } catch (error) {
        console.error('Error loading reports:', error);
        showNotification('Error loading reports', 'error');
    }
}

// FIXED: Handle add course with proper field mapping for backend validation
async function handleAddCourse(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    // Validate required fields
    const title = formData.get('title');
    const description = formData.get('description');
    const category = formData.get('category');
    const level = formData.get('level');
    const instructor = formData.get('instructor');
    
    if (!title || !description || !category || !level || !instructor) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }
    
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    
    const courseData = {
        title: title,
        description: description,
        category: category,
        duration: parseInt(formData.get('duration')) || 1,
        level: level,
        instructor: instructor,
        maxParticipants: parseInt(formData.get('maxParticipants')) || 20,
        startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
        endDate: endDate ? new Date(endDate).toISOString() : new Date(Date.now() + 30*24*60*60*1000).toISOString() // 30 days from now
    };
    
    console.log('Sending course data:', courseData);
    
    try {
        const response = await apiCall('/courses', 'POST', courseData);
        console.log('Course created successfully:', response);
        
        closeModal('addCourseModal');
        loadCourses();
        showNotification('Course added successfully!', 'success');
        e.target.reset();
    } catch (error) {
        console.error('Error adding course:', error);
        showNotification('Error adding course: ' + error.message, 'error');
    }
}

// FIXED: Handle add user with better error handling and validation
async function handleAddUser(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const username = formData.get('username');
    const email = formData.get('email');
    const firstName = formData.get('firstName');
    const lastName = formData.get('lastName');
    const password = formData.get('password');
    const roleValue = formData.get('role');
    const department = formData.get('department');
    
    // Basic validation
    if (!username || !email || !firstName || !lastName || !password || !roleValue || !department) {
        showNotification('Please fill in all required fields', 'warning');
        return;
    }
    
    // Check if username already exists before making the API call
    try {
        const existingUsers = await apiCall('/users');
        const usernameExists = existingUsers.some(user => 
            user.username.toLowerCase() === username.toLowerCase()
        );
        
        if (usernameExists) {
            showNotification(`Username "${username}" already exists. Please choose a different username.`, 'warning');
            document.getElementById('userUsername').focus();
            document.getElementById('userUsername').style.borderColor = '#e74c3c';
            return;
        }
        
        const emailExists = existingUsers.some(user => 
            user.email.toLowerCase() === email.toLowerCase()
        );
        
        if (emailExists) {
            showNotification(`Email "${email}" already exists. Please use a different email.`, 'warning');
            document.getElementById('userEmail').focus();
            document.getElementById('userEmail').style.borderColor = '#e74c3c';
            return;
        }
        
    } catch (error) {
        console.error('Error checking existing users:', error);
        // Continue with creation attempt even if check fails
    }
    
    const userData = {
        firstName: firstName,
        lastName: lastName,
        username: username,
        email: email,
        password: password,
        role: parseInt(roleValue), // Ensure role is integer: 0=Admin, 1=Employee
        department: department
    };
    
    console.log('Sending user data:', userData);
    
    try {
        const response = await apiCall('/auth/register', 'POST', userData);
        console.log('User created successfully:', response);
        
        closeModal('addUserModal');
        loadUsers();
        showNotification(`User "${userData.firstName} ${userData.lastName}" created successfully!`, 'success');
        e.target.reset();
        
        // Reset field styles
        document.getElementById('userUsername').style.borderColor = '';
        document.getElementById('userEmail').style.borderColor = '';
        
    } catch (error) {
        console.error('Error adding user:', error);
        
        // Handle specific error cases
        if (error.message.includes('Username already exists')) {
            showNotification(`Username "${username}" is already taken. Please choose a different username.`, 'warning');
            document.getElementById('userUsername').focus();
            document.getElementById('userUsername').style.borderColor = '#e74c3c';
        } else if (error.message.includes('Email already exists')) {
            showNotification(`Email "${email}" is already registered. Please use a different email.`, 'warning');
            document.getElementById('userEmail').focus();
            document.getElementById('userEmail').style.borderColor = '#e74c3c';
        } else {
            showNotification('Error adding user: ' + error.message, 'error');
        }
    }
}

// FIXED: Handle assign course with better error handling
async function handleAssignCourse(e) {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    const userId = formData.get('employeeId');
    const courseId = formData.get('courseId');
    
    if (!userId || !courseId) {
        showNotification('Please select both an employee and a course', 'warning');
        return;
    }
    
    const assignmentData = {
        userId: userId,
        courseId: courseId
    };
    
    console.log('Sending assignment data:', assignmentData);
    
    try {
        const response = await apiCall('/enrollments', 'POST', assignmentData);
        console.log('Course assigned successfully:', response);
        
        closeModal('assignCourseModal');
        loadEnrollments();
        showNotification('Course assigned successfully!', 'success');
        e.target.reset();
    } catch (error) {
        console.error('Error assigning course:', error);
        
        // Handle specific error cases
        if (error.message.includes('already enrolled')) {
            showNotification('This employee is already enrolled in this course', 'warning');
        } else if (error.message.includes('not found')) {
            showNotification('Employee or course not found', 'error');
        } else {
            showNotification('Error assigning course: ' + error.message, 'error');
        }
    }
}

// FIXED: Load assignment data for dropdowns with proper role filtering
async function loadAssignmentData() {
    try {
        console.log('Loading assignment data...');
        
        const [users, courses] = await Promise.all([
            apiCall('/users'),
            apiCall('/courses')
        ]);
        
        console.log('Users loaded:', users);
        console.log('Courses loaded:', courses);
        
        const employeeSelect = document.getElementById('assignEmployee');
        const courseSelect = document.getElementById('assignCourse');
        
        // Filter employees - check for both string and integer role values
        const employees = users.filter(user => {
            return user.role === 'Employee' || user.role === 1 || user.role === '1';
        });
        
        console.log('Filtered employees:', employees);
        
        // Clear and populate employee dropdown
        employeeSelect.innerHTML = '<option value="">Select Employee</option>';
        
        if (employees.length === 0) {
            employeeSelect.innerHTML += '<option disabled>No employees found. Create some employees first.</option>';
            console.warn('No employees found in the database');
        } else {
            employees.forEach(user => {
                const option = document.createElement('option');
                option.value = user.id;
                option.textContent = `${user.firstName} ${user.lastName} (${user.department || 'No Department'})`;
                employeeSelect.appendChild(option);
            });
        }
        
        // Clear and populate course dropdown
        courseSelect.innerHTML = '<option value="">Select Course</option>';
        
        if (courses.length === 0) {
            courseSelect.innerHTML += '<option disabled>No courses found. Create some courses first.</option>';
            console.warn('No courses found in the database');
        } else {
            courses.forEach(course => {
                const option = document.createElement('option');
                option.value = course.id;
                option.textContent = `${course.title} (${course.category})`;
                courseSelect.appendChild(option);
            });
        }
        
        console.log('Assignment data loaded successfully');
        
    } catch (error) {
        console.error('Error loading assignment data:', error);
        showNotification('Error loading assignment data: ' + error.message, 'error');
        
        // Show error in dropdowns
        document.getElementById('assignEmployee').innerHTML = '<option disabled>Error loading employees</option>';
        document.getElementById('assignCourse').innerHTML = '<option disabled>Error loading courses</option>';
    }
}

// Enhanced API call helper with better error handling
async function apiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method,
        headers: {
            'Content-Type': 'application/json'
        }
    };
    
    if (authToken) {
        config.headers['Authorization'] = `Bearer ${authToken}`;
    }
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    console.log(`Making API call: ${method} ${API_BASE_URL}${endpoint}`);
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API call failed: ${response.status} - ${errorText}`);
            throw new Error(`API call failed: ${response.statusText} - ${errorText}`);
        }
        
        const result = await response.json();
        console.log(`API call successful:`, result);
        return result;
    } catch (error) {
        console.error('API call error:', error);
        throw error;
    }
}

// Setup modal events with form validation
function setupModalEvents() {
    document.getElementById('addCourseBtn').addEventListener('click', () => {
        openModal('addCourseModal');
    });
    
    document.getElementById('addUserBtn').addEventListener('click', () => {
        openModal('addUserModal');
        // Setup form validation when modal opens
        setTimeout(setupFormValidation, 100);
    });
    
    document.getElementById('assignCourseBtn').addEventListener('click', async () => {
        await loadAssignmentData();
        openModal('assignCourseModal');
    });
    
    document.querySelectorAll('.close').forEach(closeBtn => {
        closeBtn.addEventListener('click', (e) => {
            const modal = e.target.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal(modal.id);
            }
        });
    });
}

// Setup form validation
function setupFormValidation() {
    // Reset username field style when user types
    const usernameField = document.getElementById('userUsername');
    const emailField = document.getElementById('userEmail');
    
    if (usernameField) {
        usernameField.addEventListener('input', function() {
            this.style.borderColor = '';
        });
        
        // Add real-time username availability checking
        usernameField.addEventListener('blur', async function() {
            const username = this.value.trim();
            if (username.length > 0) {
                try {
                    const existingUsers = await apiCall('/users');
                    const usernameExists = existingUsers.some(user => 
                        user.username.toLowerCase() === username.toLowerCase()
                    );
                    
                    if (usernameExists) {
                        this.style.borderColor = '#e74c3c';
                        showNotification(`Username "${username}" is already taken`, 'warning');
                    } else {
                        this.style.borderColor = '#27ae60';
                    }
                } catch (error) {
                    console.error('Error checking username availability:', error);
                }
            }
        });
    }
    
    if (emailField) {
        emailField.addEventListener('input', function() {
            this.style.borderColor = '';
        });
    }
}

// Setup form submissions
function setupFormSubmissions() {
    document.getElementById('addCourseForm').addEventListener('submit', handleAddCourse);
    document.getElementById('addUserForm').addEventListener('submit', handleAddUser);
    document.getElementById('assignCourseForm').addEventListener('submit', handleAssignCourse);
}

// Modal functions
function openModal(modalId) {
    document.getElementById(modalId).style.display = 'block';
}

function closeModal(modalId) {
    document.getElementById(modalId).style.display = 'none';
}

// Enhanced notification system
function showNotification(message, type = 'info') {
    // Remove any existing notifications
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notif => notif.remove());
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 20px;
        border-radius: 5px;
        color: white;
        z-index: 10000;
        opacity: 0;
        transition: opacity 0.3s ease;
        min-width: 250px;
        font-weight: 500;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    `;
    
    switch(type) {
        case 'success':
            notification.style.backgroundColor = '#27ae60';
            break;
        case 'error':
            notification.style.backgroundColor = '#e74c3c';
            break;
        case 'warning':
            notification.style.backgroundColor = '#f39c12';
            break;
        default:
            notification.style.backgroundColor = '#3498db';
    }
    
    document.body.appendChild(notification);
    
    setTimeout(() => notification.style.opacity = '1', 100);
    
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Utility function to get time ago
function getTimeAgo(date) {
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
}

// FIXED: Chart creation functions with real data and proper status handling
async function createCoursePerformanceChart(courses, enrollments) {
    const ctx = document.getElementById('coursePerformanceChart').getContext('2d');
    
    // Calculate completion rates for each course
    const courseData = courses.map(course => {
        const courseEnrollments = enrollments.filter(e => e.courseId === course.id);
        const completedEnrollments = courseEnrollments.filter(e => {
            if (typeof e.status === 'string') {
                return e.status === 'Completed';
            } else {
                return e.status === 2; // 2 = Completed
            }
        });
        const completionRate = courseEnrollments.length > 0 ? 
            Math.round((completedEnrollments.length / courseEnrollments.length) * 100) : 0;
        
        return {
            title: course.title,
            completionRate: completionRate
        };
    }).slice(0, 5); // Show top 5 courses
    
    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: courseData.map(c => c.title),
            datasets: [{
                label: 'Completion Rate (%)',
                data: courseData.map(c => c.completionRate),
                backgroundColor: [
                    'rgba(52, 152, 219, 0.8)',
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(155, 89, 182, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(231, 76, 60, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

// FIXED: Chart with proper status handling
async function createEmployeeProgressChart(enrollments) {
    const ctx = document.getElementById('employeeProgressChart').getContext('2d');
    
    // FIXED: Count statuses properly
    const completed = enrollments.filter(e => {
        if (typeof e.status === 'string') {
            return e.status === 'Completed';
        } else {
            return e.status === 2;
        }
    }).length;
    
    const inProgress = enrollments.filter(e => {
        if (typeof e.status === 'string') {
            return e.status === 'InProgress';
        } else {
            return e.status === 1;
        }
    }).length;
    
    const enrolled = enrollments.filter(e => {
        if (typeof e.status === 'string') {
            return e.status === 'Enrolled';
        } else {
            return e.status === 0;
        }
    }).length;
    
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Completed', 'In Progress', 'Enrolled'],
            datasets: [{
                data: [completed, inProgress, enrolled],
                backgroundColor: [
                    'rgba(46, 204, 113, 0.8)',
                    'rgba(241, 196, 15, 0.8)',
                    'rgba(149, 165, 166, 0.8)'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'bottom'
                }
            }
        }
    });
}

async function createDepartmentChart(users, enrollments) {
    const ctx = document.getElementById('departmentChart').getContext('2d');
    
    // Calculate training hours by department
    const departments = {};
    users.forEach(user => {
        if (user.role === 'Employee' || user.role === 1 || user.role === '1') {
            const userEnrollments = enrollments.filter(e => e.userId === user.id);
            const dept = user.department || 'Unknown';
            departments[dept] = (departments[dept] || 0) + userEnrollments.length;
        }
    });
    
    const deptData = Object.entries(departments).slice(0, 5);
    
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: deptData.map(([dept]) => dept),
            datasets: [{
                label: 'Total Enrollments',
                data: deptData.map(([, count]) => count),
                borderColor: 'rgba(52, 152, 219, 1)',
                backgroundColor: 'rgba(52, 152, 219, 0.1)',
                fill: true
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true
                }
            }
        }
    });
}

// FIXED: Employee dashboard functions with proper status handling
async function loadEmployeeDashboard() {
    await loadEmployeeOverview();
}

async function loadEmployeeOverview() {
    try {
        const enrollments = await apiCall(`/enrollments/user/${currentUser.id}`);
        
        const enrolledCourses = enrollments.length;
        
        // FIXED: Handle status properly for employee stats
        const completedCourses = enrollments.filter(e => {
            if (typeof e.status === 'string') {
                return e.status === 'Completed';
            } else {
                return e.status === 2; // 2 = Completed
            }
        }).length;
        
        const inProgressCourses = enrollments.filter(e => {
            if (typeof e.status === 'string') {
                return e.status === 'InProgress';
            } else {
                return e.status === 1; // 1 = InProgress
            }
        }).length;
        
        const certificates = completedCourses;
        
        document.getElementById('empEnrolledCourses').textContent = enrolledCourses;
        document.getElementById('empCompletedCourses').textContent = completedCourses;
        document.getElementById('empInProgressCourses').textContent = inProgressCourses;
        document.getElementById('empCertificates').textContent = certificates;
        
        loadCurrentCourses();
        
    } catch (error) {
        console.error('Error loading employee overview:', error);
        showNotification('Error loading dashboard data', 'error');
    }
}

async function loadCurrentCourses() {
    try {
        const enrollments = await apiCall(`/enrollments/user/${currentUser.id}`);
        const courses = await apiCall('/courses');
        
        // FIXED: Filter current enrollments with proper status handling
        const currentEnrollments = enrollments.filter(e => {
            if (typeof e.status === 'string') {
                return e.status === 'InProgress' || e.status === 'Enrolled';
            } else {
                return e.status === 1 || e.status === 0; // 1=InProgress, 0=Enrolled
            }
        });
        
        const container = document.getElementById('currentCoursesList');
        
        if (currentEnrollments.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No active courses</p></div>';
            return;
        }
        
        container.innerHTML = currentEnrollments.map(enrollment => {
            const course = courses.find(c => c.id === enrollment.courseId);
            return course ? `
                <div class="course-card">
                    <div class="course-header">
                        <div class="course-title">${course.title}</div>
                        <div class="course-meta">
                            <span>${course.category}</span>
                        </div>
                    </div>
                    <div class="course-body">
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${enrollment.progress || 0}%"></div>
                        </div>
                        <p>${enrollment.progress || 0}% Complete</p>
                        <div class="course-actions">
                            <button class="btn btn-primary" onclick="continueCourse('${course.id}')">
                                <i class="fas fa-play"></i> Continue
                            </button>
                        </div>
                    </div>
                </div>
            ` : '';
        }).join('');
        
    } catch (error) {
        console.error('Error loading current courses:', error);
    }
}

async function loadMyCourses() {
    try {
        const enrollments = await apiCall(`/enrollments/user/${currentUser.id}`);
        const courses = await apiCall('/courses');
        const container = document.getElementById('myCoursesGrid');
        
        if (enrollments.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-book-open"></i><h3>No Enrolled Courses</h3><p>You are not enrolled in any courses yet</p></div>';
            return;
        }
        
        container.innerHTML = enrollments.map(enrollment => {
            const course = courses.find(c => c.id === enrollment.courseId);
            
            // Handle status display
            let statusText = '';
            let statusClass = '';
            if (typeof enrollment.status === 'string') {
                statusText = enrollment.status;
                statusClass = enrollment.status.toLowerCase();
            } else {
                switch (enrollment.status) {
                    case 0: statusText = 'Enrolled'; statusClass = 'enrolled'; break;
                    case 1: statusText = 'InProgress'; statusClass = 'inprogress'; break;
                    case 2: statusText = 'Completed'; statusClass = 'completed'; break;
                    case 3: statusText = 'Dropped'; statusClass = 'dropped'; break;
                    default: statusText = 'Unknown'; statusClass = 'unknown';
                }
            }
            
            return course ? `
                <div class="course-card">
                    <div class="course-header">
                        <div class="course-title">${course.title}</div>
                        <div class="course-meta">
                            <span>${course.category}</span>
                            <span>${course.duration}h</span>
                        </div>
                    </div>
                    <div class="course-body">
                        <div class="course-description">${course.description}</div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${enrollment.progress || 0}%"></div>
                        </div>
                        <p>${enrollment.progress || 0}% Complete</p>
                        <span class="status-badge status-${statusClass}">${statusText}</span>
                        <div class="course-actions">
                            <button class="btn btn-primary" onclick="continueCourse('${course.id}')">
                                <i class="fas fa-play"></i> ${statusText === 'Completed' ? 'Review' : 'Continue'}
                            </button>
                        </div>
                    </div>
                </div>
            ` : '';
        }).join('');
        
    } catch (error) {
        console.error('Error loading my courses:', error);
        showNotification('Error loading courses', 'error');
    }
}

async function loadAvailableCourses() {
    try {
        const [allCourses, myEnrollments] = await Promise.all([
            apiCall('/courses'),
            apiCall(`/enrollments/user/${currentUser.id}`)
        ]);
        
        const enrolledCourseIds = myEnrollments.map(e => e.courseId);
        const availableCourses = allCourses.filter(course => !enrolledCourseIds.includes(course.id));
        
        const container = document.getElementById('availableCoursesGrid');
        
        if (availableCourses.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-search"></i><h3>No Available Courses</h3><p>You are enrolled in all available courses</p></div>';
            return;
        }
        
        container.innerHTML = availableCourses.map(course => `
            <div class="course-card">
                <div class="course-header">
                    <div class="course-title">${course.title}</div>
                    <div class="course-meta">
                        <span>${course.category}</span>
                        <span>${course.duration}h</span>
                    </div>
                </div>
                <div class="course-body">
                    <div class="course-description">${course.description}</div>
                    <div class="course-details">
                        <span class="course-tag">Level: ${course.level}</span>
                        <span class="course-tag">Instructor: ${course.instructor}</span>
                    </div>
                    <div class="course-actions">
                        <button class="btn btn-primary" onclick="requestEnrollment('${course.id}')">
                            <i class="fas fa-plus"></i> Request Enrollment
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
        
    } catch (error) {
        console.error('Error loading available courses:', error);
        showNotification('Error loading available courses', 'error');
    }
}

async function loadProgress() {
    try {
        const [enrollments, courses] = await Promise.all([
            apiCall(`/enrollments/user/${currentUser.id}`),
            apiCall('/courses')
        ]);
        
        const container = document.getElementById('progressDetails');
        
        if (enrollments.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No progress data available</p></div>';
            return;
        }
        
        const progressData = enrollments.map(enrollment => {
            const course = courses.find(c => c.id === enrollment.courseId);
            
            // Handle status properly
            let statusText = '';
            if (typeof enrollment.status === 'string') {
                statusText = enrollment.status;
            } else {
                switch (enrollment.status) {
                    case 0: statusText = 'Enrolled'; break;
                    case 1: statusText = 'InProgress'; break;
                    case 2: statusText = 'Completed'; break;
                    case 3: statusText = 'Dropped'; break;
                    default: statusText = 'Unknown';
                }
            }
            
            return {
                courseName: course ? course.title : 'Unknown Course',
                progress: enrollment.progress || 0,
                status: statusText,
                enrolledAt: new Date(enrollment.enrolledAt).toLocaleDateString(),
                completedAt: enrollment.completedAt ? new Date(enrollment.completedAt).toLocaleDateString() : null
            };
        });
        
        container.innerHTML = `
            <h3>Course Progress Details</h3>
            ${progressData.map(item => `
                <div class="progress-item">
                    <h4>${item.courseName}</h4>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${item.progress}%"></div>
                    </div>
                    <div class="progress-info">
                        <span>Progress: ${item.progress}%</span>
                        <span class="status-badge status-${item.status.toLowerCase()}">${item.status}</span>
                    </div>
                    <div class="progress-dates">
                        <small>Enrolled: ${item.enrolledAt}</small>
                        ${item.completedAt ? `<small>Completed: ${item.completedAt}</small>` : ''}
                    </div>
                </div>
            `).join('')}
        `;
        
        // Create personal progress chart
        createPersonalProgressChart(progressData);
        
    } catch (error) {
        console.error('Error loading progress:', error);
        showNotification('Error loading progress data', 'error');
    }
}

function createPersonalProgressChart(progressData) {
    const ctx = document.getElementById('personalProgressChart');
    if (!ctx) return;
    
    const ctxContext = ctx.getContext('2d');
    
    new Chart(ctxContext, {
        type: 'bar',
        data: {
            labels: progressData.map(item => item.courseName.substring(0, 20) + '...'),
            datasets: [{
                label: 'Progress (%)',
                data: progressData.map(item => item.progress),
                backgroundColor: progressData.map(item => {
                    if (item.progress === 100) return 'rgba(46, 204, 113, 0.8)';
                    if (item.progress >= 50) return 'rgba(241, 196, 15, 0.8)';
                    return 'rgba(231, 76, 60, 0.8)';
                })
            }]
        },
        options: {
            responsive: true,
            scales: {
                y: {
                    beginAtZero: true,
                    max: 100
                }
            }
        }
    });
}

async function loadCertificates() {
    try {
        const [enrollments, courses] = await Promise.all([
            apiCall(`/enrollments/user/${currentUser.id}`),
            apiCall('/courses')
        ]);
        
        // Filter completed enrollments
        const completedEnrollments = enrollments.filter(e => {
            if (typeof e.status === 'string') {
                return e.status === 'Completed';
            } else {
                return e.status === 2; // 2 = Completed
            }
        });
        
        const container = document.getElementById('certificatesGrid');
        
        if (completedEnrollments.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fas fa-certificate"></i><h3>No Certificates Yet</h3><p>Complete courses to earn certificates</p></div>';
            return;
        }
        
        container.innerHTML = completedEnrollments.map(enrollment => {
            const course = courses.find(c => c.id === enrollment.courseId);
            return course ? `
                <div class="certificate-card">
                    <div class="certificate-icon">
                        <i class="fas fa-certificate"></i>
                    </div>
                    <div class="certificate-title">${course.title}</div>
                    <div class="certificate-date">Completed: ${new Date(enrollment.completedAt || enrollment.enrolledAt).toLocaleDateString()}</div>
                    <button class="btn btn-primary" onclick="downloadCertificate('${enrollment.id}')">
                        <i class="fas fa-download"></i> Download
                    </button>
                </div>
            ` : '';
        }).join('');
        
    } catch (error) {
        console.error('Error loading certificates:', error);
        showNotification('Error loading certificates', 'error');
    }
}

// Utility functions for course management
function viewCourse(courseId) {
    console.log('Viewing course:', courseId);
    showNotification('Course details view - feature coming soon', 'info');
}

function editCourse(courseId) {
    console.log('Editing course:', courseId);
    showNotification('Course editing - feature coming soon', 'info');
}

async function deleteCourse(courseId) {
    if (confirm('Are you sure you want to delete this course?')) {
        try {
            await apiCall(`/courses/${courseId}`, 'DELETE');
            loadCourses();
            showNotification('Course deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting course:', error);
            showNotification('Error deleting course: ' + error.message, 'error');
        }
    }
}

function editUser(userId) {
    console.log('Editing user:', userId);
    showNotification('User editing - feature coming soon', 'info');
}

async function deleteUser(userId) {
    if (confirm('Are you sure you want to delete this user?')) {
        try {
            await apiCall(`/users/${userId}`, 'DELETE');
            loadUsers();
            showNotification('User deleted successfully!', 'success');
        } catch (error) {
            console.error('Error deleting user:', error);
            showNotification('Error deleting user: ' + error.message, 'error');
        }
    }
}

function viewEnrollment(enrollmentId) {
    console.log('Viewing enrollment:', enrollmentId);
    showNotification('Enrollment details - feature coming soon', 'info');
}

function updateProgress(enrollmentId) {
    console.log('Updating progress:', enrollmentId);
    showNotification('Progress update - feature coming soon', 'info');
}

function continueCourse(courseId) {
    console.log('Continuing course:', courseId);
    showNotification('Course player - feature coming soon', 'info');
}

function requestEnrollment(courseId) {
    console.log('Requesting enrollment:', courseId);
    showNotification('Enrollment request sent - admin will review', 'success');
}

function downloadCertificate(enrollmentId) {
    console.log('Downloading certificate:', enrollmentId);
    showNotification('Certificate download - feature coming soon', 'info');
}

// Add delete enrollment function
async function deleteEnrollment(enrollmentId) {
    if (confirm('Are you sure you want to remove this enrollment?')) {
        try {
            await apiCall(`/enrollments/${enrollmentId}`, 'DELETE');
            loadEnrollments();
            showNotification('Enrollment removed successfully!', 'success');
        } catch (error) {
            console.error('Error deleting enrollment:', error);
            showNotification('Error removing enrollment: ' + error.message, 'error');
        }
    }
}