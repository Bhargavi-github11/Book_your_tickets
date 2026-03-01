import React from 'react'
import MoviesCard from '../components/MoviesCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'

const Favorite = () => {
  const { user, favoriteMovies } = useAppContext()

  if (!user) {
    return (
      <div className='flex flex-col items-center justify-center h-screen px-6 text-center'>
        <h1 className='text-3xl font-bold'>Please login to view favorites</h1>
      </div>
    )
  }

  return favoriteMovies.length > 0 ? (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <BlurCircle top='150px' left='0px' />
      <BlurCircle bottom='50px' right='50px' />
      <h1 className='text-lg font-medium  my-4'>Your Favorite Movies</h1>
      <div className='flex flex-wrap max-sm:justify-center gap-8 '>
        {favoriteMovies.map((movie)=>(
          <MoviesCard movie={movie} key={movie._id} />
        ))}
      </div>
    </div>
  ) :(
    <div className='flex flex-col items-center justify-center h-screen px-6 text-center'>
      <h1 className='text-3xl font-bold'>No favorite movies yet</h1>
      <p className='text-gray-400 mt-2'>Tap the heart icon on a movie to add it here.</p>
    </div>
  )
}
export default Favorite