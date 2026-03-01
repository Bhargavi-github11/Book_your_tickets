import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { dummyShowsData,dummyDateTimeData } from '../assets/assets'
import { Heart, PlayCircle, StarIcon } from 'lucide-react'
import timeFormat from '../lib/timeFormat'
import BlurCircle from '../components/BlurCircle'
import DateSelection from '../components/DateSelection'
import MoviesCard from '../components/MoviesCard'
import Londing from '../components/Loding'

const MovieDetails = () => {
  const navigate = useNavigate()
  const { id } = useParams()
  const [movie, setMovie] = useState(null)

  useEffect(() => {
    const foundMovie = dummyShowsData.find(
      m => m.id === Number(id)
    )
    setMovie(foundMovie || null)
  }, [id])

  if (!movie) {
    return <Londing />
  }

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
            {movie.genres.map(g => g.name).join(', ')} •{" "}
            {movie.release_date.split('-')[0]}
          </p>

          <div className="flex gap-4 mt-4">
            <button className="flex items-center gap-2 px-6 py-3 bg-gray-800 rounded-md">
              <PlayCircle className="w-5 h-5" />
              Watch Trailer
            </button>

            <button className="px-8 py-3 bg-primary rounded-md">
              Buy Tickets
            </button>

            <button className="bg-gray-700 p-2.5 rounded-full">
              <Heart className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* CAST */}
      <div className="max-w-6xl mx-auto mt-20">
        <p className="text-lg font-medium mb-6">Your Favorite Cast</p>

        <div className="flex gap-6 overflow-x-auto pb-4 no-scrollbar">
          {movie.casts.slice(0, 12).map((cast, index) => (
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
      <DateSelection dateTime={dummyDateTimeData} id={id} />
      
      <p className='text-lg font-medium mt-20 mb-8'>You May Also Like</p>
      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {dummyShowsData.slice(0,4).map((movie,index)=>(
          <MoviesCard key={index} movie={movie} />
        ))}
      </div>
      <div className='flex justify-center mt-20'>
        <button onClick={()=> {navigate('/movies');scrollTo(0,0)}} className='px-10 py-3 text-sm bg-primary hover:bg-primary-dull transition rounded-md font-medium cursor-pointer'> Show More</button>
      </div>

    </div>
  )
}

export default MovieDetails
