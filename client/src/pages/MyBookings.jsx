import React, { useEffect, useState } from 'react'
import Loding from '../components/Loding'
import BlurCircle from '../components/BlurCircle'
import timeFormat from '../lib/timeFormat'
import { dateFormat } from '../lib/dateFormat'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { CalendarClockIcon, TicketIcon } from 'lucide-react'

const BookingTicket = ({ booking, currency }) => {
  const showDate = new Date(booking.show?.showDateTime)
  const isUpcoming = showDate.getTime() > Date.now()

  if (!booking.isPaid || !isUpcoming) return null

  return (
    <div className='relative mt-4 max-w-3xl rounded-2xl border border-primary/40 bg-gradient-to-r from-primary/20 to-primary/5 overflow-hidden'>
      <div className='absolute -left-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-[#09090B] border border-primary/30 rounded-full'></div>
      <div className='absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 bg-[#09090B] border border-primary/30 rounded-full'></div>

      <div className='grid grid-cols-1 md:grid-cols-3 gap-4 p-5'>
        <div className='md:col-span-2'>
          <div className='flex items-center gap-2 text-primary text-sm font-medium'>
            <TicketIcon className='w-4 h-4' />
            Movie Ticket
          </div>
          <p className='text-xl font-semibold mt-2'>{booking.show?.movie?.title}</p>

          <div className='mt-3 text-sm text-gray-300 space-y-1'>
            <p><span className='text-gray-400'>Booking ID:</span> {booking._id}</p>
            <p><span className='text-gray-400'>Show Time:</span> {dateFormat(booking.show?.showDateTime)}</p>
            <p><span className='text-gray-400'>Seats:</span> {Array.isArray(booking.bookedSeats) ? booking.bookedSeats.join(', ') : 'N/A'}</p>
          </div>
        </div>

        <div className='border-t md:border-t-0 md:border-l border-dashed border-primary/30 pt-4 md:pt-0 md:pl-4 flex flex-col justify-between'>
          <div>
            <p className='text-xs text-gray-400'>Total Paid</p>
            <p className='text-2xl font-semibold'>{currency}{booking.amount}</p>
          </div>

          <div className='mt-4 rounded-lg border border-primary/30 bg-black/25 p-2 text-xs text-gray-300'>
            <div className='flex items-center gap-1'>
              <CalendarClockIcon className='w-3.5 h-3.5 text-primary' />
              Valid for upcoming show
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const MyBookings = () => {
  const currency = import.meta.env.VITE_CURRENCY
  const [bookings, setBookings] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const { axios, authToken, navigate } = useAppContext()

  const getMyBookings = async () =>{
    if (!authToken) {
      navigate('/signin', { state: { from: '/my-bookings' } })
      return
    }

    try {
      const { data } = await axios.get('/api/user/bookings', {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (data.success) {
        setBookings(Array.isArray(data.bookings) ? data.bookings : [])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(()=>{
    getMyBookings()
  },[authToken])

  return !isLoading ? (
    <div className='relative px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-[80vh]'>
      <BlurCircle top='100px' left='100px' />
      <div>
        <BlurCircle bottom='0px' left='600px' />
      </div>
      <h1 className='text-lg font-semibold mb-4'>My Bookings</h1>
      {bookings.length === 0 && (
        <p className='text-gray-400'>No bookings yet.</p>
      )}
      {bookings.map((item,index)=>(
        <div key={index}>
          <BookingTicket booking={item} currency={currency} />

          <div className='flex flex-col md:flex-row justify-between bg-primary/8 border border-primary/20 rounded-lg mt-4 p-2 max-w-3xl'>
            <div className='flex flex-col md:flex-row'>
              <img src={item.show?.movie?.poster_path} alt=""  className='md:max-w-45
              aspect-video h-auto object-cover object-bottom rounded'/>
              <div className='flex flex-col p-4'>
                <p className='text-lg font-semibold'>{item.show?.movie?.title || 'N/A'}</p>
                <p className='text-gray-400 text-sm'>{timeFormat(item.show?.movie?.runtime || 0)}</p>
                <p className='text-gray-400 text-sm mt-auto'>{dateFormat(item.show?.showDateTime)}</p>
                {item.isPaid && new Date(item.show?.showDateTime).getTime() <= Date.now() && (
                  <p className='text-xs text-amber-300 mt-2'>Show completed • Ticket hidden</p>
                )}
              </div>
            </div>

            <div className='flex flex-col md:items-end md:text-right justify-between p-4'>
              <div className='flex items-center gap-4'>
                <p className='text-2xl font-semibold mb-3'>{currency}{item.amount}</p>
                {!item.isPaid && <button onClick={() => navigate(`/payment/${item._id}`)} className='bg-primary px-4 py-1.5 mb-3 text-sm rounded-full font-medium cursor-pointer'>Pay Now</button>}
              </div>
              <div className='text-sm'>
                <p><span className='text-gray-400'>Total Tickets:</span> {item.bookedSeats?.length || 0}</p>
                <p><span className='text-gray-400'>Seat number:</span> {Array.isArray(item.bookedSeats) ? item.bookedSeats.join(", ") : 'N/A'}</p>
              </div>
            </div>
          </div>
        </div>  
      ))}
    
    </div>
  ): <Loding />
}
export default MyBookings