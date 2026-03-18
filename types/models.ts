/**
 * Centralized data model types for the SMS application.
 * These types match the exact shapes returned by the Express API.
 */

// ─── Academic ────────────────────────────────────────────────

export interface AcademicYear {
    id: number;
    yearName: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    createdAt: string;
}

export interface Semester {
    id: number;
    semesterId: number;
    academicYearId: number;
    semesterName: string;
    startDate: string;
    endDate: string;
    isCurrent: boolean;
    createdAt: string;
    /** Joined from academic_years */
    yearName: string;
}

// ─── Institution ─────────────────────────────────────────────

export interface Faculty {
    id: number;
    facultyName: string;
    facultyCode: string;
    createdAt: string;
}

export interface Department {
    id: number;
    facultyId: number;
    departmentName: string;
    departmentCode: string;
    createdAt: string;
    /** Joined from departments_faculties */
    facultyName: string;
}

export interface Programme {
    id: number;
    departmentId: number;
    programmeName: string;
    programmeCode: string;
    duration: number;
    isActive: boolean | number;
    createdAt: string;
    /** Joined from departments_list */
    departmentName: string;
    /** Joined from departments_faculties */
    facultyName: string;
}

export interface Level {
    id: number;
    levelName: string;
    levelOrder: number;
    createdAt: string;
}

// ─── Users ───────────────────────────────────────────────────

export interface Student {
    studentIndex: string;
    userId: number;
    firstName: string;
    lastName: string;
    otherNames: string;
    dateOfBirth: string;
    gender: string;
    email: string;
    phone: string;
    address: string;
    photo: string | null;
    programmeId: number;
    levelId: number;
    enrollmentDate: string;
    academicYearId: number;
    /** Joined from academic_years */
    academicYearName: string;
    isActive: boolean;
    createdAt: string;
    /** Joined from programmes_list */
    programmeName: string;
    programmeCode: string;
    /** Joined from programmes_levels */
    levelName: string;
}

/** Extended student profile with department/faculty info (single-student endpoints) */
export interface StudentDetail extends Student {
    departmentName: string;
    facultyName: string;
}

export interface Lecturer {
    id: number;
    userId: number;
    staffId: string;
    title: string;
    firstName: string;
    lastName: string;
    otherNames: string;
    email: string;
    phone: string;
    departmentId: number;
    specialization: string;
    photo: string | null;
    isActive: boolean;
    createdAt: string;
    /** Joined from departments_list */
    departmentName: string;
    /** Joined from departments_faculties */
    facultyName: string;
}

// ─── Courses ─────────────────────────────────────────────────

export interface Course {
    id: number;
    courseCode: string;
    courseName: string;
    creditHours: number;
    departmentId: number;
    levelId: number;
    semesterId: number;
    description: string;
    isActive: boolean | number;
    createdAt: string;
    /** Joined from departments_list */
    departmentName: string;
    /** Joined from programmes_levels */
    levelName: string;
    /** Joined from semesters */
    semesterName: string;
}

export interface CourseAssignment {
    id: number;
    courseId: number;
    lecturerId: number;
    programmeId: number;
    academicSemesterId: number;
    createdAt: string;
    /** Joined from courses_list */
    courseCode: string;
    courseName: string;
    creditHours: number;
    /** Computed: CONCAT(lp.title, lp.firstName, lp.lastName) */
    lecturerName: string;
    staffId: string;
    /** Joined from programmes_list */
    programmeName: string;
    programmeCode: string;
    /** Joined from academic_semesters */
    semesterName: string;
    /** Joined from academic_years */
    yearName: string;
}

// ─── Assessments ─────────────────────────────────────────────

export interface AssessmentType {
    id: number;
    typeName: string;
    weight: number;
    createdAt: string;
}

export interface Assessment {
    id: number;
    courseAssignmentId: number;
    assessmentTypeId: number;
    title: string;
    totalMarks: number;
    assessmentDate: string;
    createdAt: string;
    /** Joined from assessments_types */
    typeName: string;
    weight: number;
    /** Joined from courses_list */
    courseCode: string;
    courseName: string;
    /** Computed: CONCAT(lp.title, lp.firstName, lp.lastName) */
    lecturerName: string;
    /** Joined from programmes_list */
    programmeName: string;
    /** Joined from academic_semesters */
    semesterName: string;
    /** Joined from academic_years */
    yearName: string;
}

// ─── Results ─────────────────────────────────────────────────

export interface ScoreRecord {
    id: number;
    assessmentId: number;
    studentIndex: string;
    marksObtained: number;
    grade: string;
    gradePoint: number;
    remarks: string;
    uploadedBy: number;
    createdAt: string;
    updatedAt: string;
    /** Aliased from al.title */
    assessmentTitle: string;
    totalMarks: number;
    typeName: string;
    /** From students_profiles */
    firstName: string;
    lastName: string;
    /** Aliased from sp.studentIndex (duplicate) */
    studentId: string;
    /** Joined from courses_list */
    courseCode: string;
    courseName: string;
    /** Joined from programmes_list */
    programmeName: string;
    /** Joined from academic_semesters */
    semesterName: string;
    /** Joined from academic_years */
    yearName: string;
}

