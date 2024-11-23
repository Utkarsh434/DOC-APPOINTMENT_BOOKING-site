import express from 'express'
import { registeredUser , loginUser, getProfile ,updateProfile , bookAppointment , listAppointment , cancelAppointment , paymentRazorpay , verifyRazorpay} from '../controllers/userController.js'
import authUser from '../middlewares/authUser.js';
import upload from '../middlewares/multer.js';

const userRouter = express.Router();

userRouter.get('/get-profile',authUser,getProfile);
userRouter.get('/appointments',authUser,listAppointment);



userRouter.post('/register',registeredUser);
userRouter.post('/login',loginUser);
userRouter.post('/update-profile',upload.single('image'),authUser,updateProfile);
userRouter.post('/book-appointment',authUser,bookAppointment);
userRouter.post('/cancel-appointment',authUser,cancelAppointment);
userRouter.post('/payment-razorpay',authUser,paymentRazorpay);
userRouter.post('/verifyRazorpay',authUser,verifyRazorpay);

export default userRouter