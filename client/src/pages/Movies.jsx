import React, { useEffect, useState } from 'react'
import MoviesCard from '../components/MoviesCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
const Movies = () => {
  const { axios } = useAppContext()
  const [movies, setMovies] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)

  const fetchMoviesPage = async (page) => {
    try {
      setLoading(true)
      const { data } = await axios.get(`/api/show/all?page=${page}`)

      if (data.success) {
        setMovies(Array.isArray(data.shows) ? data.shows : [])
        setCurrentPage(Number(data.page || page))
        setTotalPages(Number(data.totalPages || 1))
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error?.response?.data?.message || error.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMoviesPage(1)
  }, [])

  const onNext = () => {
    if (currentPage < totalPages) {
      fetchMoviesPage(currentPage + 1)
      scrollTo(0, 0)
    }
  }

  const onPrev = () => {
    if (currentPage > 1) {
      fetchMoviesPage(currentPage - 1)
      scrollTo(0, 0)
    }
  }

  if (loading) {
    return (
      <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
        <BlurCircle top='150px' left='0px' />
        <BlurCircle bottom='50px' right='50px' />
        <div className='shimmer h-7 w-44 rounded mb-7'></div>
        <div className='flex flex-wrap max-sm:justify-center gap-8'>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className='w-[220px] rounded-xl border border-primary/20 bg-primary/5 p-3'>
              <div className='shimmer h-72 rounded-lg'></div>
              <div className='shimmer h-4 w-3/4 mt-4 rounded'></div>
              <div className='shimmer h-3 w-1/2 mt-3 rounded'></div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return movies.length > 0 ? (
    <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
      <BlurCircle top='150px' left='0px' />
      <BlurCircle bottom='50px' right='50px' />
      <h1 className='text-lg font-medium  my-4'>Now Showing</h1>
      <div className='flex flex-wrap max-sm:justify-center gap-8 '>
        {movies.map((movie)=>(
          <MoviesCard movie={movie} key={movie._id} />
        ))}
      </div>

      <div className='flex items-center justify-center gap-3 mt-10'>
        <button
          onClick={onPrev}
          disabled={currentPage === 1 || loading}
          className='px-5 py-2 rounded-md border border-primary/30 disabled:opacity-40'
        >
          Previous
        </button>
        <p className='text-sm text-gray-300'>Page {currentPage} of {totalPages}</p>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages || loading}
          className='px-5 py-2 rounded-md bg-primary hover:bg-primary-dull disabled:opacity-40'
        >
          Next
        </button>
      </div>
    </div>
  ) :(
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-bold text-center'>No movies available</h1>
    </div>
  )
}
export default Movies