import express from 'express'
import { doctorList , loginDoctor,appointmentDoctors,appointmentCancelled,appointmentComplete,doctorDashboard,doctorProfile,updateDoctorProfile} from '../controllers/doctorController.js';
import authDoctor from '../middlewares/authDoctor.js'
const doctorRouter = express.Router();

doctorRouter.get('/list',doctorList);
doctorRouter.post('/login',loginDoctor);
doctorRouter.get('/appointments',authDoctor,appointmentDoctors); // Add this route to get list of doctors available for appointment
doctorRouter.post('/complete-appointment',authDoctor,appointmentComplete);
doctorRouter.post('/cancel-appointment',authDoctor,appointmentCancelled);
doctorRouter.get('/dashboard',authDoctor,doctorDashboard); // Add this route to get dashboard for doctor
doctorRouter.get('/doctor-profile',authDoctor,doctorProfile); // Add this route to get doctor profile
doctorRouter.post('/update-profile',authDoctor,updateDoctorProfile); // Add this route to update doctor profile

export default doctorRouter;