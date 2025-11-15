import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import validator from "validator";
import userModel from "../models/userModel.js";
import doctorModel from "../models/doctorModel.js";
import appointmentModel from "../models/appointmentModel.js";
import { v2 as cloudinary } from "cloudinary";
import Stripe from "stripe";
import Razorpay from "razorpay";

// =============================
// PAYMENT INITIALIZATION
// =============================
const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

// =============================
// REGISTER USER
// =============================
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.json({ success: false, message: "Missing Details" });
        }

        if (!validator.isEmail(email)) {
            return res.json({ success: false, message: "Invalid email" });
        }

        if (password.length < 8) {
            return res.json({ success: false, message: "Password too short" });
        }

        const already = await userModel.findOne({ email });
        if (already) {
            return res.json({ success: false, message: "User already exists" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = new userModel({
            name,
            email,
            password: hashedPassword
        });

        const savedUser = await newUser.save();

        const token = jwt.sign({ id: savedUser._id }, process.env.JWT_SECRET);

        res.json({ success: true, token });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// LOGIN USER
// =============================
const loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        const user = await userModel.findOne({ email });
        if (!user) {
            return res.json({ success: false, message: "User does not exist" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.json({ success: false, message: "Invalid credentials" });
        }

        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET);
        res.json({ success: true, token });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// GET USER PROFILE
// =============================
const getProfile = async (req, res) => {
    try {
        const { userId } = req.body;

        const user = await userModel.findById(userId).select("-password");

        res.json({ success: true, userData: user });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// UPDATE USER PROFILE
// =============================
const updateProfile = async (req, res) => {
    try {
        const { userId, name, phone, address, dob, gender } = req.body;

        if (!name || !phone || !dob || !gender) {
            return res.json({ success: false, message: "Missing data" });
        }

        await userModel.findByIdAndUpdate(userId, {
            name,
            phone,
            address: JSON.parse(address),
            dob,
            gender
        });

        // Cloudinary image upload
        if (req.file) {
            const upload = await cloudinary.uploader.upload(req.file.path, {
                resource_type: "image"
            });

            await userModel.findByIdAndUpdate(userId, { image: upload.secure_url });
        }

        res.json({ success: true, message: "Profile Updated" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// BOOK APPOINTMENT
// =============================
const bookAppointment = async (req, res) => {
    try {
        const { userId, docId, slotDate, slotTime } = req.body;

        const doc = await doctorModel.findById(docId).select("-password");

        if (!doc.available) {
            return res.json({ success: false, message: "Doctor Not Available" });
        }

        let slots_booked = doc.slots_booked || {};

        // Slot already booked?
        if (slots_booked[slotDate]?.includes(slotTime)) {
            return res.json({ success: false, message: "Slot Not Available" });
        }

        // Push new slot
        slots_booked[slotDate] = slots_booked[slotDate] || [];
        slots_booked[slotDate].push(slotTime);

        const userData = await userModel.findById(userId).select("-password");
        const docData = { ...doc._doc };
        delete docData.slots_booked;

        const newApp = new appointmentModel({
            userId,
            docId,
            userData,
            docData,
            amount: doc.fees,
            slotTime,
            slotDate,
            date: Date.now()
        });

        await newApp.save();

        await doctorModel.findByIdAndUpdate(docId, { slots_booked });

        res.json({ success: true, message: "Appointment Booked" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// CANCEL APPOINTMENT
// =============================
const cancelAppointment = async (req, res) => {
    try {
        const { userId, appointmentId } = req.body;

        const app = await appointmentModel.findById(appointmentId);

        if (!app) {
            return res.json({ success: false, message: "Appointment not found" });
        }

        if (String(app.userId) !== String(userId)) {
            return res.json({ success: false, message: "Unauthorized" });
        }

        await appointmentModel.findByIdAndUpdate(appointmentId, { cancelled: true });

        // Free the slot
        const doc = await doctorModel.findById(app.docId);
        const slots = doc.slots_booked;

        slots[app.slotDate] = slots[app.slotDate].filter(t => t !== app.slotTime);

        await doctorModel.findByIdAndUpdate(app.docId, { slots_booked: slots });

        res.json({ success: true, message: "Appointment Cancelled" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// LIST USER APPOINTMENTS
// =============================
const listAppointment = async (req, res) => {
    try {
        const { userId } = req.body;

        const list = await appointmentModel.find({ userId });

        res.json({ success: true, appointments: list });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// PAYMENT — RAZORPAY
// =============================
const paymentRazorpay = async (req, res) => {
    try {
        const { appointmentId } = req.body;

        const app = await appointmentModel.findById(appointmentId);

        if (!app || app.cancelled) {
            return res.json({ success: false, message: "Appointment invalid" });
        }

        const options = {
            amount: app.amount * 100,
            currency: process.env.CURRENCY,
            receipt: appointmentId
        };

        const order = await razorpayInstance.orders.create(options);

        res.json({ success: true, order });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// VERIFY RAZORPAY PAYMENT
// =============================
const verifyRazorpay = async (req, res) => {
    try {
        const { razorpay_order_id } = req.body;

        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);

        if (orderInfo.status === "paid") {
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt, { payment: true });
            return res.json({ success: true, message: "Payment Successful" });
        }

        res.json({ success: false, message: "Payment Failed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// PAYMENT — STRIPE
// =============================
const paymentStripe = async (req, res) => {
    try {
        const { appointmentId } = req.body;
        const { origin } = req.headers;

        const app = await appointmentModel.findById(appointmentId);

        if (!app || app.cancelled) {
            return res.json({ success: false, message: "Appointment Invalid" });
        }

        const currency = process.env.CURRENCY.toLowerCase();

        const line_items = [
            {
                price_data: {
                    currency,
                    product_data: { name: "Appointment Fees" },
                    unit_amount: app.amount * 100
                },
                quantity: 1
            }
        ];

        const session = await stripeInstance.checkout.sessions.create({
            success_url: `${origin}/verify?success=true&appointmentId=${app._id}`,
            cancel_url: `${origin}/verify?success=false&appointmentId=${app._id}`,
            mode: "payment",
            line_items
        });

        res.json({ success: true, session_url: session.url });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

// =============================
// VERIFY STRIPE PAYMENT
// =============================
const verifyStripe = async (req, res) => {
    try {
        const { appointmentId, success } = req.body;

        if (success === "true") {
            await appointmentModel.findByIdAndUpdate(appointmentId, { payment: true });
            return res.json({ success: true, message: "Payment Successful" });
        }

        res.json({ success: false, message: "Payment Failed" });

    } catch (error) {
        console.log(error);
        res.json({ success: false, message: error.message });
    }
};

export {
    loginUser,
    registerUser,
    getProfile,
    updateProfile,
    bookAppointment,
    listAppointment,
    cancelAppointment,
    paymentRazorpay,
    verifyRazorpay,
    paymentStripe,
    verifyStripe
};
