const express = require("express");
const router = express.Router();
const User = require("../models/UserModels");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");


// REGISTER
router.post("/signup", async (req,res)=>{

  const {name,email,password,phone} = req.body;

  const exist = await User.findOne({email});
  if(exist) return res.status(400).json({msg:"User already exists"});

  const hashed = await bcrypt.hash(password,10);

  const user = await User.create({
    name,
    email,
    phone,
    password:hashed
  });

  res.json({user});

});


// LOGIN
router.post("/login", async (req,res)=>{

  const {email,password} = req.body;

  const user = await User.findOne({email});
  if(!user) return res.status(400).json({msg:"User not found"});

  const match = await bcrypt.compare(password,user.password);
  if(!match) return res.status(400).json({msg:"Invalid password"});

  const token = jwt.sign(
    {id:user._id},
    process.env.JWT_SECRET,
    {expiresIn:"1d"}
  );

  res.json({token,user});

});


// SAVE LOGO URL
router.post("/save-logo", async (req,res)=>{

  try{

    const {userId,logoUrl} = req.body;

    const user = await User.findByIdAndUpdate(
      userId,
      {logo:logoUrl},
      {new:true}
    );

    res.json({
      msg:"Logo saved successfully",
      user
    });

  }catch(err){

    res.status(500).json({msg:"Logo save failed"});

  }

});


module.exports = router;