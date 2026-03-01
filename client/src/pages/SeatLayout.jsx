import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { assets } from '../assets/assets'
import Loding from '../components/Loding'
import { ArrowRightIcon, ClockIcon } from 'lucide-react'
import isoTimeFormat from '../lib/isoTimeFormat'
import BlurCircle from '../components/BlurCircle'
import toast from 'react-hot-toast'
import localDateKey from '../lib/localDateKey'
import { useAppContext } from '../context/AppContext'

const buildDateSlotsForDate = (dateKey) => {
  const slots = ["10:00", "13:00", "16:00", "19:00"];
  return slots.map((time, index) => {
    const [hours, minutes] = time.split(":");
    const date = new Date(`${dateKey}T00:00:00`);
    date.setHours(Number(hours), Number(minutes), 0, 0);
    return {
      time: date.toISOString(),
      showId: `${dateKey}-slot-${index}`,
    };
  });
};

const getNextDateKeys = (days = 4) => {
  const today = new Date()
  const keys = []

  for (let offset = 0; offset < days; offset += 1) {
    const date = new Date(today)
    date.setDate(today.getDate() + offset)
    keys.push(localDateKey(date))
  }

  return keys
}

const SeatLayout = () => {

  const groupRows = [['A', 'B'],['C', 'D'],['E', 'F'],['G', 'H'],['I', 'J']]
  const {id, date} = useParams()
  const [selectedSeats, setSelectedSeats] = useState([])
  const [selectedTime, setSelectedTime] = useState(null)
  const [selectedDate, setSelectedDate] = useState(date || getNextDateKeys(1)[0])
  const [occupiedSeats, setOccupiedSeats] = useState([])
  const [show, setShow] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false)

  const { axios, shows, authToken } = useAppContext()

  const navigate = useNavigate()

  const getShow = async () =>{
    const selectedMovie = shows.find((item) => String(item._id) === String(id))
    const dateKeys = getNextDateKeys(4)
    const initialDate = dateKeys.includes(String(date)) ? String(date) : dateKeys[0]

    if(selectedMovie){
      const dateTimeMap = dateKeys.reduce((acc, currentDate) => {
        acc[currentDate] = buildDateSlotsForDate(currentDate)
        return acc
      }, {})

      setShow({
        movie: selectedMovie,
        dateTime: dateTimeMap,
      })

      setSelectedDate(initialDate)
      setSelectedTime(null)
      setSelectedSeats([])
    }
  }
  const handleSeatClick = (seatId) =>{
    if(!selectedTime){
      return toast("Please select time first")
    }

    if (occupiedSeats.includes(seatId)) {
      return toast("This seat is already booked")
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
          const isOccupied = occupiedSeats.includes(seatId)
          const isSelected = selectedSeats.includes(seatId)
          return(
            <button
              key={seatId}
              onClick={()=> handleSeatClick(seatId)}
              disabled={isOccupied}
              className={`h-8 w-8 rounded border border-primary/60 cursor-pointer ${isSelected ? "bg-primary text-white" : ""} ${isOccupied ? 'bg-gray-700/70 text-gray-400 cursor-not-allowed border-gray-500' : ''}`}
            >
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

  useEffect(() => {
    setSelectedTime(null)
    setSelectedSeats([])
    setOccupiedSeats([])
  }, [selectedDate])

  useEffect(() => {
    let intervalId

    const fetchOccupiedSeats = async () => {
      if (!show?.movie?._id || !selectedTime?.time) {
        setOccupiedSeats([])
        return
      }

      try {
        const params = new URLSearchParams({
          movieId: String(show.movie._id),
          showDateTime: selectedTime.time,
        })

        const { data } = await axios.get(`/api/booking/seats?${params.toString()}`)
        if (data.success) {
          const latestOccupiedSeats = Array.isArray(data.occupiedSeats) ? data.occupiedSeats : []
          setOccupiedSeats(latestOccupiedSeats)
          setSelectedSeats((previousSeats) => {
            const stillAvailableSeats = previousSeats.filter((seat) => !latestOccupiedSeats.includes(seat))
            if (stillAvailableSeats.length !== previousSeats.length) {
              toast('Some selected seats just got booked by another user')
            }
            return stillAvailableSeats
          })
        } else {
          setOccupiedSeats([])
        }
      } catch (error) {
        setOccupiedSeats([])
      }
    }

    fetchOccupiedSeats()
    if (selectedTime?.time && show?.movie?._id) {
      intervalId = setInterval(fetchOccupiedSeats, 5000)
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId)
      }
    }
  }, [selectedTime, show?.movie?._id, axios])

  const onProceedToPayment = async () => {
    if (!authToken) {
      toast.error('Please sign in first')
      navigate('/signin', { state: { from: `/movies/${id}/${selectedDate}` } })
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
      <p className='text-lg font-semibold px-6'>Choose Date</p>
      <div className='px-6 mt-4 grid grid-cols-2 gap-2'>
        {Object.keys(show.dateTime).map((dateKey) => (
          <button
            key={dateKey}
            onClick={() => {
              setSelectedDate(dateKey)
              navigate(`/movies/${id}/${dateKey}`, { replace: true })
            }}
            className={`h-14 rounded-md border border-primary/40 text-sm cursor-pointer transition ${
              selectedDate === dateKey ? 'bg-primary text-white' : 'hover:bg-primary/20'
            }`}
          >
            <p>{new Date(dateKey).getDate()}</p>
            <p>
              {new Date(dateKey).toLocaleDateString('en-US', {
                month: 'short',
              })}
            </p>
          </button>
        ))}
      </div>

      <p className='text-lg font-semibold px-6'>Available Timings</p>
      <div className='mt-5 space-y-1'>
        {(show.dateTime[selectedDate] || []).map((item)=>(
          <div key={item.time} onClick={() => { setSelectedTime(item); setSelectedSeats([]) }} className={`flex items-center gap-2 px-6 py-2 w-max rounded-r-md cursor-pointer transition ${selectedTime?.time === item.time ? "bg-primary text-white": "hover:bg-primary/20" }` }> 
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
         <div className='flex items-center gap-4 text-xs mb-5'>
          <div className='flex items-center gap-2'>
            <span className='h-3 w-3 rounded bg-primary'></span>
            Selected
          </div>
          <div className='flex items-center gap-2'>
            <span className='h-3 w-3 rounded bg-gray-700 border border-gray-500'></span>
            Booked
          </div>
          <div className='flex items-center gap-2'>
            <span className='h-3 w-3 rounded border border-primary/70'></span>
            Available
          </div>
         </div>
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