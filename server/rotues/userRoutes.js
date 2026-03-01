import express from 'express';
import { requireAuth } from '@clerk/express';
import { getFavorites, getUserBookings, updateFavorite, upgradeToAdmin, syncCurrentUser } from '../controllers/userController.js';


const userRouter = express.Router();

userRouter.get('/bookings' ,requireAuth(), getUserBookings);
userRouter.post('/update-favorite',requireAuth(), updateFavorite);
userRouter.get('/favorites',requireAuth(),getFavorites);
userRouter.post('/upgrade-admin', requireAuth(), upgradeToAdmin);
userRouter.get('/sync', requireAuth(), syncCurrentUser);

export default userRouter;
