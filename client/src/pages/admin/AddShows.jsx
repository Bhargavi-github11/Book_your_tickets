import React, { useEffect, useState } from 'react'
import Loding from '../../components/Loding'
import Title from '../../components/admin/Title'
import { CheckIcon, DeleteIcon, StarIcon } from 'lucide-react'
import { kConverter } from '../../lib/kConverter'
import { useAppContext } from '../../context/AppContext'
import toast from 'react-hot-toast'
const AddShows = () => {
  const currency = import.meta.env.VITE_CURRENCY
  const { axios, authToken, navigate } = useAppContext()
  const [nowPlayingmovies, setNowPlayingMovies] = useState([])
  const [selectedMovie, setSelectedmovie] = useState(null)
  const [dateTimeSelection, setDateTimeSelection] = useState({})
  const [dateTimeInput, setDateTimeInput] = useState('')
  const [showPrice, setShowPrice] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const fecthNowPlayingMovies = async () =>{
    try {
      const { data } = await axios.get('/api/show/now-playing')
      if (data.success) {
        setNowPlayingMovies(Array.isArray(data.movies) ? data.movies : [])
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    }
  }

  const onAddShow = async () => {
    if (!authToken) {
      navigate('/signin', { state: { from: '/admin/add-shows' } })
      return
    }

    const selectedMovieData = nowPlayingmovies.find((movie) => String(movie.id) === String(selectedMovie))
    if (!selectedMovieData) {
      toast.error('Please select a movie')
      return
    }

    const price = Number(showPrice)
    if (!Number.isFinite(price) || price <= 0) {
      toast.error('Please enter valid show price')
      return
    }

    const showDateTimes = Object.entries(dateTimeSelection).flatMap(([date, times]) =>
      times.map((time) => new Date(`${date}T${time}`).toISOString())
    )

    if (showDateTimes.length === 0) {
      toast.error('Please add at least one date and time')
      return
    }

    try {
      setIsSubmitting(true)
      const { data } = await axios.post(
        '/api/admin/create-shows',
        {
          movieId: String(selectedMovieData.id),
          movieData: selectedMovieData,
          showPrice: price,
          showDateTimes,
        },
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      )

      if (data.success) {
        toast.success(data.message || 'Shows added successfully')
        setDateTimeSelection({})
        setDateTimeInput('')
        setShowPrice('')
        navigate('/admin/list-shows')
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        navigate('/')
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDateTimeAdd = () => {
    if(!dateTimeInput) return;
    const [date, time] = dateTimeInput.split('T');
    if (!date || !time) return;
    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if(!times.includes(time)) {
        return { ...prev, [date]: [...times, time]}
      }
      return prev
    })
  }
   const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev)=>{
      const filteredTimes = prev[date].filter((t) => t !== time);
      if(filteredTimes.length == 0){
        const { [date]: _, ...rest} = prev;
        return rest;
      }
      return{
        ...prev,
        [date]: filteredTimes,
      }
    })
   }

  useEffect(() => {
    fecthNowPlayingMovies();
  }, [])
  return nowPlayingmovies.length > 0 ?  (
    <>
    <Title text1="Add" text2="Shows" />
    <p className='mt-10 text-lg font-medium'>Now Playing Movies</p>
    <div className='overflow-x-auto pb-4'>
      <div className='group flex flex-wrap gap-4 mt-4 w-max'>
        {nowPlayingmovies.map((movie)=>(
          <div key={movie.id} className={`relative max-w-40 cursor-pointer group-hover:not-hover:opacity-40 hover:-translate-y-1 transition duration-300`} onClick={()=> setSelectedmovie(movie.id)}>
            <div className='relative rounded-lg overflow-hidden'>
              <img src={movie.poster_path} alt="" className='w-full object-cover brightness-90' />
              <div className='text-sm flex items-center justify-between p-2 bg-black/70 w-full absolute bottom-0 left-0'>
              <p className='flex items-center gap-1 text-gray-400'>
                <StarIcon className='w-4 h-4 text-primary fill-primary' />
                {movie.vote_average.toFixed(1)}
              </p>
              <p className='text-gray-300'>{kConverter(movie.vote_count || 0)} votes</p>

              </div>
            </div>
            {selectedMovie === movie.id && (
              <div className='absolute top-2 right-2 flex items-center justify-center bg-primary h-6 w-6 rounded'>
                <CheckIcon className='w-4 h-4 text-white' strokeWidth={2.5} />
              </div>
            )}
            <p className='font-medium truncate'>{movie.title}</p>
            <p className='text-gray-400 text-sm'>{movie.release_date}</p>
          </div>
        ))}
      </div>
    </div>

    <div className='mt-8'>
      <label className='block text-sm font-medium mb-2'>Show Price</label>
      <div className='inline-flex items-center gap-2 border border-gray-600 px-3 py-2 rounded-md'>
        <p className='text-gray-400 text-sm'>{currency}</p>
        <input min={0} type="number" value={showPrice} onChange={(e) => 
          setShowPrice(e.target.value)} placeholder='Enter show price' className='outline-none' />
      </div>
    </div>
    <div className='mt-6'>
      <label className='block text-sm font-medium mb-2'>Select Date and Time</label>
     <div className="inline-flex items-center gap-3 border border-gray-600 p-1 pl-3 rounded-lg">
        <input type='datetime-local' value={dateTimeInput} onChange={(e) =>
          setDateTimeInput(e.target.value)} className='outline-none rounded-md'
          />
         <button
  onClick={handleDateTimeAdd}
          className="bg-primary text-white px-3 py-2 text-sm rounded-lg hover:bg-primary-dull cursor-pointer border border-primary/40 font-semibold shadow-[0_10px_20px_-12px_rgba(248,69,101,0.8)] transition"
>
  Add Time
</button>

      </div>
    </div>

{Object.keys(dateTimeSelection).length > 0 && (
  <div className='mt-6'>
    <h2 className='mb-2'>Selected Date-Time</h2>
    <ul className='space-y-3'>{Object.entries(dateTimeSelection).map(([date, times]) => (
      <li key={date}>
        <div className='font-medium'>{date}</div>
        <div className='flex flex-wrap gap-2 mt-1 text-sm'>{
          times.map((time) => (
            <div key={time} className='border border-primary px-2 py-1 flex items-center rounded'>
              <span>{time}</span>
              <DeleteIcon onClick={() => handleRemoveTime(date, time)} width={15} className='ml-2 text-red-500 hover:text-red-700 cursor-pointer' />
            </div>
          ))}
        </div>
      </li>
    ))}
    </ul>
    </div>

)}
<button onClick={onAddShow} disabled={isSubmitting} className='bg-primary text-white px-8 py-2 mt-6 rounded hover:bg-primary-dull transition-all cursor-pointer disabled:opacity-60 border border-primary/40 font-semibold shadow-[0_12px_24px_-12px_rgba(248,69,101,0.85)]'>{isSubmitting ? 'Adding...' : 'Add Shows'}</button>
    </>
  ) : <Loding />
}
export default AddShows;