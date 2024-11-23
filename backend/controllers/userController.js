import validator from 'validator'
import bcrypt, { hash } from 'bcrypt'
import userModel from '../models/userModel.js'
import jwt from 'jsonwebtoken'
import {v2 as cloudinary} from 'cloudinary'
import doctorModel from '../models/doctorModel.js'
import appointmentModel from '../models/appointmentModel.js'
import razorpay from 'razorpay'

const registeredUser = async(req,res)=>{
    try{
        const {name,email,password} = req.body;
        if(!name || !password || !email){
            return res.json({success:false , message:"missing details"});
        }
        //validating email formate
        if(!validator.isEmail(email)){
            return res.json({success:false , message:"enter a valid email"});
        }
        //validating strong password
        if(password.length<8){
            return res.json({success:false , message:"enter a strong password"});
        }
        //hashing user password

        const salt =  await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password,salt);

        const userData = {
            name,
            email,
            password:hashedPassword
        }

        const newUser = new userModel(userData);
        const user = await newUser.save();

        const token = jwt.sign({id:user._id},process.env.JWT_SECRET)

        res.json({success:true,token})
    }catch(err){
        console.log(err.message);
        res.json({success:false,message:err.message});
    }
}

const loginUser = async(req,res)=>{
    try {
        const {email,password} = req.body;
        const user = await userModel.findOne({email});
        if(!user){
            return res.json({success:false,message:"User dose not exist"});
        }
        const isMatch = await bcrypt.compare(password,user.password);

        if(isMatch){
            const token = jwt.sign({id:user._id},process.env.JWT_SECRET)
            res.json({success:true,token});
        }else{
            return res.json({success:false,message:"Invalid Credentials"});
        }

    } catch (err) {
        console.log(err.message);
        res.json({success:false,message:err.message});
    }
}
//api to get userPorfile data
const getProfile = async(req,res)=>{
    try {
        const {userId} = req.body;
        const userData = await userModel.findById(userId).select('-password');
        res.json({success:true,userData});
     } catch (err) {
        console.log(err.message);
        res.json({success:false,message:err.message});
    }
}

//API to update userProfile;
const updateProfile = async(req,res)=>{
    try {
        const {userId,name,phone,address,dob,gender} = req.body;
        const imageFile = req.file;
        if(!name || !phone || !dob || !gender){
            return res.json({success:false , message:"Data Missing"});
        }

        await userModel.findByIdAndUpdate(userId,{name,phone,address:JSON.parse(address),dob,gender});

        if(imageFile){
            //upload image to cloudinary
            const imageUpload = await cloudinary.uploader.upload(imageFile.path,{resource_type:'image'}); 
            const imageURL = imageUpload.secure_url;

            await userModel.findByIdAndUpdate(userId,{image:imageURL});
        }

        res.json({success:true,message:"Profile Upadted"});
    } catch (err) {
        console.log(err.message);
        res.json({success:false,message:err.message});
    }
}

//API to book appointment;
const bookAppointment = async(req,res)=>{
    try {
        const {userId,docId,slotDate,slotTime} = req.body;
        
        const docData = await doctorModel.findById(docId).select('-password');

        if(!docData.available){
            return res.json({success:false , message:'Doctor not available'})
        }
        let slots_booked = docData.slots_booked

        //checking for slot availablity
        if(slots_booked[slotDate]){
            if(slots_booked[slotDate].includes(slotTime)){
                return res.json({success:false,message:"Slot not available"});
            }else{
                slots_booked[slotDate].push(slotTime);
            }
        }else{
            slots_booked[slotDate] = []
            slots_booked[slotDate].push(slotTime)
        }

        const userData = await userModel.findById(userId).select('-password');
    
        delete docData.slots_booked

        const appointmentData = {
            userId,
            docId,
            userData,
            docData,
            amount:docData.fees,
            slotTime,
            slotDate,
            date: Date.now()
        }

        const newAppointment = new appointmentModel(appointmentData);
        await newAppointment.save();
        
        //save new slots data in docData
        await doctorModel.findByIdAndUpdate(docId,{slots_booked})
        res.json({success:true,message:'Appointment Booked'});
    } catch (err) {
        console.log(err.message);
        res.json({success:false,message:err.message});
    }
}


//api to get user appointments for frontend  my appointments page
const listAppointment = async(req,res)=>{
    try {
        const {userId} = req.body;
        const appointments = await appointmentModel.find({userId});
        console.log(appointments);
        
        res.json({success:true, appointments});
    } catch (err) {
        console.log(err.message);
        return res.json({success:false,message:err.message});
    }
}

//API to cancel appointment
const cancelAppointment = async(req,res)=>{
    try {
        const {userId,appointmentId} = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId)

        //verify appointment user
        if(appointmentData.userId!==userId){
            return res.json({success:false,message:'Unauthorized action'})
        }
        await appointmentModel.findByIdAndUpdate(appointmentId,{cancelled:true});

        //releasing doctor's slot

        const {docId,slotDate,slotTime} = appointmentData

        const  doctorData = await doctorModel.findById(docId);
        let slots_booked = doctorData.slots_booked;
        slots_booked[slotDate] = slots_booked[slotDate].filter(e=>e!==slotTime);
        await doctorModel.findByIdAndUpdate(docId,{slots_booked});
        res.json({success:true,message:'Appointment Cancelled'});
    } catch (err) {
        console.log(err.message);
        res.json({success:false,message:err.message});
    }
}

//API to make payment of appointment using razorpay
const razorpayInstance = new razorpay({
   key_id:process.env.RZR_KEY_ID,
   key_secret:process.env.RZR_KEY_SECRET
})

const paymentRazorpay = async(req,res)=>{
    try {
        const {appointmentId} = req.body;
        const appointmentData = await appointmentModel.findById(appointmentId);

        if(!appointmentData || appointmentData.cancelled){
            return res.json({success:false, messege:"Appointment Cancelled or not Found"});
        }

        //creating options for RZR pay payment
        const options = {
            amount:appointmentData.amount*100,
            currency:process.env.CURRENCY,
            receipt:appointmentId,
        }

        // creation of an order
        const order = await razorpayInstance.orders.create(options)

        res.json({success:true,order});
    } catch (err) {
        console.log(err.message);
        res.json({success:false,message:err.message});
    }
}

//API to verify payment of razorPay
const verifyRazorpay  = async(req ,res)=>{
    try {
        const {razorpay_order_id} = req.body;
        const orderInfo = await razorpayInstance.orders.fetch(razorpay_order_id);
        console.log(orderInfo);
        if(orderInfo.status==='paid'){
            await appointmentModel.findByIdAndUpdate(orderInfo.receipt,{payment:true});
            res.json({success:true,message:"Payment Successful"})
        }else{
            res.json({success:false,message:"Payment Failed"})
        }
    } catch (err) {
        console.log(err.message);
        res.json({success:false,message:err.message});
    }
}

export {registeredUser , loginUser , getProfile , updateProfile , bookAppointment , listAppointment , cancelAppointment , paymentRazorpay , verifyRazorpay}