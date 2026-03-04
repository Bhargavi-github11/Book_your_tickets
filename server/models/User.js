import mongoose from "mongoose";
const userSchema = new mongoose.Schema({
    name: {type: String, required: true},
    email: {type: String, required: true, unique: true, index: true},
    password: {type: String, required: true, select: false},
    image: {type: String, default: ""},
    role: {type: String, enum: ["user", "admin"], default: "user"},
    favorites: [{ type: String }],
}, { timestamps: true })

const User = mongoose.model('User',userSchema)

export default User;