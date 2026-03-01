import React, { useEffect, useState } from 'react'
import MoviesCard from '../components/MoviesCard'
import BlurCircle from '../components/BlurCircle'
import { useAppContext } from '../context/AppContext'
import toast from 'react-hot-toast'

const genreOptions = [
  { label: 'All Genres', value: '' },
  { label: 'Action', value: '28' },
  { label: 'Adventure', value: '12' },
  { label: 'Animation', value: '16' },
  { label: 'Comedy', value: '35' },
  { label: 'Crime', value: '80' },
  { label: 'Drama', value: '18' },
  { label: 'Fantasy', value: '14' },
  { label: 'Horror', value: '27' },
  { label: 'Romance', value: '10749' },
  { label: 'Sci-Fi', value: '878' },
  { label: 'Thriller', value: '53' },
]

const languageOptions = [
  { label: 'All Languages', value: '' },
  { label: 'English', value: 'en' },
  { label: 'Hindi', value: 'hi' },
  { label: 'Tamil', value: 'ta' },
  { label: 'Telugu', value: 'te' },
  { label: 'Korean', value: 'ko' },
  { label: 'Japanese', value: 'ja' },
]

const Releases = () => {
  const { axios } = useAppContext()
  const [movies, setMovies] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(true)
  const [genre, setGenre] = useState('')
  const [language, setLanguage] = useState('')
  const [year, setYear] = useState('')

  const years = Array.from({ length: 12 }, (_, index) => String(new Date().getFullYear() - index))

  const fetchReleasesPage = async (page) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({ page: String(page) })
      if (genre) params.set('genre', genre)
      if (language) params.set('language', language)
      if (year) params.set('year', year)

      const { data } = await axios.get(`/api/show/releases?${params.toString()}`)

      if (data.success) {
        setMovies(Array.isArray(data.movies) ? data.movies : [])
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
    fetchReleasesPage(1)
  }, [genre, language, year])

  const onResetFilters = () => {
    setGenre('')
    setLanguage('')
    setYear('')
  }

  const onNext = () => {
    if (currentPage < totalPages) {
      fetchReleasesPage(currentPage + 1)
      scrollTo(0, 0)
    }
  }

  const onPrev = () => {
    if (currentPage > 1) {
      fetchReleasesPage(currentPage - 1)
      scrollTo(0, 0)
    }
  }

  if (loading) {
    return (
      <div className='relative my-40 mb-60 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]'>
        <BlurCircle top='150px' left='0px' />
        <BlurCircle bottom='50px' right='50px' />
        <div className='shimmer-premium h-7 w-56 rounded-md mb-7'></div>
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
      <h1 className='text-lg font-medium my-4'>Upcoming Releases</h1>

      <div className='flex flex-wrap gap-3 mb-7'>
        <select value={genre} onChange={(e) => setGenre(e.target.value)} className='bg-black/30 border border-primary/30 rounded-md px-3 py-2 text-sm outline-none'>
          {genreOptions.map((item) => (
            <option key={item.value || 'all'} value={item.value}>{item.label}</option>
          ))}
        </select>

        <select value={language} onChange={(e) => setLanguage(e.target.value)} className='bg-black/30 border border-primary/30 rounded-md px-3 py-2 text-sm outline-none'>
          {languageOptions.map((item) => (
            <option key={item.value || 'all'} value={item.value}>{item.label}</option>
          ))}
        </select>

        <select value={year} onChange={(e) => setYear(e.target.value)} className='bg-black/30 border border-primary/30 rounded-md px-3 py-2 text-sm outline-none'>
          <option value=''>All Years</option>
          {years.map((item) => (
            <option key={item} value={item}>{item}</option>
          ))}
        </select>

        <button onClick={onResetFilters} className='px-4 py-2 rounded-md border border-primary/30 text-sm cursor-pointer'>Reset</button>
      </div>

      <div className='flex flex-wrap max-sm:justify-center gap-8'>
        {movies.map((movie) => (
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
  ) : (
    <div className='flex flex-col items-center justify-center h-screen'>
      <h1 className='text-3xl font-bold text-center'>No releases available</h1>
    </div>
  )
}

export default Releases
