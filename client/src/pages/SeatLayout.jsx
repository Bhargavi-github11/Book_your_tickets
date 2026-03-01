import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loding from '../components/Loding'
import { ArrowRightIcon, ClockIcon } from 'lucide-react'
import isoTimeFormat from '../lib/isoTimeFormat'
import BlurCircle from '../components/BlurCircle'
import toast from 'react-hot-toast'
import { useAppContext } from '../context/AppContext'

const buildDateTimeData = () => {
  const slots = ["10:00", "13:00", "16:00", "19:00"];
  return slots.map((time, index) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return {
      time: date.toISOString(),
      showId: `slot-${index}`,
    };
  });
};

const SeatLayout = () => {

  const groupRows = [['A', 'B'],['C', 'D'],['E', 'F'],['G', 'H'],['I', 'J']]
  const {id, date} = useParams()
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [show, setShow] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false)

  const { axios, shows, authToken } = useAppContext()

  const navigate = useNavigate()

  const getShow = async () =>{
    const selectedMovie = shows.find((item) => String(item._id) === String(id))
    if(selectedMovie){
      setShow({
        movie: selectedMovie,
        dateTime: {
          [date]: buildDateTimeData(),
        }
      })
    }
  }
  const handleSeatClick = (seatId) =>{
    if(!selectedTime){
      return toast("Please select time first")
    }
    if(!selectedSeats.includes(seatId) && selectedSeats.length > 4){
      return toast("You can only select 5 seats")
    }
    setSelectedSeats(prev => prev.includes(seatId) ? prev.filter(seat => seat !==seatId) : [...prev,seatId])
  }
  const renderSeats = (row, count = 9)=>(
    <div key={row} className='flex gap-2 mt-2'>
      <div className='flex flex-wrap items-center justify-center gap-2'>
        {Array.from({length: count}, (_, i)=>{
          const seatId = `${row}${i+1}`;
          return(
            <button key={seatId} onClick={()=> handleSeatClick(seatId)} className={`h-8 w-8 rounded border border-primary/60 cursor-pointer ${selectedSeats.includes(seatId) && "bg-primary text-white"}`}>
              {seatId}
            </button>
          )
        })}

      </div>
    </div>
  )
  useEffect(()=>{
    getShow()
  },[id, date, shows])

  const onProceedToPayment = async () => {
    if (!authToken) {
      toast.error('Please sign in first')
      navigate('/signin', { state: { from: `/movies/${id}/${date}` } })
      return
    }

    if (!selectedTime) {
      toast.error('Please select time first')
      return
    }

    if (selectedSeats.length === 0) {
      toast.error('Please select at least one seat')
      return
    }

    try {
      setBookingLoading(true)

      const { data } = await axios.post('/api/booking/create', {
        movieId: show.movie._id,
        movieData: show.movie,
        showDateTime: selectedTime.time,
        showPrice: 200,
        selectedSeats,
      }, {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      })

      if (data.success) {
        navigate(`/payment/${data.bookingId}`)
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setBookingLoading(false)
    }
  }
  return show ? (
    <div className='flex flex-col md:flex-row px-6 md:px-16 lg:px-40 py-30 md:pt-50'>
      {/* Available Timings */}
      <div className='w-60 bg-primary/10 border border-primary/20 rounded-lg py-10 h-max md:sticky md:top-30'>
      <p className='text-lg font-semibold px-6'>Available Timings</p>
      <div className='mt-5 space-y-1'>
        {show.dateTime[date].map((item)=>(
          <div key={item.time} onClick={() => setSelectedTime(item)} className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${selectedTime?.time === item.time ? "bg-primary text-white": "hover:bg-primary/20" }` }> 
            <ClockIcon className='w-4 h-4' />
            <p className='text-sm'>{ isoTimeFormat(item.time)}</p>
          </div>
        ))}
      </div>
      </div>
      {/* Seats Layout */}
      <div className='relative flex-1 flex flex-col items-center max-md:mt-16'>
        <BlurCircle top='-100px' left='-100px' />
         <BlurCircle bottom='0' right='0' />
         <h1 className='text-2xl font-semibold mb-4'>Select your seat</h1>
         <img src={assets.screenImage} alt="screen" />
         <p className='text-gray-400 text-sm mb-6'>SCREEN SIDE</p>
         <div className='flex flex-col items-center mt-10 text-xs text-gray-300'>
          <div className='flex flex-col items-center mt-10 text-xs text-gray-300'>
            {groupRows[0].map(row => renderSeats(row))}
          </div>
          <div className='grid grid-cols-2 gap-11'>
          {groupRows.slice(1).map((group,idx)=>(
            <div key={idx} >
              {group.map(row => renderSeats(row))}
              </div>
          ))}
         </div>
         </div>
         <button onClick={onProceedToPayment} disabled={bookingLoading} className='flex items-center gap-1 mt-20 px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-full font-medium cursor-pointer active:scale-95 disabled:opacity-60'>
          Proceed to Checkout
          <ArrowRightIcon strokeWidth={3} className='w-4 h-4' />
         </button>
      </div>
    </div>
  ) : (
    <Loding />
  )
}
export default SeatLayout