import React, { useEffect } from 'react'
import Navbar from './components/Navbar'
import { Route, Routes, useLocation } from 'react-router-dom'
import Lenis from 'lenis'
import Home from './pages/Home'
import Movies from './pages/Movies'
import MovieDetails from './pages/MovieDetails'
import SeatLayout from './pages/SeatLayout'
import MyBookings from './pages/MyBookings'
import Favorite from './pages/Favorite'
import {Toaster} from 'react-hot-toast'
import Footer from './components/Footer'
import LayOut from './pages/admin/LayOut'
import Dashboard from './pages/admin/Dashboard'
import AddShows from './pages/admin/AddShows'
import ListShow from './pages/admin/ListShow'
import ListBooking from './pages/admin/ListBooking'
import SignIn from './pages/SignIn'
import SignUp from './pages/SignUp'
import Payment from './pages/Payment'
import NotFound from './pages/NotFound'
const App = () => {
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.5,
      smoothWheel: true,
      wheelMultiplier: 0.85,
      touchMultiplier: 1.1,
      syncTouch: true,
      easing: (t) => 1 - Math.pow(1 - t, 3),
    })

    let animationFrameId = 0
    const raf = (time) => {
      lenis.raf(time)
      animationFrameId = requestAnimationFrame(raf)
    }

    animationFrameId = requestAnimationFrame(raf)

    return () => {
      cancelAnimationFrame(animationFrameId)
      lenis.destroy()
    }
  }, [])

  const isAdminRoute = useLocation().pathname.startsWith('/admin')
  return (
    <>
    <Toaster/>
    {!isAdminRoute && <Navbar/>}
    <Routes>
      <Route path='/' element={<Home/>} />
      <Route path='/movies' element={<Movies/>} />
      <Route path='/movies/:id' element={<MovieDetails/>} />
      <Route path='/movies/:id/:date' element={<SeatLayout/>} />
      <Route path='/my-bookings' element={<MyBookings/>} />
      <Route path='/payment/:bookingId' element={<Payment/>} />
      <Route path='/favorite' element={<Favorite/>} />
      <Route path='/signin' element={<SignIn/>} />
      <Route path='/signup' element={<SignUp/>} />
      <Route path='/admin/*' element={<LayOut/>}>
      <Route index element={<Dashboard/>}/>
      <Route path='add-shows' element={<AddShows/>}/>
      <Route path='list-shows' element={<ListShow/>}/>
      <Route path='list-bookings' element={<ListBooking/>}/>
      <Route path='*' element={<NotFound/>}/>
      </Route>
      <Route path='*' element={<NotFound/>} />
    </Routes>
    {!isAdminRoute && <Footer/>}
    </>
  )
}
export default App