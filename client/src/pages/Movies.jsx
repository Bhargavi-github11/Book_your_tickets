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
        <div className='shimmer-premium h-7 w-44 rounded-md mb-7'></div>
        <div className='flex flex-wrap max-sm:justify-center gap-8'>
          {Array.from({ length: 8 }).map((_, index) => (
            <div key={index} className='flex flex-col justify-between p-3 bg-gray-800 rounded-2xl w-66 border border-primary/15'>
              <div>
                <div className='shimmer-premium rounded-lg h-52 w-full'></div>
                <div className='shimmer-premium h-5 w-4/5 mt-3 rounded'></div>
                <div className='shimmer-premium h-3.5 w-full mt-3 rounded'></div>
              </div>

              <div className='flex items-center justify-between mt-4 pb-3'>
                <div className='shimmer-premium h-8 w-24 rounded-full'></div>
                <div className='shimmer-premium h-4 w-12 rounded'></div>
              </div>
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
          className='px-5 py-2 rounded-md border border-primary/30 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
        >
          Previous
        </button>
        <p className='text-sm text-gray-300'>Page {currentPage} of {totalPages}</p>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages || loading}
          className='px-5 py-2 rounded-md bg-primary hover:bg-primary-dull cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
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