/** Row returned by GET /api/results/students-for-assessment/:id */
export interface StudentScore {
    studentIndex: string;
    firstName: string;
    lastName: string;
    marksObtained: number | null;
    grade: string | null;
    gradePoint: number | null;
    /** Aliased from rs.id — null if not yet scored */
    scoreId: number | null;
}

export interface BulkScoreResult {
    message: string;
    successCount: number;
    errorCount: number;
    details: { studentIndex: string; outMSG: number; outId: number; error?: string }[];
}

// ─── Grading ─────────────────────────────────────────────────

export interface GradingScale {
    id: number;
    grade: string;
    gradePoint: number;
    minScore: number;
    maxScore: number;
    description: string;
    createdAt: string;
}

// ─── Dashboard ───────────────────────────────────────────────

export interface DashboardStats {
    studentCount: number;
    lecturerCount: number;
    courseCount: number;
    programmeCount: number;
    facultyCount: number;
    departmentCount: number;
    currentYear: AcademicYear | null;
    currentSemester: Omit<Semester, 'yearName'> | null;
}

export interface RecentStudent {
    studentIndex: string;
    firstName: string;
    lastName: string;
    email: string;
    createdAt: string;
    programmeName: string;
    levelName: string;
}

export interface LecturerAssignment {
    id: number;
    courseId: number;
    lecturerId: number;
    programmeId: number;
    academicSemesterId: number;
    createdAt: string;
    courseCode: string;
    courseName: string;
    creditHours: number;
    programmeName: string;
    semesterName: string;
    yearName: string;
}

export interface LecturerDashboardStats {
    assignments: LecturerAssignment[];
    courseCount: number;
    studentCount: number;
    assessmentCount: number;
}

export interface StudentByLevel {
    levelName: string;
    count: number;
}

export interface GradeDistributionItem {
    grade: string;
    count: number;
}

// ─── Student Portal ──────────────────────────────────────────

/** Profile returned by GET /api/student/profile/:studentIndex */
export interface StudentProfile extends StudentDetail {}

/** Result row returned by GET /api/student/results/:studentIndex */
export interface StudentResultRow {
    id: number;
    assessmentId: number;
    studentIndex: string;
    marksObtained: number;
    grade: string;
    gradePoint: number;
    remarks: string;
    uploadedBy: number;
    createdAt: string;
    updatedAt: string;
    assessmentTitle: string;
    totalMarks: number;
    typeName: string;
    weight: number;
    courseCode: string;
    courseName: string;
    creditHours: number;
    programmeId: number;
    academicSemesterId: number;
    semesterName: string;
    yearName: string;
}

/** Course row returned by GET /api/student/courses/:studentIndex */
export interface StudentCourseRow {
    assignmentId: number;
    courseCode: string;
    courseName: string;
    creditHours: number;
    lecturerName: string;
    semesterName: string;
    yearName: string;
    totalAssessments: number;
    completedAssessments: number;
}

/** Transcript computed structures returned by GET /api/student/transcript/:studentIndex */
export interface TranscriptAssessment {
    typeName: string;
    marksObtained: number;
    totalMarks: number;
    weight: number;
    grade: string;
    gradePoint: number;
}

export interface TranscriptCourse {
    key: string;
    courseCode: string;
    courseName: string;
    creditHours: number;
    totalScore: number;
    grade: string;
    gradePoint: number;
    assessments: TranscriptAssessment[];
}

export interface TranscriptSemester {
    semesterId: number;
    semesterName: string;
    yearName: string;
    courses: TranscriptCourse[];
    totalCreditHours: number;
    gpa: number;
}

export interface TranscriptData {
    semesters: TranscriptSemester[];
    cgpa: number;
    totalCredits: number;
}

// ─── Auth ────────────────────────────────────────────────────

export type UserRole = 'admin' | 'lecturer' | 'student';

export interface AuthUser {
    userId: number;
    username: string;
    role: UserRole;
    /** For students: studentIndex, for lecturers: lecturerId */
    profileId: string | number;
    firstName: string;
    lastName: string;
    /** True if user must change password before accessing the app */
    mustChangePassword?: boolean;
}

export interface LoginRequest {
    username: string;
    password: string;
}

export interface RegisterAdminRequest {
    username: string;
    password: string;
    confirmPassword: string;
    registrationKey: string;
}

export interface AuthResponse {
    accessToken: string;
    refreshToken: string;
    user: AuthUser;
}

// ─── Common ──────────────────────────────────────────────────

/** Dropdown option shape used across forms */
export interface DropdownOption {
    label: string;
    value: number;
}

/** Stored procedure response used by all save/delete endpoints */
export interface SPResponse {
    message: string;
    id?: number;
}
