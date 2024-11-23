import { createContext, useState } from "react";
import axios from "axios";
import { toast } from "react-toastify";
export const AdminContext = createContext();

const AdminContextProvider = (props) => {
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [aToken, setAToken] = useState(
    localStorage.getItem("aToken") ? localStorage.getItem("aToken") : ""
  );
  const [doctors, setDoctors] = useState([]);
  const [appointment, setAppointment] = useState([]);
  const [dashData, setDashData] = useState(false);


  const getAllDoctors = async () => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/all-doctors",
        {},
        { headers: { aToken } }
      );
      // console.log(res);
      if (data.success) {
        setDoctors(data.doctors);
        console.log(data.doctors);
      } else {
        console.log(data);
        toast.error(data.message);
      }
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    }
  };
  const changeAvailability = async (docId) => {
    try {
      const { data } = await axios.post(
        backendUrl + "/api/admin/change-availability",
        { docId },
        { headers: { aToken } }
      );
      if (data.success) {
        console.log(data.message);
        toast.success(data.message);
        getAllDoctors();
      } else {
        console.log(data.message);
        toast.error(data.message);
      }
    } catch (err) {
      console.log(err);
      toast.message(err.message);
    }
  };

  const getAllAppointments = async()=>{
    try{
      const {data} = await axios.get(
        backendUrl+"/api/admin/appointments",
        {headers:{aToken}}
      )
      if(data.success){
        setAppointment(data.appointments);
        console.log(data.appointments);
      }else{
        console.log(data.message)
        toast.error(data.message)
      }
    }catch(err){
      console.log(err)
      toast.error(err.message)
    }

  }
  
  const cancelAppointment = async(appointmentId)=>{
    try{
      const {data} = await axios.post(
        backendUrl+"/api/admin/cancel-appointment",
        {appointmentId},
        {headers:{aToken}}
      )
      if(data.success){
        console.log(data.message)
        toast.success(data.message)
        getAllAppointments();
      }else{
        console.log(data.message)
        toast.error(data.message)
      }
    }catch(err){
      console.log(err)
      toast.error(err.message)
    }
  }

  const getDashData = async () => {
    try {
      const { data } = await axios.get(
        backendUrl + "/api/admin/dashboard",
        { headers: { aToken } }
      );
      if (data.success) {
        setDashData(data.dashData);
        console.log(data.dashData);
      } else {
        console.log(data);
        toast.error(data.message);
      }
    } catch (err) {
      console.log(err);
      toast.error(err.message);
    }
  }

  const value = {
    aToken,
    setAToken,
    backendUrl,
    doctors,
    getAllDoctors,
    changeAvailability,
    appointment,
    setAppointment,
    getAllAppointments,
    cancelAppointment,
    dashData,
    getDashData,
  };
  return (
    <AdminContext.Provider value={value}>
      {props.children}
    </AdminContext.Provider>
  );
};

export default AdminContextProvider;
