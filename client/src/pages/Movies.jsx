import React, { useEffect, useState } from 'react'
import MoviesCard from '../components/MoviesCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'
import { useSearchParams } from 'react-router-dom'
const Movies = () => {
  const { axios } = useAppContext()
  const [searchParams, setSearchParams] = useSearchParams()
  const [movies, setMovies] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState('')
  const [activeSearch, setActiveSearch] = useState('')

  const fetchMoviesPage = async (page, searchValue = activeSearch) => {
    try {
      setLoading(true)
      const searchQuery = String(searchValue || '').trim()
      const encodedSearch = encodeURIComponent(searchQuery)
      const requestUrl = searchQuery
        ? `/api/show/all?page=${page}&search=${encodedSearch}`
        : `/api/show/all?page=${page}`

      const { data } = await axios.get(requestUrl)

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
    const querySearch = String(searchParams.get('search') || '').trim()
    setSearchInput(querySearch)
    setActiveSearch(querySearch)
    fetchMoviesPage(1, querySearch)
  }, [searchParams])

  const onSearch = (event) => {
    event.preventDefault()
    const normalized = searchInput.trim()

    if (normalized) {
      setSearchParams({ search: normalized })
    } else {
      setSearchParams({})
    }
  }

  const onNext = () => {
    if (currentPage < totalPages) {
      fetchMoviesPage(currentPage + 1, activeSearch)
      scrollTo(0, 0)
    }
  }

  const onPrev = () => {
    if (currentPage > 1) {
      fetchMoviesPage(currentPage - 1, activeSearch)
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
      <div className='flex flex-col gap-4 md:flex-row md:items-center md:justify-between my-4'>
        <h1 className='text-lg font-medium'>{activeSearch ? `Search Results for "${activeSearch}"` : 'Now Showing'}</h1>
        <form onSubmit={onSearch} className='flex items-center gap-2'>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder='Search movie by name'
            className='w-56 md:w-72 px-4 py-2 rounded-full border border-primary/35 bg-black/30 outline-none focus:border-primary'
          />
          <button
            type='submit'
            className='px-5 py-2 rounded-full bg-primary hover:bg-primary-dull font-medium transition cursor-pointer'
          >
            Search
          </button>
        </form>
      </div>
      <div className='flex flex-wrap max-sm:justify-center gap-8 '>
        {movies.map((movie)=>(
          <MoviesCard movie={movie} key={movie._id} />
        ))}
      </div>

      <div className='flex items-center justify-center gap-3 mt-10'>
        <button
          onClick={onPrev}
          disabled={currentPage === 1 || loading}
          className='px-5 py-2 rounded-md border border-primary/40 bg-primary/20 hover:bg-primary/30 font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
        >
          Previous
        </button>
        <p className='text-sm text-gray-300'>Page {currentPage} of {totalPages}</p>
        <button
          onClick={onNext}
          disabled={currentPage >= totalPages || loading}
          className='px-5 py-2 rounded-md bg-primary hover:bg-primary-dull border border-primary/40 shadow-[0_10px_22px_-12px_rgba(248,69,101,0.8)] font-semibold transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed'
        >
          Next
        </button>
      </div>
    </div>
  ) :(
    <div className='flex flex-col items-center justify-center h-screen px-6'>
      <h1 className='text-3xl font-bold text-center'>
        {activeSearch ? `No movies found for "${activeSearch}"` : 'No movies available'}
      </h1>
      <form onSubmit={onSearch} className='mt-6 flex items-center gap-2'>
        <input
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          placeholder='Search movie by name'
          className='w-56 md:w-72 px-4 py-2 rounded-full border border-primary/35 bg-black/30 outline-none focus:border-primary'
        />
        <button
          type='submit'
          className='px-5 py-2 rounded-full bg-primary hover:bg-primary-dull font-medium transition cursor-pointer'
        >
          Search
        </button>
      </form>
    </div>
  )
}
export default Movies