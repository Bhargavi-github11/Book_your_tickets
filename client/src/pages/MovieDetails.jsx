import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { Heart, PlayCircle, StarIcon, XIcon } from 'lucide-react'
import timeFormat from '../lib/timeFormat'
import BlurCircle from '../components/BlurCircle'
import DateSelection from '../components/DateSelection'
import MoviesCard from '../components/MoviesCard'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const MovieDetailsSkeleton = () => (
  <div className='px-6 md:px-16 lg:px-40 pt-20'>
    <div className='flex flex-col md:flex-row gap-8 max-w-6xl mx-auto'>
      <div className='shimmer rounded-xl h-104 max-w-70 w-full'></div>

      <div className='relative flex-1 flex flex-col gap-4'>
        <div className='shimmer h-5 w-20 rounded'></div>
        <div className='shimmer h-10 w-3/4 rounded'></div>
        <div className='shimmer h-5 w-40 rounded'></div>
        <div className='shimmer h-4 w-full rounded'></div>
        <div className='shimmer h-4 w-11/12 rounded'></div>
        <div className='shimmer h-4 w-2/3 rounded'></div>
        <div className='flex gap-4 mt-2'>
          <div className='shimmer h-11 w-40 rounded-md'></div>
          <div className='shimmer h-11 w-32 rounded-md'></div>
          <div className='shimmer h-11 w-11 rounded-full'></div>
        </div>
      </div>
    </div>

    <div className='max-w-6xl mx-auto mt-20'>
      <div className='shimmer h-6 w-48 rounded mb-6'></div>
      <div className='flex gap-6 overflow-x-auto pb-4 no-scrollbar'>
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className='w-24 shrink-0 flex flex-col items-center'>
            <div className='shimmer h-20 w-20 rounded-full'></div>
            <div className='shimmer h-3 w-20 rounded mt-2'></div>
          </div>
        ))}
      </div>
    </div>
  </div>
)

const buildDateTimeData = () => {
  const today = new Date();
  const slots = ["10:00", "13:00", "16:00", "19:00"];
  const result = {};

  for (let dayOffset = 0; dayOffset < 4; dayOffset += 1) {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);

    const dateKey = date.toISOString().slice(0, 10);

    result[dateKey] = slots.map((time, index) => {
      const [hours, minutes] = time.split(":");
      const slotDate = new Date(date);
      slotDate.setHours(Number(hours), Number(minutes), 0, 0);

      return {
        time: slotDate.toISOString(),
        showId: `${dateKey}-${index}`,
      };
    });
  }

  return result;
};

const MovieDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [movie, setMovie] = useState(null)
  const [dateTimeData, setDateTimeData] = useState({})
  const [loading, setLoading] = useState(true)
  const [isTrailerOpen, setIsTrailerOpen] = useState(false)
  const [trailerKey, setTrailerKey] = useState('')
  const [trailerLoading, setTrailerLoading] = useState(false)
  const { shows, isFavoriteMovie, updateFavoriteMovie, axios } = useAppContext()

  const onBuyTickets = () => {
    const dateSection = document.getElementById('dateSelect')
    if (dateSection) {
      dateSection.scrollIntoView({ behavior: 'smooth', block: 'start' })
      return
    }
    navigate(`/movies/${id}`)
  }

  const handleWatchTrailer = async () => {
    if (!movie?._id) return

    try {
      setTrailerLoading(true)
      const { data } = await axios.get(`/api/show/trailer/${movie._id}`)

      if (data.success && data.trailer?.key) {
        setTrailerKey(data.trailer.key)
        setIsTrailerOpen(true)
      } else {
        toast.error(data.message || 'Trailer not available')
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setTrailerLoading(false)
    }
  }

  useEffect(() => {
    const fetchMovie = async () => {
      try {
        setLoading(true)
        const foundMovie = shows.find((item) => String(item._id) === String(id))

        if (foundMovie) {
          setMovie(foundMovie)
          setDateTimeData(buildDateTimeData())
          return
        }

        const { data } = await axios.get(`/api/show/${id}`)
        if (data.success && data.movie) {
          setMovie(data.movie)
          setDateTimeData(buildDateTimeData())
        } else {
          toast.error(data.message || 'Movie not found')
          setMovie(null)
        }
      } catch (error) {
        toast.error(error?.response?.data?.message || error.message)
        setMovie(null)
      } finally {
        setLoading(false)
      }
    }

    fetchMovie()
  }, [id, shows])

  if (loading) return <MovieDetailsSkeleton />

  if (!movie) {
    return (
      <div className='flex flex-col items-center justify-center h-screen px-6'>
        <h1 className='text-2xl font-semibold text-center'>Movie not found</h1>
        <button onClick={() => navigate('/movies')} className='mt-4 px-6 py-2 rounded-md bg-primary cursor-pointer'>Back to Movies</button>
      </div>
    )
  }

  const isMovieFavorite = isFavoriteMovie(movie._id)

  return (
    <div className="px-6 md:px-16 lg:px-40 pt-20">

      {/* TOP SECTION */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">
        <img
          src={movie.poster_path}
          alt={movie.title}
          className="rounded-xl h-104 max-w-70 object-cover"
        />

        <div className="relative flex flex-col gap-3">
          <BlurCircle top="-100px" left="-100px" />

          <p className="text-primary uppercase">English</p>

          <h1 className="text-4xl font-semibold">
            {movie.title}
          </h1>

          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 text-primary fill-primary" />
            {movie.vote_average} User Rating
          </div>

          <p className="text-gray-400 text-sm max-w-xl">
            {movie.overview}
          </p>

          <p className="text-sm text-gray-300">
            {timeFormat(movie.runtime)} •{" "}
            {(movie.genres || []).map(g => g.name).join(', ') || 'Genre N/A'} •{" "}
            {(movie.release_date || '').split('-')[0] || 'N/A'}
          </p>

          <div className="flex gap-4 mt-4">
            <button onClick={handleWatchTrailer} disabled={trailerLoading} className="flex items-center gap-2 px-6 py-3 bg-gray-800 rounded-md cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed">
              <PlayCircle className="w-5 h-5" />
              {trailerLoading ? 'Loading...' : 'Watch Trailer'}
            </button>

            <button onClick={onBuyTickets} className="px-8 py-3 bg-primary rounded-md cursor-pointer">
              Buy Tickets
            </button>

            <button onClick={() => updateFavoriteMovie(movie)} className="bg-gray-700 p-2.5 rounded-full cursor-pointer">
              <Heart className={`w-5 h-5 ${isMovieFavorite ? 'fill-primary text-primary' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* CAST */}
      <div className="max-w-6xl mx-auto mt-20">
        <p className="text-lg font-medium mb-6">Your Favorite Cast</p>

        <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
          {(movie.casts || []).slice(0, 12).map((cast, index) => (
            <div key={index}  className="flex flex-col items-center text-center w-24 shrink-0">
              <img
                src={cast.profile_path}
                className="h-20 w-20 rounded-full object-cover"
              />
              <p className="mt-2 text-sm font-medium">{cast.name}</p>
            </div>
          ))}
        </div>
      </div>
      <DateSelection dateTime={dateTimeData} id={id} />
      
      <p className='text-lg font-medium mt-20 mb-8'>You May Also Like</p>
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {shows.filter((item) => String(item._id) !== String(id)).slice(0,4).map((movie,index)=>(
          <MoviesCard key={index} movie={movie} />
        ))}
      </div>
      <div className='flex justify-center mt-20'>
        <button onClick={()=> {navigate('/movies');scrollTo(0,0)}} className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'> Show More</button>
      </div>

      {isTrailerOpen && (
        <div className='fixed inset-0 z-50 bg-black/80 flex items-center justify-center px-4'>
          <div className='w-full max-w-4xl bg-black rounded-xl overflow-hidden border border-primary/30'>
            <div className='flex items-center justify-between px-4 py-3 bg-primary/10'>
              <p className='font-medium'>{movie.title} Trailer</p>
              <button onClick={() => setIsTrailerOpen(false)} className='p-1 rounded hover:bg-white/10 cursor-pointer'>
                <XIcon className='w-5 h-5' />
              </button>
            </div>
            <div className='aspect-video'>
              <iframe
                className='w-full h-full'
                src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1`}
                title='Movie Trailer'
                frameBorder='0'
                allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

export default MovieDetails
