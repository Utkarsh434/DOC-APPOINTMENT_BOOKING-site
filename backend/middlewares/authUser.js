import jwt from 'jsonwebtoken'

//User authentication middleware

const authUser = async(req,res,next)=>{
    try{

        const {token} = req.headers;
        // console.log(atoken);
        
        if(!token){
            return res.json({success:false,message:"Not authorized Login Again"})
        }
        const token_decode = jwt.verify(token,process.env.JWT_SECRET)
        req.body.userId = token_decode.id;
        

        next();

    }catch(err){
        console.log(err);
        res.json({success:false,message:err.message});
    }
}

export default authUser;