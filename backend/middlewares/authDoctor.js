import jwt from 'jsonwebtoken'

//doctor authentication middleware

const authDoctor = async(req,res,next)=>{
    try{

        const {dtoken} = req.headers;
        // console.log(atoken);
        
        if(!dtoken){
            return res.json({success:false,message:"Not authorized Login Again"})
        }
        const token_decode = jwt.verify(dtoken,process.env.JWT_SECRET)
        req.body.docId = token_decode.id;
        next();

    }catch(err){
        console.log(err);
        res.json({success:false,message:err.message});
    }
}

export default authDoctor;