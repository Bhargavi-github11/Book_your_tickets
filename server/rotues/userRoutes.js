import express from 'express';
import { protectAuth } from '../middleware/auth.js';
import { getFavorites, getUserBookings, updateFavorite, upgradeToAdmin, syncCurrentUser } from '../controllers/userController.js';


const userRouter = express.Router();

userRouter.get('/bookings' ,protectAuth, getUserBookings);
userRouter.post('/update-favorite',protectAuth, updateFavorite);
userRouter.get('/favorites',protectAuth,getFavorites);
userRouter.post('/upgrade-admin', protectAuth, upgradeToAdmin);
userRouter.get('/sync', protectAuth, syncCurrentUser);

export default userRouter;
