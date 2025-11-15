import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";

// ======================= DOCTOR LOGIN ===========================
const loginDoctor = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await doctorModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (isMatch) {
            const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
            return res.json({ success: true, token });
        }

        return res.json({ success: false, message: "Invalid credentials" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =================== DOCTOR APPOINTMENTS ========================
const appointmentsDoctor = async (req, res) => {
    try {
        const { docId } = req.body;
        const appointments = await appointmentModel.find({ docId });

        res.json({ success: true, appointments });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ================= CANCEL APPOINTMENT ===========================
const appointmentCancel = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });
            return res.json({ success: true, message: "Appointment Cancelled" });
        }

        return res.json({ success: false, message: "Invalid appointment" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ================= COMPLETE APPOINTMENT =========================
const appointmentComplete = async (req, res) => {
    try {
        const { docId, appointmentId } = req.body;

        const appointmentData = await appointmentModel.findById(appointmentId);

        if (appointmentData && appointmentData.docId === docId) {
            await appointmentModel.findByIdAndUpdate(appointmentId, { isCompleted: true });
            return res.json({ success: true, message: "Appointment Completed" });
        }

        return res.json({ success: false, message: "Invalid appointment" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ================= DOCTOR LIST (Frontend) =======================
const doctorList = async (req, res) => {
    try {
        const doctors = await doctorModel.find({}).select(["-password", "-email"]);
        res.json({ success: true, doctors });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ================= CHANGE AVAILABILITY ==========================
const changeAvailablity = async (req, res) => {
    try {
        const { docId } = req.body;

        const docData = await doctorModel.findById(docId);
        if (!docData) {
            return res.json({ success: false, message: "Doctor not found" });
        }

        const newAvailability = !docData.available;

        await doctorModel.findByIdAndUpdate(docId, { available: newAvailability });

        res.json({
            success: true,
            message: "Availability Updated",
            available: newAvailability
        });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ================= DOCTOR PROFILE ===============================
const doctorProfile = async (req, res) => {
    try {
        const { docId } = req.body;

        const profileData = await doctorModel.findById(docId).select("-password");

        res.json({ success: true, profileData });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ================= UPDATE DOCTOR PROFILE ========================
const updateDoctorProfile = async (req, res) => {
    try {
        const { docId, fees, address, available } = req.body;

        await doctorModel.findByIdAndUpdate(docId, {
            fees,
            address,
            available
        });

        res.json({ success: true, message: "Profile Updated" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// ================= DOCTOR DASHBOARD =============================
const doctorDashboard = async (req, res) => {
    try {
        const { docId } = req.body;

        const appointments = await appointmentModel.find({ docId });

        let earnings = 0;
        let patients = [];

        appointments.forEach((item) => {
            if (item.isCompleted || item.payment) {
                earnings += item.amount;
            }

            if (!patients.includes(item.userId)) {
                patients.push(item.userId);
            }
        });

        const dashData = {
            earnings,
            appointments: appointments.length,
            patients: patients.length,
            latestAppointments: appointments.reverse()
        };

        res.json({ success: true, dashData });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginDoctor,
    appointmentsDoctor,
    appointmentCancel,
    doctorList,
    changeAvailablity,
    appointmentComplete,
    doctorDashboard,
    doctorProfile,
    updateDoctorProfile
};
